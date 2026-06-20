import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' }});
  console.log('Teachers:', teachers.map(t => ({ email: t.email, class: t.studentClass })));
  
  const plans = await prisma.lessonPlan.findMany();
  console.log('Plans:', plans.map(p => ({ title: p.title, targetClass: p.targetClass, isPublished: p.isPublished })));
  
  await prisma.$disconnect();
}

main();
