import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  approveMaterialSchema,
  createTestimonialSchema,
  approveTestimonialSchema,
  createGallerySchema,
  createTaskSchema,
  approveTaskSchema,
  createStoryBookSchema,
} from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { deleteFileFromWebDAV } from "../services/webdav.js";
import { sendEmail } from "../services/email.js";
import adminUserRoutes from "./admin-users.js";


const router = Router();

// All routes in this file require ADMIN role
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

// ── Delete Gallery Item ─────────────────────────────────────────────
router.delete("/gallery/:id", async (req, res, next) => {
  try {
    const item = await prisma.gallery.findUnique({ where: { id: String(req.params.id) } });
    if (!item) {
      throw new AppError("Gallery item not found", 404);
    }

    await prisma.gallery.delete({ where: { id: String(req.params.id) } });

    // Clean up from cPanel WebDAV storage asynchronously
    if (item.imageUrl) {
      deleteFileFromWebDAV(item.imageUrl).catch((err) =>
        console.error("Failed to delete gallery item from cPanel WebDAV:", err)
      );
    }

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

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
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
    await prisma.task.delete({ where: { id: String(req.params.id) } });
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

    await prisma.storyBook.delete({ where: { id: String(req.params.id) } });

    // Clean up from cPanel WebDAV storage asynchronously
    if (book.fileUrl) {
      deleteFileFromWebDAV(book.fileUrl).catch((err) =>
        console.error("Failed to delete story book from cPanel WebDAV:", err)
      );
    }

    res.json({ message: "Story book deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
