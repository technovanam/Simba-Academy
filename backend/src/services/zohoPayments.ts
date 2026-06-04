import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

/** Maps Zoho Payments API errors to HTTP responses the frontend can show. */
function zohoApiError(
  json: Record<string, unknown>,
  status: number,
  fallback: string
): AppError {
  const message =
    (json.message as string | undefined) ??
    (json.error as string | undefined) ??
    fallback;
  const code = json.code as string | undefined;

  if (code === "payments_not_enabled") {
    return new AppError(
      "Zoho Payments is not activated on your merchant account yet. Email support@zohopayments.com to enable payment collection, then try again.",
      503
    );
  }

  if (status === 401 || status === 403) {
    return new AppError(message, status);
  }

  return new AppError(message, status >= 400 && status < 500 ? status : 502);
}

export interface CreatePaymentSessionParams {
  amountInr: number;
  currency?: string;
  description: string;
  referenceNumber?: string;
  invoiceNumber?: string;
  meta?: Array<{ key: string; value: string }>;
}

export interface VerifyPaymentParams {
  paymentSessionId: string;
  paymentId: string;
  signature: string;
}

interface OAuthTokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: OAuthTokenCache | null = null;

function isPlaceholderMode(): boolean {
  return (
    env.ZOHO_PAYMENTS_PLACEHOLDER ||
    env.ZOHO_PAYMENTS_API_KEY === "placeholder" ||
    !env.ZOHO_PAYMENTS_REFRESH_TOKEN ||
    env.ZOHO_PAYMENTS_REFRESH_TOKEN === "placeholder"
  );
}

async function getOAuthAccessToken(): Promise<string> {
  if (isPlaceholderMode()) {
    return "zoho_placeholder_token";
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    refresh_token: env.ZOHO_PAYMENTS_REFRESH_TOKEN,
    client_id: env.ZOHO_PAYMENTS_CLIENT_ID,
    client_secret: env.ZOHO_PAYMENTS_CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new AppError(data.error ?? `Zoho OAuth failed (${res.status})`, res.status >= 400 ? res.status : 502);
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

function unwrapSessionPayload(json: Record<string, unknown>) {
  const session =
    (json.payments_session as Record<string, unknown> | undefined) ??
    (json.payment_session as Record<string, unknown> | undefined) ??
    json;

  const paymentsSessionId = String(
    session.payments_session_id ?? session.payment_session_id ?? ""
  );

  return {
    paymentsSessionId,
    amount: session.amount != null ? String(session.amount) : undefined,
    currency: session.currency != null ? String(session.currency) : "INR",
    raw: session,
  };
}

/**
 * Creates a Zoho Payments session (replaces Razorpay order).
 */
export async function createPaymentSession({
  amountInr,
  currency = "INR",
  description,
  referenceNumber,
  invoiceNumber,
  meta,
}: CreatePaymentSessionParams) {
  const amount = Math.round(amountInr * 100) / 100;

  if (isPlaceholderMode()) {
    const id = `zoho_session_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      paymentsSessionId: id,
      amount,
      amountString: amount.toFixed(2),
      currency,
    };
  }

  const token = await getOAuthAccessToken();
  const url = new URL(`${env.ZOHO_PAYMENTS_API_URL}/paymentsessions`);
  url.searchParams.set("account_id", env.ZOHO_PAYMENTS_ACCOUNT_ID);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      description,
      reference_number: referenceNumber,
      invoice_number: invoiceNumber,
      meta_data: meta,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    throw zohoApiError(json, res.status, `Zoho payment session failed (${res.status})`);
  }

  const session = unwrapSessionPayload(json);
  if (!session.paymentsSessionId) {
    throw new AppError("Zoho payment session response missing payments_session_id", 502);
  }

  return {
    paymentsSessionId: session.paymentsSessionId,
    amount,
    amountString: session.amount ?? amount.toFixed(2),
    currency: session.currency,
  };
}

/**
 * Verifies widget signature: HMAC-SHA256 of `payment_id|payment_session_id`
 */
export function verifyPaymentSignature({
  paymentSessionId,
  paymentId,
  signature,
}: VerifyPaymentParams): boolean {
  if (paymentSessionId.startsWith("zoho_session_mock_")) {
    return Boolean(paymentId && signature);
  }

  if (!env.ZOHO_PAYMENTS_SIGNING_KEY || env.ZOHO_PAYMENTS_SIGNING_KEY === "placeholder") {
    console.warn("ZOHO_PAYMENTS_SIGNING_KEY not set — skipping signature verification");
    return true;
  }

  const payload = `${paymentId}|${paymentSessionId}`;
  const expected = crypto
    .createHmac("sha256", env.ZOHO_PAYMENTS_SIGNING_KEY)
    .update(payload)
    .digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return expected === signature;
  }
}

/** Retrieve session status from Zoho (fallback verification). */
export async function retrievePaymentSession(paymentSessionId: string) {
  if (isPlaceholderMode()) {
    return { status: "success", payments_session_id: paymentSessionId };
  }

  const token = await getOAuthAccessToken();
  const url = new URL(
    `${env.ZOHO_PAYMENTS_API_URL}/paymentsessions/${encodeURIComponent(paymentSessionId)}`
  );
  url.searchParams.set("account_id", env.ZOHO_PAYMENTS_ACCOUNT_ID);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw zohoApiError(json, res.status, `Failed to retrieve Zoho session (${res.status})`);
  }

  return unwrapSessionPayload(json).raw;
}

export function getZohoCheckoutConfig() {
  return {
    accountId: env.ZOHO_PAYMENTS_ACCOUNT_ID,
    apiKey: env.ZOHO_PAYMENTS_API_KEY,
    domain: env.ZOHO_PAYMENTS_DOMAIN,
    isTestMode: env.ZOHO_PAYMENTS_TEST_MODE,
    isPlaceholder: isPlaceholderMode(),
  };
}
