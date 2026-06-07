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

export default router;
