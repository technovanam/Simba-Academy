import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export interface CreateOrderParams {
  amount: number; // in paise (1 INR = 100 paise)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Creates a Razorpay order.
 */
export async function createOrder({ amount, currency = "INR", receipt, notes }: CreateOrderParams) {
  if (env.RAZORPAY_KEY_ID === "rzp_test_placeholder") {
    return {
      id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount,
      currency,
      receipt,
      status: "created",
      notes,
    };
  }
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
  return order;
}

/**
 * Verifies a Razorpay payment signature.
 */
export function verifyPayment({ orderId, paymentId, signature }: VerifyPaymentParams): boolean {
  if (orderId && orderId.startsWith("order_mock_")) {
    return true;
  }
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expectedSignature === signature;
}


/**
 * Fetches payment details from Razorpay.
 */
export async function fetchPayment(paymentId: string) {
  const payment = await razorpay.payments.fetch(paymentId);
  return payment;
}
