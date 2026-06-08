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
  createLessonPlanSchema,
  updateLessonPlanSchema,
} from "../config/schemas.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { removeStoredFile, removeStoredFiles } from "../services/removeStoredFile.js";
import { sendEmail } from "../services/email.js";
import {
  notifyStudentsOfNewStoryBook,
  notifyTeachersOfNewStoryBook,
  notifyTeacherOfNewTask,
  notifyTeacherOfTaskReview,
  notifyTeachersOfNewLessonPlan,
} from "../services/portalNotifications.js";
import adminUserRoutes from "./admin-users.js";
import gbpSyncRoutes from "./gbpSync.js";
import { isGoogleReviewsConfigured } from "../services/googleReviews.js";
import { syncGoogleBusinessReviews } from "../services/gbpSyncService.js";
import {
  buildGoogleBusinessAuthUrl,
  exchangeGoogleBusinessCode,
  getGbpRateLimitHint,
  isBusinessProfileConfigured,
} from "../services/googleBusinessProfile.js";
import { persistGbpAccountId } from "../services/googleBusinessProfileState.js";

const router = Router();

// Google redirects here after sign-in — no admin JWT on this request
router.get("/google-reviews/oauth-callback", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      throw new AppError("Missing OAuth code", 400);
    }
    const tokens = await exchangeGoogleBusinessCode(code);

    let accountBlock = "";
    try {
      const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const accData = (await accRes.json()) as { accounts?: { name?: string }[] };
      const accountName = accData.accounts?.[0]?.name;
      if (accountName) {
        const accountId = accountName.replace(/^accounts\//, "");
        persistGbpAccountId(accountId);
        accountBlock =
          `<p>Also add (saves API quota on every sync):</p>` +
          `<pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto">GOOGLE_BUSINESS_ACCOUNT_ID=${accountId}</pre>`;
      }
    } catch {
      accountBlock =
          `<p>Could not auto-detect account ID. After quota clears run: <code>npm run google:list-business-account</code></p>`;
    }

    res
      .type("html")
      .send(
        `<html><body style="font-family:sans-serif;padding:2rem;max-width:640px">` +
          `<h1>Google Business connected</h1>` +
          `<p>Add to <code>backend/.env</code> and restart the server:</p>` +
          `<pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto">GOOGLE_BUSINESS_REFRESH_TOKEN=${tokens.refreshToken}</pre>` +
          accountBlock +
          `<p>Wait 30 minutes if you were rate-limited, then Admin → Parent Reviews → <strong>Refresh now</strong> once.</p></body></html>`
      );
  } catch (err) {
    next(err);
  }
});

