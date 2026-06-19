import { Router } from "express";
import { prisma } from "../config/database.js";
import { validate } from "../middleware/validate.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { inquirySchema, franchiseInquirySchema } from "../config/schemas.js";
import {
  sendEmail,
  getInquiryAutoReplyHtml,
  getFranchiseAutoReplyHtml,
  getAdminInquiryHtml,
} from "../services/email.js";
import { env } from "../config/env.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth.js";

const router = Router();

// ── Submit General Inquiry ──────────────────────────────────────────
router.post(
  "/inquiry",
  contactLimiter,
  optionalAuthenticate,
  validate(inquirySchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, message, inquiryType } = req.body;
      const userId = req.user?.userId ?? null;
      const fullMessage = inquiryType ? `[${inquiryType}] ${message}` : message;

      // Save to database
      await prisma.inquiry.create({
        data: { name, email, phone, message: fullMessage, userId },
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
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", status: "ACTIVE", isDeleted: false },
          select: { email: true },
        });
        const recipients = admins.length > 0 ? admins.map((a) => a.email) : [env.EMAIL_TO];

        for (const toEmail of recipients) {
          await sendEmail({
            to: toEmail,
            subject: `New Inquiry from ${name} - Simba Academy`,
            html: getAdminInquiryHtml({ name, email, phone, message: fullMessage }),
          });
        }
      } catch {
        console.error("Failed to send admin notification email");
      }

      res.status(201).json({
        message: "Your inquiry has been submitted successfully. We'll get back to you shortly!",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── Submit Franchise Inquiry ────────────────────────────────────────
router.post(
  "/franchise",
  contactLimiter,
  validate(franchiseInquirySchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, location, message } = req.body;

      await prisma.franchiseInquiry.create({
        data: { name, email, phone, location, message },
      });

      // Send auto-reply confirmation to the franchise inquirer
      try {
        await sendEmail({
          to: email,
          subject: "Thank you for your interest in a Simba Academy Franchise",
          html: getFranchiseAutoReplyHtml(name),
        });
      } catch {
        console.error("Failed to send franchise auto-reply email");
      }

      // Notify admin about franchise inquiry
      try {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", status: "ACTIVE", isDeleted: false },
          select: { email: true },
        });
        const recipients = admins.length > 0 ? admins.map((a) => a.email) : [env.EMAIL_TO];

        for (const toEmail of recipients) {
          await sendEmail({
            to: toEmail,
            subject: `Franchise Inquiry from ${name} - Simba Academy`,
            html: getAdminInquiryHtml({
              name,
              email,
              phone,
              message: message ?? "Interested in Simba franchise opportunity.",
              isFranchise: true,
              location: location ?? "Not specified",
            }),
          });
        }
      } catch {
        console.error("Failed to send franchise inquiry email");
      }

      res.status(201).json({
        message: "Thank you for your franchise interest! Our team will contact you soon.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── Admin: List Inquiries ───────────────────────────────────────────
router.get("/inquiries", authenticate, authorize("ADMIN"), async (req, res, next) => {
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
router.patch("/inquiries/:id/read", authenticate, authorize("ADMIN"), async (req, res, next) => {
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
router.get("/franchises", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const franchises = await prisma.franchiseInquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(franchises);
  } catch (err) {
    next(err);
  }
});

// ── Admin: Mark Franchise Inquiry as Read ─────────────────────────────
router.patch("/franchises/:id/read", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const franchise = await prisma.franchiseInquiry.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    res.json(franchise);
  } catch (err) {
    next(err);
  }
});

export default router;
