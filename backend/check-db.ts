/// <reference types="node" />
import { prisma } from "./src/config/database.js";

async function check() {
  console.log("=== Recurring Tasks ===");
  const rTasks = await prisma.recurringTask.findMany();
  console.log(JSON.stringify(rTasks, null, 2));
  
  console.log("\n=== Tasks ===");
  const tasks = await prisma.task.findMany({
    include: { teacher: { select: { name: true, email: true, studentClass: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log(JSON.stringify(tasks, null, 2));
  
  console.log("\n=== Teachers ===");
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", isDeleted: false },
    select: { id: true, name: true, email: true, studentClass: true, status: true },
  });
  console.log(JSON.stringify(teachers, null, 2));
}

check().catch(console.error).finally(() => process.exit(0));
