import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateUserSchema,
  approveMaterialSchema,
  createTestimonialSchema,
  approveTestimonialSchema,
  createGallerySchema,
} from "../config/schemas.js";
import { AppError } from "../utils/errors.js";

const router = Router();

// All routes in this file require ADMIN role
router.use(authenticate, authorize("ADMIN"));

// ═════════════════════════════════════════════════════════════════════
//  USERS
// ═════════════════════════════════════════════════════════════════════

// ── List All Users ──────────────────────────────────────────────────
router.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { payments: true, uploadedFiles: true } },
      },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// ── Update User ─────────────────────────────────────────────────────
router.patch("/users/:id", validate(updateUserSchema), async (req, res, next) => {
  try {      const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updated = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: req.body,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Delete User ─────────────────────────────────────────────────────
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent deleting yourself
    if (user.id === req.user!.userId) {
      throw new AppError("Cannot delete your own account", 400);
    }

    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});

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
    await prisma.gallery.delete({ where: { id: String(req.params.id) } });
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
      prisma.user.count(),
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

export default router;
