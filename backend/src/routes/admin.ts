import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  approveMaterialSchema,
  createTestimonialSchema,
  approveTestimonialSchema,
  createGallerySchema,
  updateGallerySchema,
  createTaskSchema,
  approveTaskSchema,
  createStoryBookSchema,
} from "../config/schemas.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { removeStoredFile, removeStoredFiles } from "../services/removeStoredFile.js";
import { sendEmail } from "../services/email.js";
import adminUserRoutes from "./admin-users.js";
import { fetchGooglePlaceReviews, isGoogleReviewsConfigured } from "../services/googleReviews.js";
import {
  buildGoogleBusinessAuthUrl,
  exchangeGoogleBusinessCode,
  getGbpRateLimitHint,
  isBusinessProfileConfigured,
} from "../services/googleBusinessProfile.js";


const router = Router();

// Google redirects here after sign-in — no admin JWT on this request
router.get("/google-reviews/oauth-callback", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      throw new AppError("Missing OAuth code", 400);
    }
    const tokens = await exchangeGoogleBusinessCode(code);
    res
      .type("html")
      .send(
        `<html><body style="font-family:sans-serif;padding:2rem;max-width:640px">` +
          `<h1>Google Business connected</h1>` +
          `<p>Add this line to <code>backend/.env</code> and restart the server:</p>` +
          `<pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto">GOOGLE_BUSINESS_REFRESH_TOKEN=${tokens.refreshToken}</pre>` +
          `<p>Then open Admin → Parent Reviews → Refresh Google.</p></body></html>`
      );
  } catch (err) {
    next(err);
  }
});

// All routes below require ADMIN role
router.use(authenticate, authorize("ADMIN"));
router.use(adminUserRoutes);

// ═════════════════════════════════════════════════════════════════════
//  MATERIALS (Approve/Reject)
// ═════════════════════════════════════════════════════════════════════

// ── List All Materials (including unapproved) ───────────────────────
router.get("/materials", async (_req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true, slug: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
    });
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

