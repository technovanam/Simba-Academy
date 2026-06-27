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
  createRecurringTaskSchema,
  updateRecurringTaskSchema,
  createTaskFolderSchema,
  approveTaskSchema,
  createStoryBookSchema,
  updateStoryBookSchema,
  createLessonPlanSchema,
  updateLessonPlanSchema,
  createFolderSchema,
  updateFolderSchema,
  moveItemSchema,
} from "../config/schemas.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { processRecurringTasks } from "../services/recurringTasks.js";
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
      taskProofCount,
      pendingTaskProofCount,
      paymentCount,
      revenue,
      inquiryCount,
      unreadInquiryCount,
      franchiseInquiryCount,
      unreadFranchiseInquiryCount,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false, status: "ACTIVE" } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.material.count(),
      prisma.material.count({ where: { isApproved: false } }),
      prisma.task.count({ where: { NOT: { proofUrl: null } } }),
      prisma.task.count({ where: { status: "COMPLETED", NOT: { proofUrl: null } } }),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { isRead: false } }),
      prisma.franchiseInquiry.count(),
      prisma.franchiseInquiry.count({ where: { isRead: false } }),
    ]);

    res.json({
      users: userCount,
      courses: courseCount,
      materials: materialCount + taskProofCount,
      pendingApprovals: pendingMaterialCount + pendingTaskProofCount,
      payments: paymentCount,
      revenue: revenue._sum.amount ?? 0,
      inquiries: inquiryCount,
      unreadInquiries: unreadInquiryCount + unreadFranchiseInquiryCount,
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
        user: { select: { name: true, email: true, studentClass: true } },
        course: { select: { title: true, level: true } },
      },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  TASKS (Teacher Assignments & Recurring)
// ═════════════════════════════════════════════════════════════════════

// ── List All Task Folders ──────────────────────────────────────────
router.get("/task-folders", async (_req, res, next) => {
  try {
    const folders = await prisma.taskFolder.findMany({
      orderBy: { name: "asc" },
    });
    res.json(folders);
  } catch (err) {
    next(err);
  }
});

// ── Create Task Folder ─────────────────────────────────────────────
router.post("/task-folders", validate(createTaskFolderSchema), async (req, res, next) => {
  try {
    const { name, studentClass } = req.body;
    const trimmedName = name.trim();

    const existing = await prisma.taskFolder.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      throw new AppError("Folder with this name already exists", 400);
    }

    const folder = await prisma.taskFolder.create({
      data: {
        name: trimmedName,
        studentClass,
      },
    });
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
});

// ── Update Task Folder ─────────────────────────────────────────────
router.patch("/task-folders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, studentClass } = req.body;
    
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new AppError("Folder name cannot be empty", 400);
      }
      const existing = await prisma.taskFolder.findFirst({
        where: { name: trimmedName, NOT: { id } },
      });
      if (existing) {
        throw new AppError("Folder with this name already exists", 400);
      }
    }

    const folder = await prisma.taskFolder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(studentClass !== undefined && { studentClass }),
      },
    });
    res.json(folder);
  } catch (err) {
    next(err);
  }
});

// ── Delete Task Folder ─────────────────────────────────────────────
router.delete("/task-folders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find all recurring tasks in this folder
    const recurringTasks = await prisma.recurringTask.findMany({
      where: { folderId: id },
    });
    const recurringTaskIds = recurringTasks.map((rt) => rt.id);

    if (recurringTaskIds.length > 0) {
      // Find all tasks associated with these recurring tasks
      const tasks = await prisma.task.findMany({
        where: { recurringTaskId: { in: recurringTaskIds } },
      });
      const taskIds = tasks.map((t) => t.id);

      if (taskIds.length > 0) {
        for (const task of tasks) {
          await removeStoredFile(task.proofUrl);
        }
        await prisma.teacherNotification.deleteMany({
          where: { taskId: { in: taskIds } },
        });
        await prisma.adminNotification.deleteMany({
          where: { taskId: { in: taskIds } },
        });
        await prisma.taskAudit.deleteMany({
          where: { taskId: { in: taskIds } },
        });
        await prisma.task.deleteMany({
          where: { id: { in: taskIds } },
        });
      }

      // Delete recurring tasks explicitly to ensure clean cleanup
      await prisma.recurringTask.deleteMany({
        where: { folderId: id },
      });
    }

    await prisma.taskFolder.delete({
      where: { id },
    });
    res.json({ message: "Folder deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ── List All Recurring Tasks ─────────────────────────────────────────
router.get("/recurring-tasks", async (_req, res, next) => {
  try {
    const rTasks = await prisma.recurringTask.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(rTasks);
  } catch (err) {
    next(err);
  }
});

// ── Create Recurring Task ───────────────────────────────────────────
router.post("/recurring-tasks", validate(createRecurringTaskSchema), async (req, res, next) => {
  try {
    const { title, description, studentClass, repeatDay, isActive, folderId } = req.body;
    const rTask = await prisma.recurringTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        studentClass,
        repeatDay,
        isActive: isActive !== undefined ? isActive : true,
        folderId: folderId || null,
      },
    });

    // Run processing immediately in the background so "TODAY" or today's task assigns immediately
    processRecurringTasks().catch((err) => console.error("Error processing tasks immediately:", err));

    res.status(201).json(rTask);
  } catch (err) {
    next(err);
  }
});

