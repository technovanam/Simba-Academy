import cron from "node-cron";
import { prisma } from "../config/database.js";
import { TeacherNotification } from "@prisma/client";

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

  // Find all active recurring tasks for today
  const activeTasks = await prisma.recurringTask.findMany({
    where: {
      repeatDay: dayName,
      isActive: true,
    },
  });

  if (activeTasks.length === 0) {
    console.log(`[CRON] No recurring tasks found for ${dayName}.`);
    return;
  }

  console.log(`[CRON] Found ${activeTasks.length} recurring tasks for ${dayName}.`);

  for (const rTask of activeTasks) {
    // Find all teachers in this studentClass
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        studentClass: rTask.studentClass,
        status: "ACTIVE",
        isDeleted: false,
      },
    });

    if (teachers.length === 0) continue;

    // Create a new task record for each teacher
    for (const teacher of teachers) {
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
    }
  }

  console.log(`[CRON] Recurring tasks processing complete.`);
}
