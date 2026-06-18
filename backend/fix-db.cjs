const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      proofDesc: "Approved by Admin"
    }
  });

  for (const t of tasks) {
    await prisma.task.update({
      where: { id: t.id },
      data: { proofDesc: "This is the teacher's original proof description." }
    });
  }
  
  console.log("Updated", tasks.length, "tasks.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