// ── Update Recurring Task ───────────────────────────────────────────
router.patch("/recurring-tasks/:id", validate(updateRecurringTaskSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { title, description, studentClass, repeatDay, isActive, folderId } = req.body;
    
    const rTask = await prisma.recurringTask.findUnique({ where: { id } });
    if (!rTask) throw new AppError("Recurring task not found", 404);

    const updated = await prisma.recurringTask.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(studentClass !== undefined && { studentClass }),
        ...(repeatDay !== undefined && { repeatDay }),
        ...(isActive !== undefined && { isActive }),
        ...(folderId !== undefined && { folderId: folderId || null }),
      },
    });

    // Run processing immediately in case they updated status or set to TODAY
    processRecurringTasks().catch((err) => console.error("Error processing tasks immediately:", err));

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Delete Recurring Task ───────────────────────────────────────────
router.delete("/recurring-tasks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find all tasks associated with this recurring task
    const tasks = await prisma.task.findMany({
      where: { recurringTaskId: id },
    });
    const taskIds = tasks.map((t) => t.id);

    if (taskIds.length > 0) {
      for (const task of tasks) {
        await removeStoredFile(task.proofUrl);
      }
      await prisma.teacherNotification.deleteMany({
        where: { taskId: { in: taskIds } },
      });
      await prisma.adminNotification.deleteMany({
        where: { taskId: { in: taskIds } },
      });
      await prisma.taskAudit.deleteMany({
        where: { taskId: { in: taskIds } },
      });
      await prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      });
    }

    await prisma.recurringTask.delete({ where: { id } });
    res.json({ message: "Recurring task deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ── Get Recurring Task History ──────────────────────────────────────
router.get("/recurring-tasks/:id/history", async (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = await prisma.task.findMany({
      where: { recurringTaskId: id },
      orderBy: { createdAt: "desc" },
      include: { teacher: { select: { name: true, email: true } } },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ── List All Tasks ──────────────────────────────────────────────────
router.get("/tasks", async (_req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
            studentClass: true,
            teacherAssignedClasses: { select: { className: true } },
          },
        },
        recurringTask: { select: { studentClass: true } },
      },
    });
    const mapped = tasks.map((task) => ({
      ...task,
      assignedDate: task.createdAt,
      teacher: task.teacher
        ? {
            name: task.teacher.name,
            email: task.teacher.email,
            assignedClasses:
              task.teacher.teacherAssignedClasses.length > 0
                ? task.teacher.teacherAssignedClasses.map((r) => r.className)
                : task.teacher.studentClass
                  ? [task.teacher.studentClass]
                  : [],
          }
        : null,
    }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// ── Create/Assign Task ──────────────────────────────────────────────
router.post("/tasks", validate(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, dueDate, assignmentMode = "SINGLE", teacherId, teacherIds } = req.body;

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) {
      throw new AppError("Due date cannot be in the past", 400);
    }

    let targetTeacherIds: string[] = [];
    if (assignmentMode === "ALL") {
      const allTeachers = await prisma.user.findMany({
        where: { role: "TEACHER", status: "ACTIVE", isDeleted: false },
        select: { id: true },
      });
      targetTeacherIds = allTeachers.map((t) => t.id);
    } else if (assignmentMode === "MULTIPLE") {
      targetTeacherIds = [...new Set(teacherIds as string[])];
    } else {
      targetTeacherIds = [teacherId as string];
    }

    if (targetTeacherIds.length === 0) {
      throw new AppError("No teachers selected for assignment", 400);
    }

    const teachers = await prisma.user.findMany({
      where: {
        id: { in: targetTeacherIds },
        role: "TEACHER",
        isDeleted: false,
      },
      select: { id: true, name: true, email: true },
    });

    if (teachers.length !== targetTeacherIds.length) {
      throw new AppError("One or more teachers not found", 404);
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true },
    });

    const createdTasks = [];
    for (const teacher of teachers) {
      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          dueDate: due,
          teacherId: teacher.id,
          status: "PENDING",
        },
        include: { teacher: { select: { id: true, name: true, email: true } } },
      });

      await prisma.taskAudit.create({
        data: {
          taskId: task.id,
          action: "CREATED",
          statusTo: "PENDING",
          changedById: req.user!.userId,
          changedByName: adminUser?.name || "Admin",
          comments: `Task manually assigned by Admin (${assignmentMode}).`,
        },
      });

      try {
        await notifyTeacherOfNewTask(teacher, task);
      } catch (notifyErr) {
        console.error("Failed to notify teacher of new task:", notifyErr);
      }

      createdTasks.push({ ...task, assignedDate: task.createdAt });
    }

    res.status(201).json({
      tasks: createdTasks,
      count: createdTasks.length,
      ...(createdTasks.length === 1 ? createdTasks[0] : {}),
    });
  } catch (err) {
    next(err);
  }
});

