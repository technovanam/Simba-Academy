import { prisma } from "./config/database.js";
import bcrypt from "bcryptjs";

async function main() {
  const lkgTeacher = await prisma.user.findFirst({
    where: { email: "lkg_teacher@simbaacademy.in" },
  });

  if (!lkgTeacher) {
    const hashedPassword = await bcrypt.hash("Simba@123!@#", 12);
    await prisma.user.create({
      data: {
        name: "LKG Teacher",
        email: "lkg_teacher@simbaacademy.in",
        password: hashedPassword,
        role: "TEACHER",
        status: "ACTIVE",
        studentClass: "LKG",
      },
    });
    console.log("Seeded LKG Teacher successfully.");
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: { id: true, name: true, email: true, studentClass: true },
  });
  console.log("TEACHERS IN DB:", JSON.stringify(teachers, null, 2));

  const lessonPlans = await prisma.lessonPlan.findMany({
    select: { id: true, title: true, targetClass: true },
  });
  console.log("LESSON PLANS IN DB:", JSON.stringify(lessonPlans, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
