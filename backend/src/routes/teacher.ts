import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { submitTaskProofSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { sendEmail, getTaskCompletionAdminHtml } from "../services/email.js";
import { env } from "../config/env.js";
import { createAdminNotification } from "../services/adminNotifications.js";

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

router.get("/lesson-plans/:id", async (req, res, next) => {
  try {
    const plan = await prisma.lessonPlan.findFirst({
      where: { id: String(req.params.id), isPublished: true },
      include: { course: { select: { title: true, level: true } } },
    });
    if (!plan) {
      throw new AppError("Lesson plan not found", 404);
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (plan.fileUrl && plan.updatedAt < oneWeekAgo) {
      plan.fileUrl = null;
      plan.fileName = null;
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

    void createAdminNotification({
      type: "TASK_PROOF",
      title: "Task proof submitted",
      message: `Teacher ${updated.teacher.name} submitted proof for task "${updated.title}".`,
      userId: updated.teacherId,
      taskId: updated.id,
    });

    // Notify Admin via Email
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true, name: true },
      });

      const absoluteProofUrl = proofUrl.startsWith("http")
        ? proofUrl
        : `${env.PUBLIC_API_URL}${proofUrl}`;

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

// ── List Students in Teacher's Class ───────────────────────────────────
router.get("/students", async (req, res, next) => {
  try {
    const teacherId = req.user!.userId;
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, isDeleted: false },
      select: { studentClass: true },
    });
    if (!teacher || !teacher.studentClass) {
      return res.json([]);
    }
    const classBooks = await prisma.storyBook.findMany({
      where: {
        category: teacher.studentClass,
        audience: { in: ["STUDENT", "BOTH"] },
      },
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        fileUrl: true,
      },
    });

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        studentClass: teacher.studentClass,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        status: true,
        notifications: {
          where: {
            type: "STORY_BOOK",
          },
          select: {
            isRead: true,
            readingStatus: true,
            storyBookId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const mappedStudents = students.map((student) => {
      const bookNotifications = student.notifications.filter((n) => n.storyBookId);

      const booksProgress = classBooks.map((book) => {
        const notif = bookNotifications.find((n) => n.storyBookId === book.id);
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          fileUrl: book.fileUrl,
          readingStatus: notif 
            ? (notif.readingStatus === "READING" 
                ? "READING" 
                : (notif.isRead ? "READ" : "UNREAD")) 
            : "UNREAD",
          isRead: notif ? notif.isRead : false,
        };
      });

      return {
        id: student.id,
        name: student.name,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        createdAt: student.createdAt,
        status: student.status,
        books: booksProgress,
      };
    });

    res.json(mappedStudents);
  } catch (err) {
    next(err);
  }
});

export default router;
