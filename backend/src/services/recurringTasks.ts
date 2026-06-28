import cron from "node-cron";
import { prisma } from "../config/database.js";

const DAYS_OF_WEEK = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export function initRecurringTasksCron() {
  // Run every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running recurring tasks job...");
    try {
      await processRecurringTasks();
    } catch (err) {
      console.error("[CRON] Error running recurring tasks:", err);
    }
  });

  // Run every day at 16:05 (4:05 PM) to mark unsubmitted tasks as OVERDUE
  cron.schedule("5 16 * * *", async () => {
    console.log("[CRON] Running overdue tasks job...");
    try {
      await markOverdueTasks();
    } catch (err) {
      console.error("[CRON] Error running overdue tasks:", err);
    }
  });
}

export async function processRecurringTasks() {
  const today = new Date();
  const dayName = DAYS_OF_WEEK[today.getDay()];

  // Start and end of today (midnight to midnight)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Find all active recurring tasks for today (specific day OR DAILY OR TODAY OR specific date)
  const activeTasks = await prisma.recurringTask.findMany({
    where: {
      isActive: true,
      repeatDay: { in: [dayName, "DAILY", "TODAY", todayDateStr] },
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
    let classTeachers: any[] = [];
    if (rTask.studentClass) {
      const classList = rTask.studentClass.split(",").map((c) => c.trim()).filter(Boolean);
      if (classList.length > 0) {
        classTeachers = await prisma.user.findMany({
          where: {
            role: "TEACHER",
            status: "ACTIVE",
            isDeleted: false,
            OR: [
              {
                teacherAssignedClasses: {
                  some: { className: { in: classList } },
                },
              },
              {
                studentClass: { in: classList },
                teacherAssignedClasses: { none: {} },
              },
            ],
          },
        });
      }
    }

    let individualTeachers: any[] = [];
    if (rTask.assignedTeacherIds) {
      const teacherIdList = rTask.assignedTeacherIds.split(",").map((id) => id.trim()).filter(Boolean);
      if (teacherIdList.length > 0) {
        individualTeachers = await prisma.user.findMany({
          where: {
            id: { in: teacherIdList },
            role: "TEACHER",
            status: "ACTIVE",
            isDeleted: false,
          },
        });
      }
    }

    // Merge and deduplicate by id
    const teacherMap = new Map<string, any>();
    for (const t of classTeachers) teacherMap.set(t.id, t);
    for (const t of individualTeachers) teacherMap.set(t.id, t);
    const teachers = Array.from(teacherMap.values());

    if (teachers.length === 0) {
      if (rTask.repeatDay === "TODAY") {
        // Set to inactive even if no teachers found so it doesn't get stuck active
        await prisma.recurringTask.update({
          where: { id: rTask.id },
          data: { isActive: false },
        });
      }
      continue;
    }

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
        if (existing.title !== rTask.title || existing.description !== rTask.description) {
          await prisma.task.update({
            where: { id: existing.id },
            data: {
              title: rTask.title,
              description: rTask.description,
            }
          });
        }
        skipped++;
        continue;
      }

      // Create the Task
      const dueTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0, 0, 0); // 4:00 PM
      const newTask = await prisma.task.create({
        data: {
          title: rTask.title,
          description: rTask.description,
          status: "PENDING",
          dueDate: dueTime,
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

    if (rTask.repeatDay === "TODAY") {
      // Set to inactive so it doesn't run again tomorrow
      await prisma.recurringTask.update({
        where: { id: rTask.id },
        data: { isActive: false },
      });
    }
  }

  console.log(`[CRON] Recurring tasks processing complete. Created: ${created}, Skipped (already exists): ${skipped}.`);
}

export async function markOverdueTasks() {
  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
    },
  });

  if (overdueTasks.length === 0) return;

  console.log(`[CRON] Found ${overdueTasks.length} overdue tasks.`);

  for (const task of overdueTasks) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "OVERDUE" },
    });

    await prisma.taskAudit.create({
      data: {
        taskId: task.id,
        action: "OVERDUE",
        statusFrom: "PENDING",
        statusTo: "OVERDUE",
        changedByName: "System (Cron)",
        comments: "Task not submitted before due date.",
      },
    });
  }
}
