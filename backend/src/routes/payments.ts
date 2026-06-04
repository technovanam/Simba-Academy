import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";
import { createOrder, verifyPayment } from "../services/payment.js";
import { sendEmail, getPaymentSuccessHtml } from "../services/email.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const router = Router();

// ── Create Order ─────────────────────────────────────────────────────
router.post("/create-order", authenticate, async (req, res, next) => {
  try {
    const { amount, courseId } = req.body;
    const userId = req.user!.userId;

    // The amount is determined server-side. For a course payment the price is
    // taken from the Course record so the client cannot dictate what it pays.
    let finalAmount: number;
    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }
      if (course.price == null || course.price < 1) {
        throw new AppError("This course is not available for online payment", 400);
      }
      finalAmount = course.price;
    } else {
      // General (non-course) fee — no server-side price to compare against.
      if (typeof amount !== "number" || amount < 1) {
        throw new AppError("Amount must be a valid number greater than 0", 400);
      }
      finalAmount = amount;
    }

    const order = await createOrder({
      amount: Math.round(finalAmount * 100), // Convert to paise
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { userId, courseId: courseId ?? "" },
    });

    // Save pending payment record
    await prisma.payment.create({
      data: {
        amount: finalAmount,
        razorpayOrderId: order.id,
        userId,
        courseId: courseId ?? null,
        status: "PENDING",
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
});

// ── Verify Payment ───────────────────────────────────────────────────
router.post("/verify", authenticate, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError("Missing payment verification fields", 400);
    }

    // Idempotency: if this order was already verified, return it without
    // re-processing (and without re-sending the confirmation email).
    const existing = await prisma.payment.findUnique({
      where: { razorpayOrderId },
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
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      // Mark payment as failed
      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: { status: "FAILED", razorpayPaymentId },
      });
      throw new AppError("Payment verification failed", 400);
    }

    // Update payment record
    const payment = await prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        status: "SUCCESS",
        razorpayPaymentId,
        razorpaySignature,
      },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: payment.user.email,
        subject: "Payment Successful - Simba Academy",
        html: getPaymentSuccessHtml(
          payment.user.name,
          payment.amount,
          payment.course?.title
        ),
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
    const flatAmount = 120; // 120 INR

    const order = await createOrder({
      amount: Math.round(flatAmount * 100), // Convert to paise
      receipt: `pre_receipt_${Date.now()}`,
      notes: { type: "pre_register" },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
