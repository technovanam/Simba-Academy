/**
 * Seed sample teachers with single- and multi-class assignments.
 * Run: npm run db:seed-teachers
 *
 * Default password for all seeded teachers: SimbaTeacher@2026
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const CLASSES = ["Playgroup", "Pre-KG", "LKG", "UKG"];
const DEFAULT_PASSWORD = "SimbaTeacher@2026";

const TEACHERS = [
  { firstName: "Ananya", lastName: "Sharma", email: "teacher01@simbaacademy.in", phone: "9876501001", classes: ["Playgroup"] },
  { firstName: "Priya", lastName: "Nair", email: "teacher02@simbaacademy.in", phone: "9876501002", classes: ["Pre-KG"] },
  { firstName: "Kavitha", lastName: "Rajan", email: "teacher03@simbaacademy.in", phone: "9876501003", classes: ["LKG"] },
  { firstName: "Meena", lastName: "Devi", email: "teacher04@simbaacademy.in", phone: "9876501004", classes: ["UKG"] },
  { firstName: "Divya", lastName: "Krishnan", email: "teacher05@simbaacademy.in", phone: "9876501005", classes: ["Playgroup", "Pre-KG"] },
  { firstName: "Lakshmi", lastName: "Iyer", email: "teacher06@simbaacademy.in", phone: "9876501006", classes: ["Pre-KG", "LKG"] },
  { firstName: "Sowmya", lastName: "Venkatesh", email: "teacher07@simbaacademy.in", phone: "9876501007", classes: ["LKG", "UKG"] },
  { firstName: "Revathi", lastName: "Murugan", email: "teacher08@simbaacademy.in", phone: "9876501008", classes: ["Playgroup", "LKG"] },
  { firstName: "Harini", lastName: "Subramanian", email: "teacher09@simbaacademy.in", phone: "9876501009", classes: ["Pre-KG", "UKG"] },
  { firstName: "Nithya", lastName: "Balaji", email: "teacher10@simbaacademy.in", phone: "9876501010", classes: ["Playgroup", "UKG"] },
  { firstName: "Deepa", lastName: "Chandran", email: "teacher11@simbaacademy.in", phone: "9876501011", classes: ["Playgroup", "Pre-KG", "LKG"] },
  { firstName: "Swathi", lastName: "Gopal", email: "teacher12@simbaacademy.in", phone: "9876501012", classes: ["Pre-KG", "LKG", "UKG"] },
  { firstName: "Pooja", lastName: "Menon", email: "teacher13@simbaacademy.in", phone: "9876501013", classes: ["Playgroup", "LKG", "UKG"] },
  { firstName: "Renuka", lastName: "Pillai", email: "teacher14@simbaacademy.in", phone: "9876501014", classes: ["Playgroup", "Pre-KG", "UKG"] },
  { firstName: "Aishwarya", lastName: "Reddy", email: "teacher15@simbaacademy.in", phone: "9876501015", classes: CLASSES },
  { firstName: "Bhavani", lastName: "Sundaram", email: "teacher16@simbaacademy.in", phone: "9876501016", classes: CLASSES },
  { firstName: "Chitra", lastName: "Arun", email: "teacher17@simbaacademy.in", phone: "9876501017", classes: ["LKG"] },
  { firstName: "Durga", lastName: "Prasad", email: "teacher18@simbaacademy.in", phone: "9876501018", classes: ["UKG"] },
  { firstName: "Eswari", lastName: "Kumar", email: "teacher19@simbaacademy.in", phone: "9876501019", classes: ["Playgroup", "Pre-KG", "LKG", "UKG"] },
  { firstName: "Fatima", lastName: "Begum", email: "teacher20@simbaacademy.in", phone: "9876501020", classes: ["Pre-KG", "LKG"] },
  { firstName: "Gayathri", lastName: "Mohan", email: "teacher21@simbaacademy.in", phone: "9876501021", classes: ["Playgroup"] },
  { firstName: "Hema", lastName: "Saravanan", email: "teacher22@simbaacademy.in", phone: "9876501022", classes: ["Pre-KG", "LKG", "UKG"] },
  { firstName: "Indira", lastName: "Selvam", email: "teacher23@simbaacademy.in", phone: "9876501023", classes: ["Playgroup", "Pre-KG"] },
  { firstName: "Janani", lastName: "Ramesh", email: "teacher24@simbaacademy.in", phone: "9876501024", classes: ["LKG", "UKG"] },
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

async function nextEmployeeId() {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  for (let attempt = 0; attempt < 30; attempt++) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const employeeId = `${prefix}${suffix}`;
    const existing = await prisma.user.findUnique({ where: { employeeId } });
    if (!existing) return employeeId;
  }
  return `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  let created = 0;
  let skipped = 0;

  console.log(`Seeding ${TEACHERS.length} sample teachers…\n`);
  console.log(`Default password: ${DEFAULT_PASSWORD}\n`);

  for (const t of TEACHERS) {
    const email = t.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== "TEACHER") {
        console.log(`  ⚠️  Skip ${email} — exists as ${existing.role}`);
        skipped++;
        continue;
      }

      await prisma.$transaction([
        prisma.teacherAssignedClass.deleteMany({ where: { teacherId: existing.id } }),
        prisma.teacherAssignedClass.createMany({
          data: t.classes.map((className) => ({ teacherId: existing.id, className })),
        }),
        prisma.user.update({
          where: { id: existing.id },
          data: { studentClass: null, status: "ACTIVE", isDeleted: false },
        }),
      ]);

      console.log(`  ↻ Updated classes for ${email} → [${t.classes.join(", ")}]`);
      skipped++;
      continue;
    }

    const employeeId = await nextEmployeeId();
    const name = `${t.firstName} ${t.lastName}`;

    await prisma.user.create({
      data: {
        name,
        firstName: t.firstName,
        lastName: t.lastName,
        email,
        password: hashedPassword,
        phone: t.phone,
        role: "TEACHER",
        employeeId,
        status: "ACTIVE",
        mustChangePassword: false,
        studentClass: null,
        teacherAssignedClasses: {
          create: t.classes.map((className) => ({ className })),
        },
      },
    });

    const classLabel =
      t.classes.length === 1 ? `1 class` : `${t.classes.length} classes`;
    console.log(`  ✓ ${name} (${email}) — ${classLabel}: ${t.classes.join(", ")}`);
    created++;
  }

  const total = await prisma.user.count({ where: { role: "TEACHER", isDeleted: false } });
  const multiClass = await prisma.teacherAssignedClass.groupBy({
    by: ["teacherId"],
    _count: { className: true },
    having: { className: { _count: { gt: 1 } } },
  });

  console.log("\n── Summary ──────────────────────────────");
  console.log(`  Created:              ${created}`);
  console.log(`  Skipped / updated:    ${skipped}`);
  console.log(`  Total teachers in DB: ${total}`);
  console.log(`  Multi-class teachers: ${multiClass.length}`);
  console.log(`  Login password:       ${DEFAULT_PASSWORD}`);
  console.log("─────────────────────────────────────────\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
