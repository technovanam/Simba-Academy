import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const teacherId = "cm0dt8xxj0000y81f3x8k2r4n"; // wait, I don't know the teacherId.
  // I will just fetch ALL tasks and their recurringTasks and apply the filter for all of them.
  const tasks = await prisma.task.findMany({
    include: {
      recurringTask: { 
        select: { 
          repeatDay: true, 
          isActive: true,
          studentClass: true,
          assignedTeacherIds: true,
          folder: { select: { studentClass: true } }
        } 
      },
    },
  });

  console.log("Total tasks:", tasks.length);

  const classParam = "Playgroup";

  const filteredTasks = tasks.filter((t) => {
    if (!t.recurringTask) return true;
    const rt = t.recurringTask;
    
    const classes = rt.studentClass ? rt.studentClass.split(",").map((c) => c.trim()) : [];
    if (classes.includes(classParam)) return true;
    
    if (rt.folder && rt.folder.studentClass === classParam) return true;
    
    const explicitTeachers = rt.assignedTeacherIds ? rt.assignedTeacherIds.split(",").map((id) => id.trim()) : [];
    if (explicitTeachers.includes(t.teacherId)) return true;

    return false;
  });

  console.log("Tasks in Playgroup:", filteredTasks.length);
  for (const t of filteredTasks) {
    console.log(`Task: ${t.title} | Teacher: ${t.teacherId}`);
    console.log(`  rt.studentClass: ${t.recurringTask?.studentClass}`);
    console.log(`  rt.folder?.studentClass: ${t.recurringTask?.folder?.studentClass}`);
    console.log(`  rt.assignedTeacherIds: ${t.recurringTask?.assignedTeacherIds}`);
  }
}

main().finally(() => prisma.$disconnect());
