import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../config/schemas.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import { verifyPayment } from "../services/payment.js";
import { sendEmail, getPaymentSuccessHtml, getPasswordResetHtml } from "../services/email.js";
import { assertAccountCanAuthenticate } from "../utils/userAccess.js";
import { generateResetToken } from "../utils/password.js";

const router = Router();

// ── Register ─────────────────────────────────────────────────────────
router.post("/register", authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && !existing.isDeleted) {
      throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, password: hashedPassword, phone, role: "STUDENT", status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true, status: true },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ── Login ────────────────────────────────────────────────────────────
router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.isDeleted) {
      throw new AppError("Invalid email or password", 401);
    }

    try {
      assertAccountCanAuthenticate(user);
    } catch {
      throw new AppError("Account is deactivated", 403);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ── Get Profile ──────────────────────────────────────────────────────
router.get("/profile", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        mustChangePassword: true,
        status: true,
        createdAt: true,
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── Register With Payment (Public) ───────────────────────────────────
router.post("/register-with-payment", authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, phone, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!name || !email || !password || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError("Missing registration or payment verification fields", 400);
    }

    // 1. Verify email is not taken
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && !existing.isDeleted) {
      throw new AppError("Email already registered", 409);
    }

    // 2. Verify Razorpay payment signature
    const isValid = verifyPayment({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      throw new AppError("Payment signature verification failed", 400);
    }

    // 3. Create User and Payment inside a Prisma Transaction
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email: normalizedEmail, password: hashedPassword, phone, role: "STUDENT", status: "ACTIVE" },
        select: { id: true, name: true, email: true, role: true },
      });

      const payment = await tx.payment.create({
        data: {
          amount: 120, // Platform registration fee
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          userId: user.id,
          courseId: null,
          status: "SUCCESS",
        },
      });

      return { user, payment };
    });

    // 4. Send confirmation email (non-blocking)
    try {
      await sendEmail({
        to: result.user.email,
        subject: "Welcome to Simba Academy & Payment Successful",
        html: getPaymentSuccessHtml(
          result.user.name,
          result.payment.amount,
          "Simba Academy Platform Access"
        ),
      });
    } catch (emailErr) {
      console.error("Failed to send payment confirmation email on pre-register:", emailErr);
    }

    // 5. Sign JWT and return session
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email, role: result.user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({ user: result.user, token });
  } catch (err) {
    next(err);
  }
});

// ── Check Email Availability (Public) ───────────────────────────────
router.post("/check-email", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Email is required", 400);
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    res.json({ available: !existing || existing.isDeleted });
  } catch (err) {
    next(err);
  }
});

// ── Forgot Password ──────────────────────────────────────────────────
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success to avoid email enumeration
    const genericMessage = "If an account exists for this email, a reset link has been sent.";

    if (!user || user.isDeleted) {
      res.json({ message: genericMessage });
      return;
    }

    try {
      assertAccountCanAuthenticate(user);
    } catch {
      res.json({ message: genericMessage });
      return;
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${env.FRONTEND_URL}/teacher/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${env.PLATFORM_NAME} password`,
        html: getPasswordResetHtml({
          name: user.name,
          resetUrl,
          expiresMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
          platformName: env.PLATFORM_NAME,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
    }

    res.json({ message: genericMessage });
  } catch (err) {
    next(err);
  }
});

// ── Reset Password ───────────────────────────────────────────────────
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt) {
      throw new AppError("Invalid or expired reset link", 400);
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new AppError("Reset link has expired", 400);
    }

    if (resetRecord.user.isDeleted || resetRecord.user.status !== "ACTIVE") {
      throw new AppError("Account is deactivated", 403);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword, mustChangePassword: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetRecord.userId, id: { not: resetRecord.id } },
      }),
    ]);

    res.json({ message: "Password updated successfully. You can now sign in." });
  } catch (err) {
    next(err);
  }
});

// ── Change Password (authenticated) ─────────────────────────────────
router.post("/change-password", authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || user.isDeleted) {
      throw new AppError("User not found", 404);
    }

    assertAccountCanAuthenticate(user);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;

