import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createMaterialSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";

const router = Router();

// Type for file metadata that includes size
interface UploadedFile extends Express.Multer.File {
  size: number;
}

// ── Upload File (Teachers / Admin) ──────────────────────────────────
router.post(
  "/upload",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  upload.single("file"),
  validate(createMaterialSchema),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }

      const file = req.file as UploadedFile;
      const { title, description, type, courseId } = req.body;

      // Verify course exists
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      const material = await prisma.material.create({
        data: {
          title,
          description,
          type,
          fileUrl: `/uploads/${file.filename}`,
          fileSize: file.size,
          courseId,
          uploadedById: req.user!.userId,
          isApproved: req.user!.role === "ADMIN", // Auto-approve if admin uploads
        },
      });

      res.status(201).json(material);
    } catch (err) {
      next(err);
    }
  }
);

// ── Upload Multiple Files ───────────────────────────────────────────
router.post(
  "/upload-multiple",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("No files uploaded", 400);
      }

      const { courseId } = req.body;
      const uploadedFiles = [];

      for (const file of req.files) {
        const material = await prisma.material.create({
          data: {
            title: file.originalname,
            type: getFileType(file.mimetype),
            fileUrl: `/uploads/${file.filename}`,
            fileSize: file.size,
            courseId,
            uploadedById: req.user!.userId,
            isApproved: req.user!.role === "ADMIN",
          },
        });
        uploadedFiles.push(material);
      }

      res.status(201).json(uploadedFiles);
    } catch (err) {
      next(err);
    }
  }
);

function getFileType(mimetype: string): string {
  if (mimetype.includes("pdf")) return "PDF";
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "PPT";
  if (mimetype.includes("video")) return "VIDEO";
  if (mimetype.includes("image")) return "IMAGE";
  if (mimetype.includes("document") || mimetype.includes("msword")) return "DOC";
  return "DOC";
}

// ── List All Materials ──────────────────────────────────────────────
router.get("/materials", async (req, res, next) => {
  try {
    const { courseId, type } = req.query;

    const where: Prisma.MaterialWhereInput = {};
    if (courseId) where.courseId = courseId as string;
    if (type) where.type = type as string;

    // Students only see approved materials
    if (!req.user || req.user.role === "STUDENT") {
      where.isApproved = true;
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true, slug: true } },
        uploadedBy: { select: { name: true } },
      },
    });

    res.json(materials);
  } catch (err) {
    next(err);
  }
});

// ── Get Material by ID ──────────────────────────────────────────────
router.get("/materials/:id", async (req, res, next) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: String(req.params.id) },
      include: {
        course: { select: { title: true, slug: true } },
        uploadedBy: { select: { name: true } },
      },
    });

    if (!material) {
      throw new AppError("Material not found", 404);
    }

    if (!material.isApproved && (!req.user || req.user.role === "STUDENT")) {
      throw new AppError("Material not available", 404);
    }

    res.json(material);
  } catch (err) {
    next(err);
  }
});

// ── Delete Material ─────────────────────────────────────────────────
router.delete(
  "/materials/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  async (req, res, next) => {
    try {
      const material = await prisma.material.findUnique({
        where: { id: String(req.params.id) },
      });

      if (!material) {
        throw new AppError("Material not found", 404);
      }

      // Teachers can only delete their own uploads
      if (req.user!.role === "TEACHER" && material.uploadedById !== req.user!.userId) {
        throw new AppError("You can only delete your own uploads", 403);
      }

      await prisma.material.delete({ where: { id: String(req.params.id) } });

      res.json({ message: "Material deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// ── Serve Static Files ──────────────────────────────────────────────
// Files are served via express.static in index.ts

export default router;