// ── Update Task ─────────────────────────────────────────────────────
router.patch("/tasks/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Task not found", 404);
    }

    const { title, description, dueDate, teacherId } = req.body;
    const data: any = {};

    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (dueDate !== undefined) {
      const due = new Date(dueDate);
      data.dueDate = due;
    }
    if (teacherId !== undefined) {
      const teacher = await prisma.user.findFirst({
        where: { id: teacherId, role: "TEACHER" },
      });
      if (!teacher) throw new AppError("Teacher not found", 404);
      data.teacherId = teacherId;
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    res.json(updated);
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

    if (req.body.status === "REJECTED" && !req.body.rejectionReason?.trim()) {
      throw new AppError("Rejection reason is required", 400);
    }

    const updated = await prisma.task.update({
      where: { id: String(req.params.id) },
      data: {
        status: req.body.status,
        proofDesc: req.body.proofDesc || task.proofDesc,
        rejectionReason: req.body.status === "REJECTED" ? req.body.rejectionReason : null,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true, studentClass: true } },
        recurringTask: { select: { studentClass: true } },
      },
    });

    // Log Task Audit History
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true },
    });

    await prisma.taskAudit.create({
      data: {
        taskId: task.id,
        action: req.body.status,
        statusFrom: task.status,
        statusTo: req.body.status,
        changedById: req.user!.userId,
        changedByName: adminUser?.name || "Admin",
        comments: req.body.status === "REJECTED" ? req.body.rejectionReason : "Task proof reviewed and approved.",
      },
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

// ── Get Task Audit History ──────────────────────────────────────────
router.get("/tasks/:id/audit", async (req, res, next) => {
  try {
    const audits = await prisma.taskAudit.findMany({
      where: { taskId: String(req.params.id) },
      orderBy: { createdAt: "desc" },
    });
    res.json(audits);
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

    // Delete associated notifications and audits
    await prisma.teacherNotification.deleteMany({ where: { taskId: task.id } });
    await prisma.adminNotification.deleteMany({ where: { taskId: task.id } });
    await prisma.taskAudit.deleteMany({ where: { taskId: task.id } });

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

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sanitizedPlans = plans.map(plan => {
      if (plan.fileUrl && plan.updatedAt < oneWeekAgo) {
        return { ...plan, fileUrl: null, fileName: null };
      }
      return plan;
    });

    res.json(sanitizedPlans);
  } catch (err) {
    next(err);
  }
});

router.post("/lesson-plans", validate(createLessonPlanSchema), async (req, res, next) => {
  try {
    const { title, targetClass, courseId, planDate, content, materialsNeeded, isPublished, fileUrl, fileName } = req.body;
    const plan = await prisma.lessonPlan.create({
      data: {
        title,
        targetClass: targetClass || null,
        courseId: courseId || null,
        planDate: planDate ? new Date(planDate) : null,
        content: content || title,
        materialsNeeded: materialsNeeded || null,
        isPublished: isPublished ?? true,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
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

    const { title, targetClass, courseId, planDate, content, materialsNeeded, isPublished, fileUrl, fileName } = req.body;
    const plan = await prisma.lessonPlan.update({
      where: { id: String(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(targetClass !== undefined && { targetClass: targetClass || null }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(planDate !== undefined && { planDate: planDate ? new Date(planDate) : null }),
        ...(content !== undefined && { content: content || title }),
        ...(materialsNeeded !== undefined && { materialsNeeded: materialsNeeded || null }),
        ...(isPublished !== undefined && { isPublished }),
        ...(fileUrl !== undefined && { fileUrl: fileUrl || null }),
        ...(fileName !== undefined && { fileName: fileName || null }),
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
router.get("/books", async (req, res, next) => {
  try {
    const folderId = typeof req.query.folderId === "string" ? req.query.folderId : undefined;
    const folderFilter =
      folderId === "root"
        ? { folderId: null }
        : folderId
          ? { folderId }
          : {};
    const books = await prisma.storyBook.findMany({
      where: folderFilter,
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
    const { folderId, ...rest } = req.body;
    const data: any = { ...rest };
    if (folderId) {
      const folder = await prisma.libraryFolder.findUnique({ where: { id: folderId } });
      if (!folder) throw new AppError("Target folder not found", 404);
      data.folderId = folderId;
    }
    const book = await prisma.storyBook.create({ data });

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

// ── Update Story Book ───────────────────────────────────────────────
router.put("/books/:id", validate(updateStoryBookSchema), async (req, res, next) => {
  try {
    const existing = await prisma.storyBook.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) {
      throw new AppError("Story book not found", 404);
    }
    const { folderId, ...rest } = req.body;
    const data: any = { ...rest };
    if (folderId) {
      const folder = await prisma.libraryFolder.findUnique({ where: { id: folderId } });
      if (!folder) throw new AppError("Target folder not found", 404);
      data.folderId = folderId;
    }
    const book = await prisma.storyBook.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(book);
  } catch (err) {
    next(err);
  }
});

// ── Move Story Book to folder (or root) ─────────────────────────────
router.patch("/books/:id/move", validate(moveItemSchema), async (req, res, next) => {
  try {
    const bookId = String(req.params.id);
    const { targetFolderId } = req.body;
    const book = await prisma.storyBook.findUnique({ where: { id: bookId } });
    if (!book) throw new AppError("Story book not found", 404);

    if (targetFolderId) {
      const folder = await prisma.libraryFolder.findUnique({ where: { id: targetFolderId } });
      if (!folder) throw new AppError("Target folder not found", 404);
    }

    const updated = await prisma.storyBook.update({
      where: { id: bookId },
      data: { folderId: targetFolderId || null },
    });
    res.json(updated);
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

// ═════════════════════════════════════════════════════════════════════
//  ADMIN NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════

router.get("/notifications/unread-count", async (req, res, next) => {
  try {
    const count = await prisma.adminNotification.count({
      where: { isRead: false },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, title: true, status: true } },
        payment: { select: { id: true, amount: true, status: true } },
      },
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/read-all", async (req, res, next) => {
  try {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.adminNotification.findFirst({
      where: { id },
    });
    if (!existing) {
      throw new AppError("Notification not found", 404);
    }

    const updated = await prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
      include: {
        user: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, title: true, status: true } },
        payment: { select: { id: true, amount: true, status: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════
//  LIBRARY FOLDERS (Google Drive-style)
// ═════════════════════════════════════════════════════════════════════

// ── List Folders ────────────────────────────────────────────────────
router.get("/folders", async (req, res, next) => {
  try {
    const parentId = typeof req.query.parentId === "string" ? req.query.parentId : undefined;
    const parentFilter =
      parentId === "root" || !parentId
        ? { parentId: null }
        : { parentId };
    const folders = await prisma.libraryFolder.findMany({
      where: parentFilter,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { children: true, storyBooks: true },
        },
      },
    });
    res.json(folders);
  } catch (err) {
    next(err);
  }
});

// ── List all folders (flat, for move dialog) ────────────────────────
router.get("/folders-all", async (_req, res, next) => {
  try {
    const folders = await prisma.libraryFolder.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, parentId: true },
    });
    res.json(folders);
  } catch (err) {
    next(err);
  }
});

// ── Get single folder (for breadcrumb ancestors) ────────────────────
router.get("/folders/:id", async (req, res, next) => {
  try {
    const folder = await prisma.libraryFolder.findUnique({
      where: { id: String(req.params.id) },
      include: {
        _count: { select: { children: true, storyBooks: true } },
      },
    });
    if (!folder) throw new AppError("Folder not found", 404);
    res.json(folder);
  } catch (err) {
    next(err);
  }
});

// ── Get folder ancestors (breadcrumb path) ──────────────────────────
router.get("/folders/:id/ancestors", async (req, res, next) => {
  try {
    const ancestors: Array<{ id: string; name: string; parentId: string | null }> = [];
    let currentId: string | null = String(req.params.id);
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const f: { id: string; name: string; parentId: string | null } | null = await prisma.libraryFolder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });
      if (!f) break;
      ancestors.unshift(f);
      currentId = f.parentId;
    }

    res.json(ancestors);
  } catch (err) {
    next(err);
  }
});

// ── Create Folder ───────────────────────────────────────────────────
router.post("/folders", validate(createFolderSchema), async (req, res, next) => {
  try {
    const { name, parentId, audience, category } = req.body;
    if (parentId) {
      const parent = await prisma.libraryFolder.findUnique({ where: { id: parentId } });
      if (!parent) throw new AppError("Parent folder not found", 404);
    }
    const folder = await prisma.libraryFolder.create({
      data: {
        name,
        parentId: parentId || null,
        audience: audience || "BOTH",
        category: category === "ALL" ? null : category || null,
      },
      include: {
        _count: { select: { children: true, storyBooks: true } },
      },
    });
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
});

// ── Rename / Update Folder ──────────────────────────────────────────
router.patch("/folders/:id", validate(updateFolderSchema), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.libraryFolder.findUnique({ where: { id } });
    if (!existing) throw new AppError("Folder not found", 404);

    const data: Record<string, unknown> = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.audience !== undefined) data.audience = req.body.audience;
    if (req.body.category !== undefined) data.category = req.body.category === "ALL" ? null : req.body.category;

    const updated = await prisma.libraryFolder.update({
      where: { id },
      data,
      include: {
        _count: { select: { children: true, storyBooks: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Move Folder ─────────────────────────────────────────────────────
router.patch("/folders/:id/move", validate(moveItemSchema), async (req, res, next) => {
  try {
    const folderId = String(req.params.id);
    const { targetFolderId } = req.body;
    const folder = await prisma.libraryFolder.findUnique({ where: { id: folderId } });
    if (!folder) throw new AppError("Folder not found", 404);

    // Prevent moving folder into itself or its own descendants
    if (targetFolderId) {
      if (targetFolderId === folderId) throw new AppError("Cannot move folder into itself", 400);
      const targetFolder = await prisma.libraryFolder.findUnique({ where: { id: targetFolderId } });
      if (!targetFolder) throw new AppError("Target folder not found", 404);

      // Walk up from target to check it's not a descendant
      let checkId: string | null = targetFolderId;
      const visited = new Set<string>();
      while (checkId && !visited.has(checkId)) {
        visited.add(checkId);
        if (checkId === folderId) throw new AppError("Cannot move folder into its own subfolder", 400);
        const parent = await prisma.libraryFolder.findUnique({
          where: { id: checkId },
          select: { parentId: true },
        });
        checkId = parent?.parentId ?? null;
      }
    }

    const updated = await prisma.libraryFolder.update({
      where: { id: folderId },
      data: { parentId: targetFolderId || null },
      include: {
        _count: { select: { children: true, storyBooks: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Delete Folder ───────────────────────────────────────────────────
router.delete("/folders/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const folder = await prisma.libraryFolder.findUnique({ where: { id } });
    if (!folder) throw new AppError("Folder not found", 404);

    // Move orphaned storybooks to root before deleting folder tree
    // (Cascade will delete sub-folders, but books have onDelete: SetNull so they go to root)
    await prisma.storyBook.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // Also move books in sub-folders to root
    const collectSubFolderIds = async (parentId: string): Promise<string[]> => {
      const subs = await prisma.libraryFolder.findMany({
        where: { parentId },
        select: { id: true },
      });
      const ids = subs.map((s) => s.id);
      for (const sub of subs) {
        const deepIds = await collectSubFolderIds(sub.id);
        ids.push(...deepIds);
      }
      return ids;
    };

    const subIds = await collectSubFolderIds(id);
    if (subIds.length > 0) {
      await prisma.storyBook.updateMany({
        where: { folderId: { in: subIds } },
        data: { folderId: null },
      });
    }

    // Cascade deletes all sub-folders
    await prisma.libraryFolder.delete({ where: { id } });

    res.json({ message: "Folder deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
