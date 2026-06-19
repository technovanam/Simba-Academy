/// <reference types="node" />
import process from "process";
import { prisma } from "./src/config/database.js";

async function fix() {
  console.log("=== Updating recurring tasks to DAILY ===");
  // Update all existing recurring tasks to repeat DAILY
  const updated = await prisma.recurringTask.updateMany({
    where: { repeatDay: { in: ["SATURDAY", "WEDNESDAY", "FRIDAY"] } },
    data: { repeatDay: "DAILY" },
  });
  console.log(`Updated ${updated.count} recurring tasks to DAILY.`);

  // Clean up tasks assigned to the "Test LKG Teacher" (cmqj60cxx0001moknprefgzdl)
  console.log("=== Cleaning up test teacher tasks ===");
  const TEST_TEACHER_ID = "cmqj60cxx0001moknprefgzdl";
  const testTasks = await prisma.task.findMany({ where: { teacherId: TEST_TEACHER_ID } });
  const testTaskIds = testTasks.map((t) => t.id);
  if (testTaskIds.length > 0) {
    await prisma.teacherNotification.deleteMany({ where: { taskId: { in: testTaskIds } } });
    await prisma.task.deleteMany({ where: { teacherId: TEST_TEACHER_ID } });
    console.log(`Deleted ${testTaskIds.length} test teacher tasks.`);
  }

  console.log("=== Checking real teacher Sasikiran TT tasks ===");
  const realTeacherTasks = await prisma.task.findMany({
    where: { teacherId: "cmqhj3e560000isknoii68r13" },
    select: { id: true, title: true, status: true, createdAt: true },
  });
  console.log(`Real teacher currently has ${realTeacherTasks.length} tasks:`);
  realTeacherTasks.forEach((t) => console.log(`  - ${t.title} [${t.status}] ${t.createdAt}`));
}

fix()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
