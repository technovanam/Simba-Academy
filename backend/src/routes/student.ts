import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";

const router = Router();

router.use(authenticate, authorize("STUDENT"));

function assertNotificationModel() {
  if (!prisma.studentNotification) {
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
    const count = await prisma.studentNotification.count({
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
    const notifications = await prisma.studentNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        storyBook: {
          select: { id: true, title: true, category: true, author: true },
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
    const userId = req.user!.userId;
    await prisma.studentNotification.updateMany({
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
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const existing = await prisma.studentNotification.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new AppError("Notification not found", 404);
    }

    const updated = await prisma.studentNotification.update({
      where: { id },
      data: { isRead: true },
      include: {
        storyBook: {
          select: { id: true, title: true, category: true, author: true },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post("/books/:bookId/status", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const bookId = String(req.params.bookId);
    const { status, title, category } = req.body;

    if (status !== "READING" && status !== "READ" && status !== "UNREAD") {
      throw new AppError("Invalid status", 400);
    }

    // Find any STORY_BOOK notification for this user and book (checking both database storyBookId and Google Drive fileId)
    const notification = await prisma.studentNotification.findFirst({
      where: {
        userId,
        type: "STORY_BOOK",
        OR: [
          { storyBookId: bookId },
          { fileId: bookId }
        ]
      },
    });

    if (notification) {
      if (notification.readingStatus === "READ" && status !== "READ") {
        // Once marked as READ, do not revert to READING or UNREAD
        return res.json({ success: true, status: "READ" });
      }
      const updated = await prisma.studentNotification.update({
        where: { id: notification.id },
        data: { 
          readingStatus: status,
          isRead: notification.isRead || status === "READ",
        },
      });
      return res.json({ success: true, status: updated.readingStatus });
    } else {
      // Find the story book in DB first
      const book = await prisma.storyBook.findUnique({
        where: { id: bookId }
      });
      if (book) {
        const authorSuffix = book.author ? ` by ${book.author}` : "";
        const created = await prisma.studentNotification.create({
          data: {
            userId,
            storyBookId: bookId,
            type: "STORY_BOOK",
            title: "New story book available",
            message: `"${book.title}"${authorSuffix} was added to your ${book.category} library.`,
            readingStatus: status,
            isRead: status === "READ",
          },
        });
        return res.json({ success: true, status: created.readingStatus });
      }

      // Check if it's a Google Drive file with an access rule, or if title was provided
      const driveRule = await prisma.driveAccessRule.findUnique({
        where: { fileId: bookId }
      });

      if (driveRule || title) {
        const bookTitle = title || driveRule?.title || "Story Book";
        const bookCategory = category || driveRule?.targetClass || "Library";
        const created = await prisma.studentNotification.create({
          data: {
            userId,
            fileId: bookId,
            type: "STORY_BOOK",
            title: "New story book available",
            message: `"${bookTitle}" was added to your ${bookCategory} library.`,
            readingStatus: status,
            isRead: status === "READ",
          },
        });
        return res.json({ success: true, status: created.readingStatus });
      }
    }

    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
});

export default router;
