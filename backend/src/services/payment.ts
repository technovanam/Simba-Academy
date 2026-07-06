import {
  createPaymentSession,
  retrievePaymentSession,
  verifyPaymentSignature,
  type CreatePaymentSessionParams,
  type VerifyPaymentParams,
} from "./zohoPayments.js";

/** @deprecated Use createPaymentSession — kept for route compatibility */
export async function createOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  description?: string;
}) {
  const amountInr = params.amount / 100;
  const session = await createPaymentSession({
    amountInr,
    currency: params.currency,
    description: params.description ?? "Simba Preschool payment",
    referenceNumber: params.receipt,
    meta: params.notes
      ? Object.entries(params.notes).slice(0, 5).map(([key, value]) => ({
          key: key.slice(0, 20),
          value: value.slice(0, 500),
        }))
      : undefined,
  });

  return {
    id: session.paymentsSessionId,
    amount: Math.round(session.amount * 100),
    amountInr: session.amount,
    amountString: session.amountString,
    currency: session.currency,
  };
}

export function verifyPayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return verifyPaymentSignature({
    paymentSessionId: params.orderId,
    paymentId: params.paymentId,
    signature: params.signature,
  });
}

function isPaidZohoSession(session: Record<string, unknown>, paymentId: string): boolean {
  const status = String(session.status ?? "").toLowerCase();
  const sessionPaid = status === "succeeded" || status === "success" || status === "paid";
  if (!sessionPaid) return false;

  const payments = session.payments;
  if (!Array.isArray(payments) || payments.length === 0) {
    return Boolean(paymentId);
  }

  return payments.some(
    (p) => String((p as Record<string, unknown>).payment_id ?? "") === paymentId
  );
}

/** Signature check first; if that fails, confirm payment via Zoho session API. */
export async function verifyPaymentWithFallback(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  if (
    verifyPaymentSignature({
      paymentSessionId: params.orderId,
      paymentId: params.paymentId,
      signature: params.signature,
    })
  ) {
    return true;
  }

  if (params.orderId.startsWith("zoho_session_mock_")) {
    return false;
  }

  try {
    const raw = (await retrievePaymentSession(params.orderId)) as Record<string, unknown>;
    return isPaidZohoSession(raw, params.paymentId);
  } catch (err) {
    console.error("Zoho session verification fallback failed:", err);
    return false;
  }
}

export type { CreatePaymentSessionParams, VerifyPaymentParams };
