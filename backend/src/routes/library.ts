import type { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authenticateFromHeaderOrQuery, authorize } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import { audienceFilterForRole, canAccessStoryBook } from "../utils/libraryAudience.js";
import { readLibraryFile } from "../services/libraryFile.js";

const router = Router();
const libraryRoles = authorize("ADMIN", "TEACHER", "STUDENT");

/** List story books visible to the current user's role. */
router.get("/storybooks", authenticate, libraryRoles, async (req, res, next) => {
  try {
    const role = req.user!.role as Role;
    const audienceWhere = audienceFilterForRole(role);

    let classWhere: { category?: string } = {};
    if (role === "STUDENT") {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { studentClass: true },
      });
      if (user?.studentClass) {
        classWhere = { category: user.studentClass };
      }
    }

    const books = await prisma.storyBook.findMany({
      where: { ...audienceWhere, ...classWhere },
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

/**
 * Stream a story book for in-browser view/print.
 * Students & teachers: inline only (no download).
 * Admin: may pass ?download=1 for attachment download.
 */
router.get("/storybooks/:id/view", authenticateFromHeaderOrQuery, libraryRoles, async (req, res, next) => {
  try {
    const book = await prisma.storyBook.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!book) {
      throw new AppError("Story book not found", 404);
    }

    const role = req.user!.role as Role;
    if (!canAccessStoryBook(role, book.audience)) {
      throw new AppError("You do not have access to this story book", 403);
    }

    const { buffer, contentType, filename } = await readLibraryFile(book.fileUrl);
    const allowDownload = role === "ADMIN" && req.query.download === "1";
    const disposition = allowDownload ? "attachment" : "inline";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename.replace(/"/g, "")}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!allowDownload) {
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    }
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