// All routes below require ADMIN role
router.use(authenticate, authorize("ADMIN"));
router.use(adminUserRoutes);
router.use("/gbp-sync", gbpSyncRoutes);

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

    const googleDbReviews = await prisma.googleReview.findMany({
      orderBy: { updateTime: "desc" },
    });

    const reviews = googleDbReviews.map((r) => ({
      id: r.reviewId,
      name: r.reviewerName,
      content: r.comment,
      rating: r.rating,
      source: "google" as const,
      relativeTime: r.updateTime.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      profilePhotoUrl: r.reviewerPhotoUrl || undefined,
      placeId: r.locationId,
      placeName: `Simba Preschool (${r.locationId})`,
    }));

    const count = reviews.length;
    const totalRatings = count;
    const avgRating = count > 0
      ? Math.round((googleDbReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 5;

    const uniqueLocations = Array.from(new Set(googleDbReviews.map((r) => r.locationId)));
    const locations = uniqueLocations.map((locId) => ({
      placeId: locId,
      placeName: `Simba Preschool (${locId})`,
      rating: avgRating,
      totalRatings,
      reviewsReturned: googleDbReviews.filter((r) => r.locationId === locId).length,
    }));

    const latestReview = await prisma.googleReview.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    const fetchedAt = latestReview?.updatedAt.toISOString();

    const rateHint = getGbpRateLimitHint();
    let hint = rateHint || (fetchedAt
      ? `Database Cache · last updated ${new Date(fetchedAt).toLocaleString("en-IN")}`
      : "No reviews synced to database yet. Click Refresh now.");

    res.json({
      reviews,
      locations,
      rating: avgRating,
      totalRatings: count || undefined,
      placeName: "Simba Preschool",
      configured: true,
      fetchMode: "business_profile",
      hint,
      syncedAt: fetchedAt,
      fetchedAt,
      fromSnapshot: false,
      liveFetch: false,
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

    const syncResult = await syncGoogleBusinessReviews();

    const googleDbReviews = await prisma.googleReview.findMany({
      orderBy: { updateTime: "desc" },
    });

    const reviews = googleDbReviews.map((r) => ({
      id: r.reviewId,
      name: r.reviewerName,
      content: r.comment,
      rating: r.rating,
      source: "google" as const,
      relativeTime: r.updateTime.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      profilePhotoUrl: r.reviewerPhotoUrl || undefined,
      placeId: r.locationId,
      placeName: `Simba Preschool (${r.locationId})`,
    }));

    const count = reviews.length;
    const totalRatings = count;
    const avgRating = count > 0
      ? Math.round((googleDbReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 5;

    const uniqueLocations = Array.from(new Set(googleDbReviews.map((r) => r.locationId)));
    const locations = uniqueLocations.map((locId) => ({
      placeId: locId,
      placeName: `Simba Preschool (${locId})`,
      rating: avgRating,
      totalRatings,
      reviewsReturned: googleDbReviews.filter((r) => r.locationId === locId).length,
    }));

    const latestReview = await prisma.googleReview.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    const syncedAt = latestReview?.updatedAt.toISOString();

    let hint = syncResult.success
      ? `Synced ${syncResult.syncedCount} review(s) from Google.`
      : `Sync failed: ${syncResult.error}`;

    const rateHint = getGbpRateLimitHint();
    if (rateHint) hint = rateHint;

    res.json({
      reviews,
      locations,
      rating: avgRating,
      totalRatings: count || undefined,
      placeName: "Simba Preschool",
      configured: true,
      fetchMode: "business_profile",
      hint,
      synced: syncResult.success,
      fromSnapshot: false,
      syncedAt,
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
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    try {
      await notifyTeacherOfNewTask(teacher, task);
    } catch (notifyErr) {
      console.error("Failed to notify teacher of new task:", notifyErr);
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
      include: { teacher: { select: { id: true, name: true, email: true } } },
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
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    try {
      await notifyTeacherOfTaskReview(
        task.teacher,
        task,
        req.body.status,
        req.body.proofDesc || task.proofDesc
      );
    } catch (notifyErr) {
      console.error("Failed to notify teacher of task review:", notifyErr);
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
//  LESSON PLANS
// ═════════════════════════════════════════════════════════════════════

router.get("/lesson-plans", async (_req, res, next) => {
  try {
    const plans = await prisma.lessonPlan.findMany({
      orderBy: [{ planDate: "desc" }, { createdAt: "desc" }],
      include: { course: { select: { title: true, level: true } } },
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

router.post("/lesson-plans", validate(createLessonPlanSchema), async (req, res, next) => {
  try {
    const { title, courseId, planDate, content, materialsNeeded, isPublished } = req.body;
    const plan = await prisma.lessonPlan.create({
      data: {
        title,
        courseId: courseId || null,
        planDate: planDate ? new Date(planDate) : null,
        content,
        materialsNeeded: materialsNeeded || null,
        isPublished: isPublished ?? true,
      },
      include: { course: { select: { title: true, level: true } } },
    });

    if (plan.isPublished) {
      try {
        const notified = await notifyTeachersOfNewLessonPlan(plan);
        if (notified > 0) {
          console.log(`Lesson plan "${plan.title}": notified ${notified} teacher(s).`);
        }
      } catch (notifyErr) {
        console.error("Failed to notify teachers of new lesson plan:", notifyErr);
      }
    }

    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
});

router.patch("/lesson-plans/:id", validate(updateLessonPlanSchema), async (req, res, next) => {
  try {
    const existing = await prisma.lessonPlan.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) {
      throw new AppError("Lesson plan not found", 404);
    }

    const { title, courseId, planDate, content, materialsNeeded, isPublished } = req.body;
    const plan = await prisma.lessonPlan.update({
      where: { id: String(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(planDate !== undefined && { planDate: planDate ? new Date(planDate) : null }),
        ...(content !== undefined && { content }),
        ...(materialsNeeded !== undefined && { materialsNeeded: materialsNeeded || null }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: { course: { select: { title: true, level: true } } },
    });

    const becamePublished = plan.isPublished && !existing.isPublished;
    if (becamePublished) {
      try {
        const notified = await notifyTeachersOfNewLessonPlan(plan);
        if (notified > 0) {
          console.log(`Lesson plan "${plan.title}" published: notified ${notified} teacher(s).`);
        }
      } catch (notifyErr) {
        console.error("Failed to notify teachers of published lesson plan:", notifyErr);
      }
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.delete("/lesson-plans/:id", async (req, res, next) => {
  try {
    const existing = await prisma.lessonPlan.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) {
      throw new AppError("Lesson plan not found", 404);
    }
    await prisma.lessonPlan.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "Lesson plan deleted successfully" });
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

    try {
      const [studentCount, teacherCount] = await Promise.all([
        notifyStudentsOfNewStoryBook(book),
        notifyTeachersOfNewStoryBook(book),
      ]);
      if (studentCount > 0) {
        console.log(`Story book "${book.title}": notified ${studentCount} student(s).`);
      }
      if (teacherCount > 0) {
        console.log(`Story book "${book.title}": notified ${teacherCount} teacher(s).`);
      }
    } catch (notifyErr) {
      console.error("Failed to create portal notifications for story book:", notifyErr);
    }

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
