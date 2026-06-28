import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { submitTaskProofSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { sendEmail, getTaskCompletionAdminHtml } from "../services/email.js";
import { env } from "../config/env.js";
import { createAdminNotification } from "../services/adminNotifications.js";
import { getFileMimeType } from "../services/googleDriveService.js";
import {
  buildLessonPlanClassFilter,
  buildStudentClassFilter,
  getTeacherAssignedClasses,
  resolveActiveClassFilter,
  teacherMatchesAnyClass,
} from "../utils/teacherClasses.js";

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
router.get("/lesson-plans", async (req, res, next) => {
  try {
    const teacherId = req.user!.userId;
    const assignedClasses = await getTeacherAssignedClasses(teacherId);
    const activeClasses = resolveActiveClassFilter(
      assignedClasses,
      typeof req.query.class === "string" ? req.query.class : null
    );

    const targetClassFilter = buildLessonPlanClassFilter(activeClasses);

    const plans = await prisma.lessonPlan.findMany({
      where: {
        isPublished: true,
        ...targetClassFilter,
      },
      orderBy: [{ planDate: "desc" }, { createdAt: "desc" }],
      include: { course: { select: { title: true, level: true } } },
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sanitizedPlans = plans.map((plan) => {
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
    const teacherId = req.user!.userId;
    const assignedClasses = await getTeacherAssignedClasses(teacherId);
    const targetClassFilter = buildLessonPlanClassFilter(assignedClasses);

    const plan = await prisma.lessonPlan.findFirst({
      where: {
        id: String(req.params.id),
        isPublished: true,
        ...targetClassFilter,
      },
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
    const classParam = req.query.class ? String(req.query.class) : "all";
    const teacherId = String(req.user!.userId);

    const tasks = await prisma.task.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      include: {
        recurringTask: { 
          select: { 
            repeatDay: true, 
            isActive: true,
            studentClass: true,
            assignedTeacherIds: true,
            folder: { select: { studentClass: true } }
          } 
        },
      },
    });

    let filteredTasks = tasks;
    if (classParam !== "all") {
      filteredTasks = tasks.filter((t: any) => {
        if (!t.recurringTask) return false; // One-off tasks have no class, so don't show them under specific class filters
        const rt = t.recurringTask;
        
        let belongsToClass = false;
        if (rt.studentClass) {
          const classes = rt.studentClass.split(",").map((c: string) => c.trim());
          if (classes.includes(classParam)) belongsToClass = true;
        }
        
        if (rt.folder && rt.folder.studentClass === classParam) {
          belongsToClass = true;
        }

        return belongsToClass;
      });
    }

    res.json(filteredTasks.map((t) => ({ ...t, assignedDate: t.createdAt })));
  } catch (err) {
    next(err);
  }
});

// ── Get Task Occurrences for a Recurring Task ───────────────────────
router.get("/tasks/recurring/:recurringTaskId/history", async (req, res, next) => {
  try {
    const recurringTaskId = String(req.params.recurringTaskId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const occurrences = await prisma.task.findMany({
      where: {
        recurringTaskId,
        teacherId: String(req.user!.userId),
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      include: {
        recurringTask: { select: { repeatDay: true } },
      },
    });
    res.json(occurrences);
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

    const newStatus = task.status === "REJECTED" ? "RESUBMITTED" : "SUBMITTED";

    const updated = await prisma.task.update({
      where: { id: String(id) },
      data: {
        proofUrl,
        proofDesc,
        status: newStatus,
        rejectionReason: null, // Clear any rejection reason on resubmission
        proofSubmittedAt: new Date(),
      },
      include: { teacher: { select: { name: true, email: true } } },
    });

    // Log Task Audit History
    await prisma.taskAudit.create({
      data: {
        taskId: task.id,
        action: newStatus,
        statusFrom: task.status,
        statusTo: newStatus,
        changedById: req.user!.userId,
        changedByName: updated.teacher.name || "Teacher",
        comments: proofDesc,
      },
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

// ── List Students in Teacher's Class(es) ───────────────────────────────
router.get("/students", async (req, res, next) => {
  try {
    const teacherId = req.user!.userId;
    const assignedClasses = await getTeacherAssignedClasses(teacherId);
    if (assignedClasses.length === 0) {
      return res.json([]);
    }

    const activeClasses = resolveActiveClassFilter(
      assignedClasses,
      typeof req.query.class === "string" ? req.query.class : null
    );

    const classRules = await prisma.driveAccessRule.findMany({
      where: {
        audience: { in: ["STUDENT", "BOTH"] },
        OR: [
          { targetClass: null },
          { targetClass: "" },
          ...activeClasses.map((cls) => ({ targetClass: { contains: cls } })),
        ],
      },
      select: {
        fileId: true,
        title: true,
        targetClass: true,
      },
    });

    const classBooks: Array<{ fileId: string; title: string; targetClass: string | null }> = [];
    for (const rule of classRules) {
      if (!teacherMatchesAnyClass(activeClasses, rule.targetClass)) continue;
      const mimeType = await getFileMimeType(rule.fileId);
      if (mimeType !== "application/vnd.google-apps.folder") {
        classBooks.push(rule);
      }
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isDeleted: false,
        ...buildStudentClassFilter(activeClasses),
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        studentClass: true,
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
            fileId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const mappedStudents = students.map((student) => {
      const bookNotifications = student.notifications.filter((n) => n.storyBookId || n.fileId);

      const relevantBooks = classBooks.filter((book) =>
        teacherMatchesAnyClass([student.studentClass ?? ""], book.targetClass)
      );

      const booksProgress = relevantBooks.map((book) => {
        const notif = bookNotifications.find((n) => n.fileId === book.fileId);
        return {
          id: book.fileId,
          title: book.title,
          author: null,
          category: book.targetClass || "Library",
          fileUrl: `/api/documents/${book.fileId}/view`,
          readingStatus: notif ? notif.readingStatus : "UNREAD",
          isRead: notif ? notif.readingStatus === "READ" : false,
        };
      });

      return {
        id: student.id,
        name: student.name,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        studentClass: student.studentClass,
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

// ── Get Task Audit History for Teacher ────────────────────────────────
router.get("/tasks/:id/audit", async (req, res, next) => {
  try {
    const taskId = String(req.params.id);
    const task = await prisma.task.findFirst({
      where: { id: taskId, teacherId: req.user!.userId },
    });
    if (!task) {
      throw new AppError("Task not found or not assigned to you", 404);
    }
    const audits = await prisma.taskAudit.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });
    res.json(audits);
  } catch (err) {
    next(err);
  }
});

export default router;
