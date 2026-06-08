import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { submitTaskProofSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { sendEmail, getTaskCompletionAdminHtml } from "../services/email.js";
import { env } from "../config/env.js";

const router = Router();

// Require logged-in user with role TEACHER
router.use(authenticate, authorize("TEACHER"));

function assertNotificationModel() {
  if (!prisma.teacherNotification) {
    throw new AppError(
      "Notifications are not available yet. Run: npm run db:migrate-schema && npx prisma generate, then restart the server.",
      503
    );
  }
}

router.get("/notifications/unread-count", async (req, res, next) => {
  try {
    assertNotificationModel();
    const userId = req.user!.userId;
    const count = await prisma.teacherNotification.count({
      where: { userId, isRead: false },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    assertNotificationModel();
    const userId = req.user!.userId;
    const notifications = await prisma.teacherNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        storyBook: {
          select: { id: true, title: true, category: true, author: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
        lessonPlan: {
          select: { id: true, title: true, planDate: true },
        },
      },
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/read-all", async (req, res, next) => {
  try {
    assertNotificationModel();
    const userId = req.user!.userId;
    await prisma.teacherNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    assertNotificationModel();
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const existing = await prisma.teacherNotification.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new AppError("Notification not found", 404);
    }

    const updated = await prisma.teacherNotification.update({
      where: { id },
      data: { isRead: true },
      include: {
        storyBook: {
          select: { id: true, title: true, category: true, author: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
        lessonPlan: {
          select: { id: true, title: true, planDate: true },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Story library (teacher + both audience) ───────────────────────────
router.get("/books", async (_req, res, next) => {
  try {
    const books = await prisma.storyBook.findMany({
      where: { audience: { in: ["TEACHER", "BOTH"] } },
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

// ── Published lesson plans (view only) ───────────────────────────────
router.get("/lesson-plans", async (_req, res, next) => {
  try {
    const plans = await prisma.lessonPlan.findMany({
      where: { isPublished: true },
      orderBy: [{ planDate: "desc" }, { createdAt: "desc" }],
      include: { course: { select: { title: true, level: true } } },
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

router.get("/lesson-plans/:id", async (req, res, next) => {
  try {
    const plan = await prisma.lessonPlan.findFirst({
      where: { id: String(req.params.id), isPublished: true },
      include: { course: { select: { title: true, level: true } } },
    });
    if (!plan) {
      throw new AppError("Lesson plan not found", 404);
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

// ── List Tasks Assigned to Current Teacher ───────────────────────────
router.get("/tasks", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { teacherId: String(req.user!.userId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ── Submit Proof for Task ────────────────────────────────────────────
router.patch("/tasks/:id/proof", validate(submitTaskProofSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proofUrl, proofDesc } = req.body;

    const task = await prisma.task.findFirst({
      where: { id: String(id), teacherId: String(req.user!.userId) },
      include: { teacher: { select: { name: true, email: true } } },
    });

    if (!task) {
      throw new AppError("Task not found or not assigned to you", 404);
    }

    if (task.status === "APPROVED") {
      throw new AppError("Cannot modify proof for an already approved task", 400);
    }

    const updated = await prisma.task.update({
      where: { id: String(id) },
      data: {
        proofUrl,
        proofDesc,
        status: "COMPLETED",
      },
      include: { teacher: { select: { name: true, email: true } } },
    });

    // Notify Admin via Email
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true, name: true },
      });

      const absoluteProofUrl = proofUrl.startsWith("http")
        ? proofUrl
        : `${env.WEBDAV_BASE_URL || "http://localhost:3001"}${proofUrl}`;

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `Task Completed by Teacher: ${task.title}`,
          html: getTaskCompletionAdminHtml({
            teacherName: task.teacher.name,
            taskTitle: task.title,
            taskDescription: task.description ?? undefined,
            proofComments: proofDesc,
            proofUrl: absoluteProofUrl,
          }),
        });
      }
    } catch (emailErr) {
      console.error("Failed to send task completion notification email to admins:", emailErr);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
