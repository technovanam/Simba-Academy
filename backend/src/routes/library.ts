import type { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authenticateFromHeaderOrQuery, authorize } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import { audienceFilterForRole, canAccessStoryBook, audienceFilterForFolders } from "../utils/libraryAudience.js";
import { readLibraryFile } from "../services/libraryFile.js";

const router = Router();
const libraryRoles = authorize("ADMIN", "TEACHER", "STUDENT");

/** List folders visible to the current user's role. */
router.get("/folders", authenticate, libraryRoles, async (req, res, next) => {
  try {
    const role = req.user!.role as Role;
    const audienceWhere = audienceFilterForFolders(role);
    const parentId = typeof req.query.parentId === "string" ? req.query.parentId : undefined;
    const parentFilter =
      parentId === "root" || !parentId
        ? { parentId: null }
        : { parentId };

    let classWhere: any = {};
    if (role === "STUDENT") {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { studentClass: true },
      });
      if (user?.studentClass) {
        // Show folders matching class or with no class restriction
        classWhere = {
          OR: [
            { category: user.studentClass },
            { category: null }
          ]
        };
      }
    }

    const folders = await prisma.libraryFolder.findMany({
      where: { ...parentFilter, ...audienceWhere, ...classWhere },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { children: true, storyBooks: true },
        },
      },
    });
    res.json(folders);
  } catch (err) {
    next(err);
  }
});

/** Get folder ancestors (breadcrumb path). */
router.get("/folders/:id/ancestors", authenticate, libraryRoles, async (req, res, next) => {
  try {
    const ancestors: Array<{ id: string; name: string; parentId: string | null }> = [];
    let currentId: string | null = String(req.params.id);
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const f: { id: string; name: string; parentId: string | null } | null = await prisma.libraryFolder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });
      if (!f) break;
      ancestors.unshift(f);
      currentId = f.parentId;
    }

    res.json(ancestors);
  } catch (err) {
    next(err);
  }
});

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

    const folderId = typeof req.query.folderId === "string" ? req.query.folderId : undefined;
    const folderFilter =
      folderId === "root"
        ? { folderId: null }
        : folderId
          ? { folderId }
          : {};

    const books = await prisma.storyBook.findMany({
      where: { ...audienceWhere, ...classWhere, ...folderFilter },
      orderBy: { createdAt: "desc" },
    });

    if (role === "STUDENT") {
      const notifications = await prisma.studentNotification.findMany({
        where: {
          userId: req.user!.userId,
          type: "STORY_BOOK",
        },
        select: {
          storyBookId: true,
          isRead: true,
          readingStatus: true,
        },
      });

      const mappedBooks = books.map((book) => {
        const notif = notifications.find((n) => n.storyBookId === book.id);
        return {
          ...book,
          readingStatus: notif 
            ? (notif.readingStatus === "READING" 
                ? "READING" 
                : (notif.isRead ? "READ" : "UNREAD")) 
            : "UNREAD",
          isRead: notif ? notif.isRead : false,
        };
      });

      return res.json(mappedBooks);
    }

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