// ── Approve / Reject Material ───────────────────────────────────────
router.patch(
  "/materials/:id/approve",
  validate(approveMaterialSchema),
  async (req, res, next) => {
    try {
      const material = await prisma.material.findUnique({
        where: { id: String(req.params.id) },
      });
      if (!material) {
        throw new AppError("Material not found", 404);
      }

      const updated = await prisma.material.update({
        where: { id: String(req.params.id) },
        data: { isApproved: req.body.isApproved },
        include: {
          course: { select: { title: true } },
          uploadedBy: { select: { name: true, email: true } },
        },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── Delete Material (DB + storage) ───────────────────────────────────
router.delete("/materials/:id", async (req, res, next) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!material) {
      throw new AppError("Material not found", 404);
    }

    await removeStoredFile(material.fileUrl);
    await prisma.material.delete({ where: { id: material.id } });

    res.json({ message: "Material permanently deleted" });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  TESTIMONIALS
// ═════════════════════════════════════════════════════════════════════

// ── Create Testimonial (Admin can create on behalf of users) ────────
router.post("/testimonials", validate(createTestimonialSchema), async (req, res, next) => {
  try {
    const testimonial = await prisma.testimonial.create({
      data: { ...req.body, isApproved: true },
    });
    res.status(201).json(testimonial);
  } catch (err) {
    next(err);
  }
});

// ── Google Business OAuth (one-time connect for full review text) ───
router.get("/google-reviews/auth-url", async (_req, res, next) => {
  try {
    if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
      return res.json({
        configured: false,
        message:
          "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend .env (Google Cloud OAuth client).",
      });
    }
    res.json({ url: buildGoogleBusinessAuthUrl() });
  } catch (err) {
    next(err);
  }
});

// ── Google Reviews status (admin test / setup) ─────────────────────
router.get("/google-reviews/status", async (_req, res, next) => {
  try {
    if (!isGoogleReviewsConfigured()) {
      return res.json({
        configured: false,
        fetchMode: "none",
        message: isBusinessProfileConfigured()
          ? "Google Business OAuth incomplete. Use Connect Google Business or set GOOGLE_BUSINESS_REFRESH_TOKEN."
          : "Set GOOGLE_BUSINESS_REFRESH_TOKEN (recommended for review text) or GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_IDS.",
      });
    }
    const meta: { fromSnapshot?: boolean; syncedAt?: string; syncBlocked?: string } = {};
    const result = await fetchGooglePlaceReviews(false, meta);
    let hint: string | undefined;
    if (meta.syncBlocked) {
      hint = meta.syncBlocked;
    } else if (meta.fromSnapshot && meta.syncedAt) {
      hint = `Showing saved reviews (synced ${new Date(meta.syncedAt).toLocaleString("en-IN")}). Click Sync from Google to update.`;
    } else if (result.reviews.length === 0 && isBusinessProfileConfigured()) {
      hint = "No saved reviews yet. Click Sync from Google once (wait 15+ minutes between syncs to avoid rate limits).";
    }
    const rateHint = getGbpRateLimitHint();
    if (rateHint && result.reviews.length === 0) {
      hint = rateHint;
    }
    if (result.fetchMode === "oauth_pending") {
      hint =
        "OAuth Client ID and secret are saved. Click Connect Google Business, sign in, then paste GOOGLE_BUSINESS_REFRESH_TOKEN into backend .env and restart.";
    }
    if (result.fetchMode === "places" && result.reviews.length === 0 && (result.totalRatings ?? 0) > 0) {
      hint =
        "Only star ratings loaded. Connect Google Business (OAuth) to load full written feedback from all locations.";
    }
    if (result.fetchMode === "business_profile" && result.reviews.length === 0 && !meta.fromSnapshot) {
      hint =
        "Google Business is connected. Click Sync from Google once (wait 15+ min between syncs if rate-limited).";
    }
    res.json({
      ...result,
      configured: true,
      hint,
      syncedAt: meta.syncedAt,
      fromSnapshot: meta.fromSnapshot,
      syncBlocked: meta.syncBlocked,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/google-reviews/sync", async (_req, res, next) => {
  try {
    if (!isGoogleReviewsConfigured()) {
      return res.json({
        configured: false,
        fetchMode: "none",
        reviews: [],
        locations: [],
        message: "Google reviews not configured.",
      });
    }
    const meta: { fromSnapshot?: boolean; syncedAt?: string; syncBlocked?: string; synced?: boolean } = {};
    const result = await fetchGooglePlaceReviews(true, meta);
    let hint: string | undefined;
    if (meta.syncBlocked) {
      hint = meta.syncBlocked;
    } else if (meta.synced && result.reviews.length > 0) {
      hint = `Synced ${result.reviews.length} review(s) from Google.`;
    } else if (result.fetchMode === "business_profile") {
      hint = "Sync finished but no reviews returned. Check Google Business APIs or wait for rate limit to clear.";
    }
    res.json({
      ...result,
      configured: true,
      hint,
      synced: meta.synced === true,
      fromSnapshot: meta.fromSnapshot === true,
      syncBlocked: meta.syncBlocked,
      syncedAt: meta.syncedAt ?? (meta.synced ? new Date().toISOString() : undefined),
    });
  } catch (err) {
    next(err);
  }
});

// ── List All Testimonials ───────────────────────────────────────────
router.get("/testimonials", async (_req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

// ── Approve / Reject Testimonial ────────────────────────────────────
router.patch(
  "/testimonials/:id/approve",
  validate(approveTestimonialSchema),
  async (req, res, next) => {
    try {
      const testimonial = await prisma.testimonial.update({
        where: { id: String(req.params.id) },
        data: { isApproved: req.body.isApproved },
      });
      res.json(testimonial);
    } catch (err) {
      next(err);
    }
  }
);

// ── Delete Testimonial ──────────────────────────────────────────────
router.delete("/testimonials/:id", async (req, res, next) => {
  try {
    await prisma.testimonial.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "Testimonial deleted" });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  GALLERY
// ═════════════════════════════════════════════════════════════════════

// ── Add Gallery Image ───────────────────────────────────────────────
router.post("/gallery", validate(createGallerySchema), async (req, res, next) => {
  try {
    const item = await prisma.gallery.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// ── List Gallery ────────────────────────────────────────────────────
router.get("/gallery", async (_req, res, next) => {
  try {
    const items = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// ── Update Gallery Item ─────────────────────────────────────────────
router.patch(
  "/gallery/:id",
  validate(updateGallerySchema),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.gallery.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError("Gallery item not found", 404);
      }

      const imageUrl = req.body.imageUrl as string | undefined;
      const updated = await prisma.gallery.update({
        where: { id },
        data: {
          ...(req.body.title !== undefined ? { title: req.body.title || null } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        },
      });

      if (imageUrl && existing.imageUrl && imageUrl !== existing.imageUrl) {
        await removeStoredFile(existing.imageUrl);
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── Delete Gallery Item ─────────────────────────────────────────────
router.delete("/gallery/:id", async (req, res, next) => {
  try {
    const item = await prisma.gallery.findUnique({ where: { id: String(req.params.id) } });
    if (!item) {
      throw new AppError("Gallery item not found", 404);
    }

    await prisma.gallery.delete({ where: { id: String(req.params.id) } });
    await removeStoredFile(item.imageUrl);

    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ═════════════════════════════════════════════════════════════════════

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [
      userCount,
      courseCount,
      materialCount,
      pendingMaterialCount,
      paymentCount,
      revenue,
      inquiryCount,
      unreadInquiryCount,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false, status: "ACTIVE" } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.material.count(),
      prisma.material.count({ where: { isApproved: false } }),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { isRead: false } }),
    ]);

    res.json({
      users: userCount,
      courses: courseCount,
      materials: materialCount,
      pendingApprovals: pendingMaterialCount,
      payments: paymentCount,
      revenue: revenue._sum.amount ?? 0,
      inquiries: inquiryCount,
      unreadInquiries: unreadInquiryCount,
    });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  PAYMENTS (Admin Tracking)
// ═════════════════════════════════════════════════════════════════════

// ── List All Payments ────────────────────────────────────────────────
router.get("/payments", async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  TASKS (Teacher Assignments)
// ═════════════════════════════════════════════════════════════════════

// ── List All Tasks ──────────────────────────────────────────────────
router.get("/tasks", async (_req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { name: true, email: true } },
      },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ── Create/Assign Task ──────────────────────────────────────────────
router.post("/tasks", validate(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, dueDate, teacherId } = req.body;

    // Verify teacher exists
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: "TEACHER" },
    });
    if (!teacher) {
      throw new AppError("Teacher not found", 404);
    }

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) {
      throw new AppError("Due date cannot be in the past", 400);
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: due,
        teacherId,
        status: "PENDING",
      },
      include: { teacher: { select: { name: true, email: true } } },
    });

    // Send email alert to teacher
    try {
      await sendEmail({
        to: teacher.email,
        subject: `New Task Assigned: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
            <div style="background: #8AC926; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">New Task Assigned</h2>
            </div>
            <div style="padding: 20px;">
              <p>Hello <strong>${teacher.name}</strong>,</p>
              <p>An administrator has assigned you a new task:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Title:</td><td style="padding: 8px;">${title}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Description:</td><td style="padding: 8px;">${description || "N/A"}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Due Date:</td><td style="padding: 8px;">${dueDate ? new Date(dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}</td></tr>
              </table>
              <br/>
              <p style="text-align: center;">
                <a href="https://www.simbapreschool.in/login" style="background: #FF9F1C; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Log In to Portal</a>
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #666; font-size: 11px; text-align: center;">Simba Academy - Academic Coordinator Notifications</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send task assignment notification email to teacher:", emailErr);
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// ── Approve / Reject Task Proof ─────────────────────────────────────
router.patch("/tasks/:id/approve", validate(approveTaskSchema), async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: String(req.params.id) },
      include: { teacher: { select: { name: true, email: true } } },
    });
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    const updated = await prisma.task.update({
      where: { id: String(req.params.id) },
      data: {
        status: req.body.status,
        proofDesc: req.body.proofDesc || task.proofDesc,
      },
      include: { teacher: { select: { name: true, email: true } } },
    });

    // Send email alert to teacher
    try {
      await sendEmail({
        to: task.teacher.email,
        subject: `Task Review Update: ${task.title} [${req.body.status}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
            <div style="background: ${req.body.status === "APPROVED" ? "#10B981" : "#EF4444"}; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">Task Reviewed</h2>
            </div>
            <div style="padding: 20px;">
              <p>Hello <strong>${task.teacher.name}</strong>,</p>
              <p>Your task proof submission for <strong>${task.title}</strong> has been reviewed by the administrator.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Task:</td><td style="padding: 8px;">${task.title}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; font-weight: bold; color: ${req.body.status === "APPROVED" ? "#10B981" : "#EF4444"};">${req.body.status}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Feedback:</td><td style="padding: 8px; font-style: italic;">"${req.body.proofDesc || "No feedback provided."}"</td></tr>
              </table>
              <br/>
              <p style="text-align: center;">
                <a href="https://www.simbapreschool.in/login" style="background: #FF9F1C; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Log In to Portal</a>
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #666; font-size: 11px; text-align: center;">Simba Academy - Academic Coordinator Notifications</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send task review notification email to teacher:", emailErr);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Delete Task Assignment ──────────────────────────────────────────
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: String(req.params.id) } });
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    await removeStoredFile(task.proofUrl);
    await prisma.task.delete({ where: { id: task.id } });
    res.json({ message: "Task assignment deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  STORY BOOKS (Children Library)
// ═════════════════════════════════════════════════════════════════════

// ── List All Story Books ────────────────────────────────────────────
router.get("/books", async (_req, res, next) => {
  try {
    const books = await prisma.storyBook.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

// ── Create Story Book ───────────────────────────────────────────────
router.post("/books", validate(createStoryBookSchema), async (req, res, next) => {
  try {
    const book = await prisma.storyBook.create({
      data: req.body,
    });
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
});

// ── Delete Story Book ───────────────────────────────────────────────
router.delete("/books/:id", async (req, res, next) => {
  try {
    const book = await prisma.storyBook.findUnique({ where: { id: String(req.params.id) } });
    if (!book) {
      throw new AppError("Story book not found", 404);
    }

    await removeStoredFile(book.fileUrl);
    await prisma.storyBook.delete({ where: { id: String(req.params.id) } });

    res.json({ message: "Story book deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
