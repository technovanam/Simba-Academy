import cron from "node-cron";
import { prisma } from "../config/database.js";

export function startOverdueTaskNotifier() {
  // Run every minute to check if any task has crossed the 4 PM deadline today
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // IST is UTC + 5:30
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + istOffset);

      const overdueTasks = await prisma.task.findMany({
        where: {
          status: { in: ["PENDING", "REJECTED"] },
          isOverdueNotified: false,
          dueDate: { not: null }
        },
        include: { teacher: true }
      });

      for (const task of overdueTasks) {
        if (!task.dueDate) continue;

        // dueDate is stored as UTC. We convert it to IST to accurately compare dates.
        const taskDueIST = new Date(task.dueDate.getTime() + istOffset);

        // Check if the current time in IST has crossed 4 PM (16:00) on the due date,
        // OR if the current date is strictly after the due date.
        const isPastDue =
          (nowIST.getUTCFullYear() > taskDueIST.getUTCFullYear()) ||
          (nowIST.getUTCFullYear() === taskDueIST.getUTCFullYear() && nowIST.getUTCMonth() > taskDueIST.getUTCMonth()) ||
          (nowIST.getUTCFullYear() === taskDueIST.getUTCFullYear() && nowIST.getUTCMonth() === taskDueIST.getUTCMonth() && nowIST.getUTCDate() > taskDueIST.getUTCDate()) ||
          (nowIST.getUTCFullYear() === taskDueIST.getUTCFullYear() && nowIST.getUTCMonth() === taskDueIST.getUTCMonth() && nowIST.getUTCDate() === taskDueIST.getUTCDate() && nowIST.getUTCHours() >= 16);

        if (isPastDue) {
          // Notify admin
          await prisma.adminNotification.create({
            data: {
              type: "TASK_OVERDUE",
              title: "Task Overdue",
              message: `Teacher ${task.teacher.name} (${task.teacher.email}) has not completed the task "${task.title}" by the 4 PM deadline.`,
              taskId: task.id,
              userId: task.teacherId,
              isRead: false
            }
          });

          // Mark as notified so it only sends once
          await prisma.task.update({
            where: { id: task.id },
            data: { isOverdueNotified: true }
          });
          
          console.log(`Notified admin for overdue task: ${task.id}`);
        }
      }
    } catch (e) {
      console.error("Overdue task notifier error:", e);
    }
  });
}
