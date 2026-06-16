import { prisma } from "../config/database.js";

interface AdminNotificationPayload {
  type: string;
  title: string;
  message: string;
  userId?: string;
  taskId?: string;
  paymentId?: string;
}

export async function createAdminNotification(data: AdminNotificationPayload) {
  try {
    return await prisma.adminNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId || null,
        taskId: data.taskId || null,
        paymentId: data.paymentId || null,
      },
    });
  } catch (err) {
    console.error("Failed to create admin notification:", err);
  }
}
