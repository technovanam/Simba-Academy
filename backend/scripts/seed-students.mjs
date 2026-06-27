/**
 * Seed sample students across all class levels.
 * Run: npm run db:seed-students
 *
 * Default password for all seeded students: SimbaStudent@2026
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const CLASSES = ["Playgroup", "Pre-KG", "LKG", "UKG"];
const DEFAULT_PASSWORD = "SimbaStudent@2026";

const STUDENTS = [
  { name: "Aarav Krishnan", email: "student01@simbaacademy.in", phone: "9876511001", studentClass: "Playgroup" },
  { name: "Diya Menon", email: "student02@simbaacademy.in", phone: "9876511002", studentClass: "Playgroup" },
  { name: "Vihaan Sharma", email: "student03@simbaacademy.in", phone: "9876511003", studentClass: "Playgroup" },
  { name: "Anika Reddy", email: "student04@simbaacademy.in", phone: "9876511004", studentClass: "Playgroup" },
  { name: "Rohan Iyer", email: "student05@simbaacademy.in", phone: "9876511005", studentClass: "Playgroup" },
  { name: "Ishita Nair", email: "student06@simbaacademy.in", phone: "9876511006", studentClass: "Pre-KG" },
  { name: "Arjun Pillai", email: "student07@simbaacademy.in", phone: "9876511007", studentClass: "Pre-KG" },
  { name: "Meera Sundaram", email: "student08@simbaacademy.in", phone: "9876511008", studentClass: "Pre-KG" },
  { name: "Karthik Rajan", email: "student09@simbaacademy.in", phone: "9876511009", studentClass: "Pre-KG" },
  { name: "Saanvi Devi", email: "student10@simbaacademy.in", phone: "9876511010", studentClass: "Pre-KG" },
  { name: "Aditya Murugan", email: "student11@simbaacademy.in", phone: "9876511011", studentClass: "LKG" },
  { name: "Priya Balaji", email: "student12@simbaacademy.in", phone: "9876511012", studentClass: "LKG" },
  { name: "Nikhil Chandran", email: "student13@simbaacademy.in", phone: "9876511013", studentClass: "LKG" },
  { name: "Lakshmi Gopal", email: "student14@simbaacademy.in", phone: "9876511014", studentClass: "LKG" },
  { name: "Vikram Selvam", email: "student15@simbaacademy.in", phone: "9876511015", studentClass: "LKG" },
  { name: "Harini Mohan", email: "student16@simbaacademy.in", phone: "9876511016", studentClass: "UKG" },
  { name: "Rahul Venkatesh", email: "student17@simbaacademy.in", phone: "9876511017", studentClass: "UKG" },
  { name: "Kavya Arun", email: "student18@simbaacademy.in", phone: "9876511018", studentClass: "UKG" },
  { name: "Siddharth Kumar", email: "student19@simbaacademy.in", phone: "9876511019", studentClass: "UKG" },
  { name: "Nandini Begum", email: "student20@simbaacademy.in", phone: "9876511020", studentClass: "UKG" },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

function parseDatabaseUrl(urlStr) {
  const parsed = new URL(urlStr);
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname,
  };
}

const dbConfig = parseDatabaseUrl(url);
const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 2,
});

const prisma = new PrismaClient({ adapter });

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  let created = 0;
  let skipped = 0;

  console.log(`Seeding ${STUDENTS.length} sample students…\n`);
  console.log(`Default password: ${DEFAULT_PASSWORD}\n`);

  for (const student of STUDENTS) {
    const email = student.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== "STUDENT") {
        console.log(`  ⚠️  Skip ${email} — exists as ${existing.role}`);
        skipped++;
        continue;
      }

      const { firstName, lastName } = splitName(student.name);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: student.name,
          firstName,
          lastName: lastName || null,
          phone: student.phone,
          studentClass: student.studentClass,
          status: "ACTIVE",
          isDeleted: false,
        },
      });

      console.log(`  ↻ Updated ${student.name} (${email}) → ${student.studentClass}`);
      skipped++;
      continue;
    }

    const { firstName, lastName } = splitName(student.name);
    await prisma.user.create({
      data: {
        name: student.name,
        firstName,
        lastName: lastName || null,
        email,
        password: hashedPassword,
        phone: student.phone,
        role: "STUDENT",
        studentClass: student.studentClass,
        status: "ACTIVE",
        mustChangePassword: false,
      },
    });

    console.log(`  ✓ ${student.name} (${email}) — ${student.studentClass}`);
    created++;
  }

  const total = await prisma.user.count({ where: { role: "STUDENT", isDeleted: false } });
  const byClass = await prisma.user.groupBy({
    by: ["studentClass"],
    where: { role: "STUDENT", isDeleted: false },
    _count: { id: true },
  });

  console.log("\n── Summary ──────────────────────────────");
  console.log(`  Created:              ${created}`);
  console.log(`  Skipped / updated:    ${skipped}`);
  console.log(`  Total students in DB: ${total}`);
  for (const cls of CLASSES) {
    const row = byClass.find((r) => r.studentClass === cls);
    console.log(`  ${cls.padEnd(12)} ${row?._count.id ?? 0}`);
  }
  console.log(`  Login password:       ${DEFAULT_PASSWORD}`);
  console.log("─────────────────────────────────────────\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
