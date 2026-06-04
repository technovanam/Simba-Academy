import {
  createPaymentSession,
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
    description: params.description ?? "Simba Academy payment",
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

export type { CreatePaymentSessionParams, VerifyPaymentParams };
