import { processRecurringTasks } from "./src/services/recurringTasks.js";
import { prisma } from "./src/config/database.js";

async function verify() {
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  
  console.log("Creating test recurring task for today:", dayName);
  const rt = await prisma.recurringTask.create({
    data: {
      title: "Test Task " + Date.now(),
      studentClass: "LKG",
      repeatDay: dayName,
      isActive: true,
    }
  });

  console.log("Creating test teacher for LKG...");
  const t = await prisma.user.create({
    data: {
      email: `test.lkg.teacher.${Date.now()}@example.com`,
      password: "pass",
      name: "Test LKG Teacher",
      role: "TEACHER",
      studentClass: "LKG",
      status: "ACTIVE",
    }
  });

  console.log("Running processRecurringTasks...");
  await processRecurringTasks();

  console.log("Checking history...");
  const tasks = await prisma.task.findMany({
    where: { recurringTaskId: rt.id }
  });

  console.log("Generated tasks for today:", tasks.length);
  if (tasks.length > 0) {
    console.log("✅ CRON Job logic verified successfully!");
  } else {
    console.log("❌ Failed to generate tasks.");
  }

  // Cleanup
  await prisma.task.deleteMany({ where: { recurringTaskId: rt.id } });
  await prisma.recurringTask.delete({ where: { id: rt.id } });
  await prisma.user.delete({ where: { id: t.id } });
  console.log("Cleanup done.");
}

verify().catch(console.error).finally(() => process.exit(0));
