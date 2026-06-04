import "dotenv/config";
import * as mariadb from "mariadb";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function parseDatabaseUrl(raw) {
  const url = new URL(raw.replace(/^mysql:/, "http:"));
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "").split("?")[0],
  };
}

const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL);
console.log("DATABASE:", dbInfo.database, "@", dbInfo.host);

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

try {
  const paymentCols = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM Payment");
  const colNames = paymentCols.map((c) => c.Field);
  console.log("\nPayment columns:", colNames.join(", "));
  if (!colNames.includes("paymentSessionId")) {
    console.error("FAIL: paymentSessionId missing — run npm run db:migrate-payments");
    process.exit(1);
  }

  const [users, courses, payments, successPayments, revenue, inquiries, tasks] =
    await Promise.all([
      prisma.user.count({ where: { isDeleted: false, status: "ACTIVE" } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.inquiry.count(),
      prisma.task.count(),
    ]);

  console.log("\n--- Dashboard stats (same queries as /api/admin/dashboard) ---");
  console.log("Active users:", users);
  console.log("Active courses:", courses);
  console.log("Total payments:", payments);
  console.log("Successful payments:", successPayments);
  console.log("Revenue (INR):", revenue._sum.amount ?? 0);
  console.log("Inquiries:", inquiries);
  console.log("Tasks:", tasks);

  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  console.log("\n--- Recent payments (same as /api/admin/payments, top 5) ---");
  if (recentPayments.length === 0) {
    console.log("(no payment rows yet)");
  } else {
    for (const p of recentPayments) {
      console.log(
        `- ${p.status} ₹${p.amount} | ${p.user?.name ?? "?"} | ${p.course?.title ?? "registration"} | session=${p.paymentSessionId?.slice(0, 20) ?? "—"}…`
      );
    }
  }

  const allUsers = await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      employeeId: true,
      createdAt: true,
    },
  });

  const teachers = allUsers.filter((u) => u.role === "TEACHER");
  const students = allUsers.filter((u) => u.role === "STUDENT");
  const admins = allUsers.filter((u) => u.role === "ADMIN");

  console.log("\n--- Registered Users (/api/admin/users) ---");
  console.log("Total (not deleted):", allUsers.length);
  console.log("  Students:", students.length);
  console.log("  Teachers:", teachers.length);
  console.log("  Admins:", admins.length);
  for (const u of allUsers) {
    console.log(`  - [${u.role}] ${u.status} | ${u.name} <${u.email}>`);
  }

  console.log("\n--- Teacher Management (/api/admin/teachers) ---");
  console.log("Teachers:", teachers.length);
  for (const t of teachers) {
    console.log(`  - ${t.status} | ${t.name} <${t.email}>${t.employeeId ? ` | ${t.employeeId}` : ""}`);
  }

  console.log("\nOK: Prisma reads match admin users & teachers APIs.");
} catch (err) {
  console.error("\nFAIL:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
