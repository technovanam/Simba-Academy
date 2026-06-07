export interface ZohoCheckoutConfig {
  accountId: string;
  apiKey: string;
  domain: string;
  isTestMode?: boolean;
  isPlaceholder?: boolean;
}

export interface ZohoPaymentSession {
  paymentSessionId: string;
  orderId: string;
  amount: number;
  amountInr: number;
  amountString: string;
  currency: string;
  accountId: string;
  apiKey: string;
  domain: string;
  isTestMode?: boolean;
  isPlaceholder?: boolean;
}

export interface ZohoWidgetPaymentResult {
  payment_id: string;
  payments_session_id: string;
  signature: string;
}

/** Zoho widget often returns only payment_id + signature — session comes from our order. */
export function normalizeZohoWidgetResult(
  raw: Record<string, unknown>,
  fallbackSessionId: string
): ZohoWidgetPaymentResult {
  const payment_id = String(raw.payment_id ?? raw.paymentId ?? "").trim();
  const payments_session_id = String(
    raw.payments_session_id ?? raw.payment_session_id ?? fallbackSessionId
  ).trim();
  const signature = String(raw.signature ?? "").trim();

  if (!payment_id) {
    throw new Error("Payment did not complete. No payment ID was returned.");
  }
  if (!signature) {
    throw new Error(
      "Payment completed but no signature was returned. Check Zoho Signing Key in Developer Space."
    );
  }
  if (!payments_session_id) {
    throw new Error("Payment session is missing. Please try again.");
  }

  return { payment_id, payments_session_id, signature };
}

const ZOHO_SCRIPT = "https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js";

let scriptPromise: Promise<boolean> | null = null;
type ZohoWidget = {
  requestPaymentMethod: (o: Record<string, unknown>) => Promise<ZohoWidgetPaymentResult>;
  close: () => Promise<void>;
};
let widgetInstance: ZohoWidget | null = null;
let activeWidgetKey: string | null = null;

function buildWidgetKey(config: ZohoCheckoutConfig): string {
  return `${config.accountId}:${config.domain}:${config.isTestMode ? "test" : "live"}`;
}

function formatZohoCheckoutError(err: unknown): Error {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err ?? "Payment failed");

  if (
    /handshake|401|paymentssandbox|encryption\/server\/key/i.test(raw) ||
    raw.includes("PromiseReject")
  ) {
    return new Error(
      "Zoho payment widget could not start. Production API keys require ZOHO_PAYMENTS_TEST_MODE=false. Sandbox needs separate Zoho sandbox credentials."
    );
  }

  return err instanceof Error ? err : new Error(raw);
}

export function loadZohoPaymentsScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { ZPayments?: unknown }).ZPayments) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${ZOHO_SCRIPT}"]`);
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = ZOHO_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptPromise;
}

async function getWidgetInstance(config: ZohoCheckoutConfig) {
  const loaded = await loadZohoPaymentsScript();
  if (!loaded) {
    throw new Error("Zoho Payments script failed to load. Check your internet connection.");
  }

  const ZPayments = (window as unknown as { ZPayments: new (c: Record<string, unknown>) => typeof widgetInstance }).ZPayments;
  if (!ZPayments) {
    throw new Error("Zoho Payments is not available on this page.");
  }

  const key = buildWidgetKey(config);
  if (!widgetInstance || activeWidgetKey !== key) {
    if (widgetInstance) {
      try {
        await widgetInstance.close();
      } catch {
        /* ignore */
      }
      widgetInstance = null;
    }
    widgetInstance = new ZPayments({
      account_id: config.accountId,
      domain: config.domain || "IN",
      otherOptions: {
        api_key: config.apiKey,
        ...(config.isTestMode ? { is_test_mode: true } : {}),
      },
    }) as ZohoWidget;
    activeWidgetKey = key;
  }

  return widgetInstance;
}

export interface OpenZohoCheckoutOptions {
  session: ZohoPaymentSession;
  business?: string;
  description: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  customer?: { name?: string; email?: string; phone?: string };
}

export async function openZohoCheckout(options: OpenZohoCheckoutOptions): Promise<ZohoWidgetPaymentResult> {
  const { session, description, business = "Simba Academy", customer } = options;
  const config: ZohoCheckoutConfig = {
    accountId: session.accountId,
    apiKey: session.apiKey,
    domain: session.domain,
    isTestMode: session.isTestMode,
    isPlaceholder: session.isPlaceholder,
  };

  const instance = await getWidgetInstance(config);
  if (!instance) {
    throw new Error("Could not initialise Zoho Payments.");
  }

  try {
    const data = await instance.requestPaymentMethod({
      amount: session.amountString,
      currency_code: session.currency,
      payments_session_id: session.paymentSessionId,
      currency_symbol: "₹",
      business,
      description,
      invoice_number: options.invoiceNumber,
      reference_number: options.referenceNumber,
      address: {
        name: customer?.name,
        email: customer?.email,
        phone: customer?.phone,
      },
    });
    return normalizeZohoWidgetResult(
      (data ?? {}) as unknown as Record<string, unknown>,
      session.paymentSessionId
    );
  } catch (err) {
    throw formatZohoCheckoutError(err);
  } finally {
    try {
      await instance.close();
    } catch {
      /* ignore */
    }
  }
}
