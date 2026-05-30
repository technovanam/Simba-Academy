import { Router } from "express";
import { prisma } from "../config/database.js";
import { validate } from "../middleware/validate.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { inquirySchema, franchiseInquirySchema } from "../config/schemas.js";
import { sendEmail, getInquiryAutoReplyHtml, getAdminInquiryHtml } from "../services/email.js";
import { env } from "../config/env.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

// ── Submit General Inquiry ──────────────────────────────────────────
router.post("/inquiry", contactLimiter, optionalAuthenticate, validate(inquirySchema), async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    const userId = req.user?.userId ?? null;

    // Save to database
    await prisma.inquiry.create({
      data: { name, email, phone, message, userId },
    });

    // Send auto-reply to the inquirer
    try {
      await sendEmail({
        to: email,
        subject: "Thank you for contacting Simba Academy",
        html: getInquiryAutoReplyHtml(name),
      });
    } catch {
      console.error("Failed to send auto-reply email");
    }

    // Notify admin
    try {
      await sendEmail({
        to: env.EMAIL_TO,
        subject: `New Inquiry from ${name} - Simba Academy`,
        html: getAdminInquiryHtml({ name, email, phone, message }),
      });
    } catch {
      console.error("Failed to send admin notification email");
    }

    res.status(201).json({
      message: "Your inquiry has been submitted successfully. We'll get back to you shortly!",
    });
  } catch (err) {
    next(err);
  }
});

// ── Submit Franchise Inquiry ────────────────────────────────────────
router.post("/franchise", contactLimiter, validate(franchiseInquirySchema), async (req, res, next) => {
  try {
    const { name, email, phone, location, message } = req.body;

    await prisma.franchiseInquiry.create({
      data: { name, email, phone, location, message },
    });

    // Notify admin about franchise inquiry
    try {
      await sendEmail({
        to: env.EMAIL_TO,
        subject: `Franchise Inquiry from ${name} - Simba Academy`,
        html: `
          <h2>New Franchise Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
        `,
      });
    } catch {
      console.error("Failed to send franchise inquiry email");
    }

    res.status(201).json({
      message: "Thank you for your franchise interest! Our team will contact you soon.",
    });
  } catch (err) {
    next(err);
  }
});

// ── Admin: List Inquiries ───────────────────────────────────────────
router.get("/inquiries", authenticate, async (req, res, next) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    res.json(inquiries);
  } catch (err) {
    next(err);
  }
});

// ── Admin: Mark Inquiry as Read ─────────────────────────────────────
router.patch("/inquiries/:id/read", authenticate, async (req, res, next) => {
  try {
    const inquiry = await prisma.inquiry.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    res.json(inquiry);
  } catch (err) {
    next(err);
  }
});

// ── Admin: List Franchise Inquiries ─────────────────────────────────
router.get("/franchises", authenticate, async (req, res, next) => {
  try {
    const franchises = await prisma.franchiseInquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(franchises);
  } catch (err) {
    next(err);
  }
});

export default router;
