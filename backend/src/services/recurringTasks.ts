import cron from "node-cron";
import { prisma } from "../config/database.js";

const DAYS_OF_WEEK = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export function initRecurringTasksCron() {
  // Run every day at 00:01 (1 minute past midnight)
  cron.schedule("1 0 * * *", async () => {
    console.log("[CRON] Running recurring tasks job...");
    try {
      await processRecurringTasks();
    } catch (err) {
      console.error("[CRON] Error running recurring tasks:", err);
    }
  });
}

export async function processRecurringTasks() {
  const today = new Date();
  const dayName = DAYS_OF_WEEK[today.getDay()];

  // Start and end of today (midnight to midnight)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  // Find all active recurring tasks for today (specific day OR DAILY)
  const activeTasks = await prisma.recurringTask.findMany({
    where: {
      isActive: true,
      repeatDay: { in: [dayName, "DAILY"] },
    },
  });

  if (activeTasks.length === 0) {
    console.log(`[CRON] No recurring tasks found for ${dayName}.`);
    return;
  }

  console.log(`[CRON] Found ${activeTasks.length} recurring tasks for ${dayName}.`);

  let created = 0;
  let skipped = 0;

  for (const rTask of activeTasks) {
    // Find all teachers to assign the task to
    let teachers;
    if (!rTask.folderId) {
      // General task outside folders: assign to all active teachers/staff
      teachers = await prisma.user.findMany({
        where: {
          role: "TEACHER",
          status: "ACTIVE",
          isDeleted: false,
        },
      });
    } else {
      // Class-wise folder task: assign only to teachers of that specific class
      teachers = await prisma.user.findMany({
        where: {
          role: "TEACHER",
          studentClass: rTask.studentClass,
          status: "ACTIVE",
          isDeleted: false,
        },
      });
    }

    if (teachers.length === 0) continue;

    // Create a new task record for each teacher — skip if already assigned today
    for (const teacher of teachers) {
      // Duplicate guard: check if this recurring task was already assigned to this teacher today
      const existing = await prisma.task.findFirst({
        where: {
          teacherId: teacher.id,
          recurringTaskId: rTask.id,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create the Task
      const newTask = await prisma.task.create({
        data: {
          title: rTask.title,
          description: rTask.description,
          status: "PENDING",
          dueDate: new Date(), // Due today
          teacherId: teacher.id,
          recurringTaskId: rTask.id,
        },
      });

      // Log Task Audit History
      await prisma.taskAudit.create({
        data: {
          taskId: newTask.id,
          action: "CREATED",
          statusTo: "PENDING",
          changedByName: "System (Cron)",
          comments: "Task automatically assigned via recurring schedule.",
        },
      });

      // Notify the teacher
      await prisma.teacherNotification.create({
        data: {
          title: "New Task Assigned",
          message: `You have been assigned a new task: ${rTask.title}`,
          userId: teacher.id,
          type: "TASK_ASSIGNED",
          taskId: newTask.id,
        },
      });

      created++;
    }
  }

  console.log(`[CRON] Recurring tasks processing complete. Created: ${created}, Skipped (already exists): ${skipped}.`);
}
