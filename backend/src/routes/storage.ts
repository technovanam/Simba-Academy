import { Router } from "express";
import { Prisma } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/database.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createMaterialSchema } from "../config/schemas.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { uploadFileToWebDAV } from "../services/webdav.js";
import { removeStoredFile } from "../services/removeStoredFile.js";

const router = Router();

// Type for file metadata that includes size
interface UploadedFile extends Express.Multer.File {
  size: number;
}

/**
 * Utility to delete a file if something goes wrong after upload.
 */
function deleteFile(filename: string): void {
  const filePath = path.resolve(env.STORAGE_PATH, filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete orphaned file: ${filePath}`, err);
    });
  }
}

// ── Upload File (Teachers / Admin) ──────────────────────────────────
router.post(
  "/upload",
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

      // Validate body manually to allow cleanup on failure
      const validation = createMaterialSchema.safeParse(req.body);
      if (!validation.success) {
        // Return first error message
        const message = validation.error.issues[0]?.message ?? "Validation failed";
        throw new AppError(message, 400);
      }

      const { title, description, type, courseId } = validation.data;
      const file = req.file as UploadedFile;

      // Verify course exists
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      let fileUrl = `/uploads/${file.filename}`;
      if (env.USE_WEBDAV) {
        const localPath = path.resolve(env.STORAGE_PATH, file.filename);
        fileUrl = await uploadFileToWebDAV(localPath, file.filename);
        // Clean up local temp file
        deleteFile(file.filename);
      }

      const material = await prisma.material.create({
        data: {
          title,
          description,
          type,
          fileUrl,
          fileSize: file.size,
          courseId,
          uploadedById: req.user!.userId,
          isApproved: req.user!.role === "ADMIN", // Auto-approve if admin uploads
        },
      });

      res.status(201).json(material);
    } catch (err) {
      // Cleanup orphaned file
      if (uploadedFilename) {
        deleteFile(uploadedFilename);
      }
      next(err);
    }
  }
);

// ── Upload Raw File (Generic - returns JSON with URL) ────────────────
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

      const localPath = path.resolve(env.STORAGE_PATH, file.filename);
      let fileUrl = `/uploads/${file.filename}`;
      let storage: "webdav" | "local" = "local";

      if (env.USE_WEBDAV) {
        fileUrl = await uploadFileToWebDAV(localPath, file.filename);
        storage = "webdav";
        deleteFile(file.filename);
      } else {
        await fs.promises.access(localPath);
      }

      res.status(200).json({ url: fileUrl, storage, verified: true });
    } catch (err) {
      if (uploadedFilename) {
        deleteFile(uploadedFilename);
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

      // Verify course exists before creating any material rows.
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      const results = [];
      for (const file of req.files) {
        let fileUrl = `/uploads/${file.filename}`;
        if (env.USE_WEBDAV) {
          const localPath = path.resolve(env.STORAGE_PATH, file.filename);
          fileUrl = await uploadFileToWebDAV(localPath, file.filename);
          // Clean up local temp file
          deleteFile(file.filename);
        }

        const material = await prisma.material.create({
          data: {
            title: file.originalname,
            type: getFileType(file.mimetype),
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
      // Cleanup all orphaned files
      uploadedFiles.forEach(deleteFile);
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
router.get("/materials", optionalAuthenticate, async (req, res, next) => {
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

      await removeStoredFile(material.fileUrl);
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
