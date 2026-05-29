import { Router } from "express";
import { prisma } from "../config/database.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createCourseSchema, updateCourseSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";

const router = Router();

// ── List All Courses (Public) ───────────────────────────────────────
router.get("/", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { materials: { where: { isApproved: true } }, payments: true } },
      },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// ── Get Course by Slug (Public) ─────────────────────────────────────
router.get("/:slug", async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        materials: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: { select: { name: true } } },
        },
        _count: { select: { payments: { where: { status: "SUCCESS" } } } },
      },
    });

    if (!course || !course.isActive) {
      throw new AppError("Course not found", 404);
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
});

// ── Create Course (Admin) ───────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCourseSchema),
  async (req, res, next) => {
    try {
      const { title, description, level, price, imageUrl } = req.body;

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const course = await prisma.course.create({
        data: { title, slug, description, level, price, imageUrl },
      });

      res.status(201).json(course);
    } catch (err) {
      next(err);
    }
  }
);

// ── Update Course (Admin) ───────────────────────────────────────────
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCourseSchema),
  async (req, res, next) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      const data: Record<string, unknown> = { ...req.body };
      if (data.title) {
        data.slug = (data.title as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      const updated = await prisma.course.update({
        where: { id: String(req.params.id) },
        data,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── Delete Course (Admin) ───────────────────────────────────────────
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      await prisma.course.delete({ where: { id: String(req.params.id) } });
      res.json({ message: "Course deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
