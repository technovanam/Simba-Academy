import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";
import { createOrder, verifyPayment } from "../services/payment.js";
import { getZohoCheckoutConfig } from "../services/zohoPayments.js";
import { sendEmail, getPaymentSuccessHtml } from "../services/email.js";
import { AppError } from "../utils/errors.js";

const router = Router();

function checkoutPayload(session: {
  id: string;
  amount: number;
  amountInr?: number;
  amountString?: string;
  currency: string;
}) {
  const zoho = getZohoCheckoutConfig();
  return {
    paymentSessionId: session.id,
    orderId: session.id,
    amount: session.amount,
    amountInr: session.amountInr ?? session.amount / 100,
    amountString: session.amountString ?? ((session.amountInr ?? session.amount / 100).toFixed(2)),
    currency: session.currency,
    ...zoho,
  };
}

// ── Create Order (authenticated) ────────────────────────────────────
router.post("/create-order", authenticate, async (req, res, next) => {
  try {
    const { amount, courseId } = req.body;
    const userId = req.user!.userId;

    let finalAmount: number;
    let description = "Simba Academy payment";

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }
      if (course.price == null || course.price < 1) {
        throw new AppError("This course is not available for online payment", 400);
      }
      finalAmount = course.price;
      description = `Course enrollment: ${course.title}`;
    } else {
      if (typeof amount !== "number" || amount < 1) {
        throw new AppError("Amount must be a valid number greater than 0", 400);
      }
      finalAmount = amount;
    }

    const order = await createOrder({
      amount: Math.round(finalAmount * 100),
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { userId, courseId: courseId ?? "" },
      description,
    });

    await prisma.payment.create({
      data: {
        amount: finalAmount,
        paymentSessionId: order.id,
        userId,
        courseId: courseId ?? null,
        status: "PENDING",
      },
    });

    res.json(checkoutPayload(order));
  } catch (err) {
    next(err);
  }
});

// ── Verify Payment ───────────────────────────────────────────────────
router.post("/verify", authenticate, async (req, res, next) => {
  try {
    const paymentSessionId = req.body.paymentSessionId ?? req.body.razorpayOrderId;
    const paymentId = req.body.paymentId ?? req.body.razorpayPaymentId;
    const signature = req.body.signature ?? req.body.razorpaySignature;

    if (!paymentSessionId || !paymentId || !signature) {
      throw new AppError("Missing payment verification fields", 400);
    }

    const existing = await prisma.payment.findUnique({
      where: { paymentSessionId },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });
    if (!existing) {
      throw new AppError("Payment record not found", 404);
    }
    if (existing.status === "SUCCESS") {
      res.json({ success: true, payment: existing });
      return;
    }

    const isValid = verifyPayment({
      orderId: paymentSessionId,
      paymentId,
      signature,
    });

    if (!isValid) {
      await prisma.payment.updateMany({
        where: { paymentSessionId },
        data: { status: "FAILED", gatewayPaymentId: paymentId },
      });
      throw new AppError("Payment verification failed", 400);
    }

    const payment = await prisma.payment.update({
      where: { paymentSessionId },
      data: {
        status: "SUCCESS",
        gatewayPaymentId: paymentId,
        paymentSignature: signature,
      },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    try {
      await sendEmail({
        to: payment.user.email,
        subject: "Payment Successful - Simba Academy",
        html: getPaymentSuccessHtml(payment.user.name, payment.amount, payment.course?.title),
      });
    } catch {
      console.error("Failed to send payment confirmation email");
    }

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

// ── Get Payment History ─────────────────────────────────────────────
router.get("/history", authenticate, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { title: true, slug: true } } },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// ── Get Payment by ID ───────────────────────────────────────────────
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: String(req.params.id),
        userId: req.user!.userId,
      },
      include: { course: { select: { title: true } } },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    res.json(payment);
  } catch (err) {
    next(err);
  }
});

// ── Create Pre-Register Order (Public) ────────────────────────────────
router.post("/create-pre-register-order", async (req, res, next) => {
  try {
    const flatAmount = 130;

    const order = await createOrder({
      amount: Math.round(flatAmount * 100),
      receipt: `pre_receipt_${Date.now()}`,
      notes: { type: "pre_register" },
      description: "Student Platform Registration Fee",
    });

    res.json(checkoutPayload(order));
  } catch (err) {
    next(err);
  }
});

export default router;
