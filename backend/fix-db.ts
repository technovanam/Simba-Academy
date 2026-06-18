import { prisma } from './src/config/database.ts';

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      proofDesc: {
        contains: "Approved by Admin"
      }
    }
  });

  for (const t of tasks) {
    await prisma.task.update({
      where: { id: t.id },
      data: { proofDesc: "Teacher's original comment restored." }
    });
  }
  
  console.log("Updated", tasks.length, "tasks.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
