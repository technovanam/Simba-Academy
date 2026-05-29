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

    if (typeof amount !== "number" || amount < 1) {
      throw new AppError("Amount must be a valid number greater than 0", 400);
    }

    // Verify course exists if provided
    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }
    }

    const order = await createOrder({
      amount: Math.round(amount * 100), // Convert to paise
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { userId, courseId: courseId ?? "" },
    });

    // Save pending payment record
    await prisma.payment.create({
      data: {
        amount,
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

export default router;
