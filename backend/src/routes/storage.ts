import { Router } from "express";
import type { Prisma } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/database.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createMaterialSchema } from "../config/schemas.js";
import {
  buildUploadUrl,
  materialTypeFromMime,
  UPLOADS_DIR,
} from "../config/uploads.js";
import { AppError } from "../utils/errors.js";
import { removeStoredFile } from "../services/removeStoredFile.js";

const router = Router();

// Type for file metadata that includes size
interface UploadedFile extends Express.Multer.File {
  size: number;
}

function deleteLocalUpload(filename: string): void {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete orphaned file: ${filePath}`, err);
    });
  }
}

async function verifyLocalUpload(filename: string): Promise<void> {
  await fs.promises.access(path.join(UPLOADS_DIR, filename));
}

// ── Upload File (Teachers / Admin) ──────────────────────────────────
router.post(
  "/upload",
  authenticate,
  authorize("ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    let uploadedFilename: string | undefined;
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }
      uploadedFilename = req.file.filename;

      const validation = createMaterialSchema.safeParse(req.body);
      if (!validation.success) {
        const message = validation.error.issues[0]?.message ?? "Validation failed";
        throw new AppError(message, 400);
      }

      const { title, description, type, courseId } = validation.data;
      const file = req.file as UploadedFile;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      await verifyLocalUpload(file.filename);
      const fileUrl = buildUploadUrl(file.filename);

      const material = await prisma.material.create({
        data: {
          title,
          description,
          type,
          fileUrl,
          fileSize: file.size,
          courseId,
          uploadedById: req.user!.userId,
          isApproved: req.user!.role === "ADMIN",
        },
      });

      res.status(201).json(material);
    } catch (err) {
      if (uploadedFilename) {
        deleteLocalUpload(uploadedFilename);
      }
      next(err);
    }
  }
);

// ── Upload Raw File (returns JSON with /uploads/… URL) ─────────────
router.post(
  "/upload-raw",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  upload.single("file"),
  async (req, res, next) => {
    let uploadedFilename: string | undefined;
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }
      uploadedFilename = req.file.filename;
      const file = req.file as UploadedFile;

      await verifyLocalUpload(file.filename);
      const fileUrl = buildUploadUrl(file.filename);

      res.status(200).json({ url: fileUrl, storage: "local" as const, verified: true });
    } catch (err) {
      if (uploadedFilename) {
        deleteLocalUpload(uploadedFilename);
      }
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
    const uploadedFiles: string[] = [];
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("No files uploaded", 400);
      }

      for (const f of req.files) uploadedFiles.push(f.filename);

      const { courseId } = req.body;
      if (!courseId) {
        throw new AppError("Course ID is required", 400);
      }

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      const results = [];
      for (const file of req.files) {
        await verifyLocalUpload(file.filename);
        const fileUrl = buildUploadUrl(file.filename);

        const material = await prisma.material.create({
          data: {
            title: file.originalname,
            type: materialTypeFromMime(file.mimetype),
            fileUrl,
            fileSize: file.size,
            courseId,
            uploadedById: req.user!.userId,
            isApproved: req.user!.role === "ADMIN",
          },
        });
        results.push(material);
      }

      res.status(201).json(results);
    } catch (err) {
      uploadedFiles.forEach(deleteLocalUpload);
      next(err);
    }
  }
);

// ── List All Materials ──────────────────────────────────────────────
router.get("/materials", optionalAuthenticate, async (req, res, next) => {
  try {
    const { courseId, type } = req.query;

    const where: Prisma.MaterialWhereInput = {};
    if (courseId) where.courseId = courseId as string;
    if (type) where.type = type as string;

    if (!req.user || req.user.role === "STUDENT" || req.user.role === "TEACHER") {
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
router.get("/materials/:id", optionalAuthenticate, async (req, res, next) => {
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

    if (
      !material.isApproved &&
      (!req.user || req.user.role === "STUDENT" || req.user.role === "TEACHER")
    ) {
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
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const material = await prisma.material.findUnique({
        where: { id: String(req.params.id) },
      });

      if (!material) {
        throw new AppError("Material not found", 404);
      }

      await removeStoredFile(material.fileUrl);
      await prisma.material.delete({ where: { id: String(req.params.id) } });

      res.json({ message: "Material deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
