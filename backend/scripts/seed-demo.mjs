/**
 * Seed demo data for admin portal features (50 records each).
 * Includes: assign tasks (50 class-folder + 50 general), franchise enquiries, etc.
 * Skips: Story Library, Parent Reviews, Settings.
 *
 * Run: npm run db:seed-demo
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const TARGET = 50;
const CLASSES = ["Playgroup", "Pre-KG", "LKG", "UKG"];
const STUDENT_PASSWORD = "SimbaStudent@2026";
const TEACHER_PASSWORD = "SimbaTeacher@2026";

const DEMO_LESSON = "Demo Lesson:";
const DEMO_TASK = "Demo Task:";
const DEMO_MATERIAL = "Demo Material:";
const DEMO_GALLERY = "Demo Gallery:";
const DEMO_INQUIRY_EMAIL = "demo-inquiry";
const DEMO_FRANCHISE_EMAIL = "demo-franchise";
const DEMO_FOLDER_TASK = "Demo Folder Task:";
const DEMO_GENERAL_TASK = "Demo General Task:";

const FIRST_NAMES = [
  "Aarav", "Diya", "Vihaan", "Anika", "Rohan", "Ishita", "Arjun", "Meera", "Karthik", "Saanvi",
  "Aditya", "Priya", "Nikhil", "Lakshmi", "Vikram", "Harini", "Rahul", "Kavya", "Siddharth", "Nandini",
  "Dev", "Pooja", "Manoj", "Sneha", "Ganesh", "Revathi", "Suresh", "Anjali", "Murali", "Kiran",
  "Vijay", "Shalini", "Arun", "Divya", "Senthil", "Malini", "Prakash", "Uma", "Bala", "Geetha",
  "Ravi", "Kamala", "Sathish", "Latha", "Kumar", "Vani", "Selva", "Nirmala", "Ashok", "Deepa",
];

const LAST_NAMES = [
  "Krishnan", "Menon", "Sharma", "Reddy", "Iyer", "Nair", "Pillai", "Sundaram", "Rajan", "Devi",
  "Murugan", "Balaji", "Chandran", "Gopal", "Selvam", "Mohan", "Venkatesh", "Arun", "Kumar", "Begum",
  "Subramanian", "Ramesh", "Prasad", "Saravanan", "Velu", "Kannan", "Swamy", "Hegde", "Naidu", "Patel",
];

const INQUIRY_MESSAGES = [
  "I would like to know about admission for my 3-year-old.",
  "Please share fee structure and school timings.",
  "Can we schedule a campus visit this week?",
  "Do you offer transport facility from Hasthampatti?",
  "Interested in UKG admission for June intake.",
  "What is the student-teacher ratio in LKG?",
  "Looking for Playgroup program details.",
  "Please call back regarding Pre-KG enrollment.",
];

const FRANCHISE_LOCATIONS = [
  "Salem", "Coimbatore", "Chennai", "Bangalore", "Hosur", "Erode", "Madurai", "Trichy",
  "Namakkal", "Dharmapuri", "Krishnagiri", "Mettur", "Attur", "Omalur",
];

const FRANCHISE_MESSAGES = [
  "Interested in opening a Simba Preschool franchise in my city.",
  "Please share franchise investment details and ROI timeline.",
  "I have commercial space available for a preschool franchise.",
  "Looking for franchise support and training information.",
  "Would like to discuss territory availability for franchise.",
  "Requesting franchise brochure and onboarding process details.",
];

const REPEAT_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY", "DAILY"];

const DEMO_TASK_FOLDERS = [
  { name: "Demo Playgroup Tasks", studentClass: "Playgroup" },
  { name: "Demo Pre-KG Tasks", studentClass: "Pre-KG" },
  { name: "Demo LKG Tasks", studentClass: "LKG" },
  { name: "Demo UKG Tasks", studentClass: "UKG" },
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
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

function pick(arr, index) {
  return arr[index % arr.length];
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days) {
  return daysFromNow(-days);
}

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

async function ensureStudents(hashedStudentPassword) {
  let created = 0;
  for (let i = 1; i <= TARGET; i++) {
    const email = `student${String(i).padStart(2, "0")}@simbaacademy.in`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 3);
    const name = `${firstName} ${lastName}`;
    const studentClass = pick(CLASSES, i);

    await prisma.user.create({
      data: {
        name,
        firstName,
        lastName,
        email,
        password: hashedStudentPassword,
        phone: `987651${String(1000 + i).slice(-4)}`,
        role: "STUDENT",
        studentClass,
        status: "ACTIVE",
        mustChangePassword: false,
      },
    });
    created++;
  }
  const total = await prisma.user.count({ where: { role: "STUDENT", isDeleted: false } });
  console.log(`  Students: ${total} total (${created} created)`);
  return prisma.user.findMany({
    where: { role: "STUDENT", isDeleted: false },
    take: TARGET,
    orderBy: { createdAt: "asc" },
  });
}

async function ensureTeachers(hashedTeacherPassword) {
  let created = 0;
  for (let i = 1; i <= TARGET; i++) {
    const email = `teacher${String(i).padStart(2, "0")}@simbaacademy.in`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    const firstName = pick(FIRST_NAMES, i + 10);
    const lastName = pick(LAST_NAMES, i + 5);
    const name = `${firstName} ${lastName}`;
    const classCount = (i % 4) + 1;
    const classes = CLASSES.slice(0, classCount);
    const employeeId = await nextEmployeeId();

    await prisma.user.create({
      data: {
        name,
        firstName,
        lastName,
        email,
        password: hashedTeacherPassword,
        phone: `987650${String(1000 + i).slice(-4)}`,
        role: "TEACHER",
        employeeId,
        status: "ACTIVE",
        mustChangePassword: false,
        teacherAssignedClasses: {
          create: classes.map((className) => ({ className })),
        },
      },
    });
    created++;
  }
  const total = await prisma.user.count({ where: { role: "TEACHER", isDeleted: false } });
  console.log(`  Teachers: ${total} total (${created} created)`);
  return prisma.user.findMany({
    where: { role: "TEACHER", isDeleted: false },
    take: TARGET,
    orderBy: { createdAt: "asc" },
  });
}

async function ensureDemoCourse() {
  const slug = "demo-preschool-program";
  let course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: "Demo Preschool Program",
        slug,
        description: "Sample course for demo enrollments and learning materials.",
        level: "Preschool",
        price: 15000,
        isActive: true,
      },
    });
    console.log("  Course: created Demo Preschool Program");
  }
  return course;
}

async function seedLessonPlans(course, teachers) {
  const existing = await prisma.lessonPlan.count({
    where: { title: { startsWith: DEMO_LESSON } },
  });
  let created = 0;
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const targetClass = pick(CLASSES, i);
    await prisma.lessonPlan.create({
      data: {
        title: `${DEMO_LESSON} ${n} — ${targetClass} Week Plan`,
        targetClass,
        course: { connect: { id: course.id } },
        planDate: daysFromNow(i % 14),
        content: `Demo lesson plan ${n} for ${targetClass}. Activities include circle time, phonics, numeracy, and creative play.`,
        materialsNeeded: "Charts, crayons, story cards, counting beads",
        isPublished: i % 5 !== 0,
      },
    });
    created++;
  }
  const total = await prisma.lessonPlan.count({ where: { title: { startsWith: DEMO_LESSON } } });
  console.log(`  Lesson plans: ${total} demo (${created} created)`);
}

async function seedTasks(teachers) {
  const existing = await prisma.task.count({ where: { title: { startsWith: DEMO_TASK } } });
  let created = 0;
  const statuses = ["PENDING", "PENDING", "COMPLETED", "APPROVED", "REJECTED"];
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const teacher = pick(teachers, i);
    if (!teacher) break;
    const status = pick(statuses, i);
    const hasProof = status === "COMPLETED" || status === "APPROVED" || (status === "REJECTED" && i % 2 === 0);
    await prisma.task.create({
      data: {
        title: `${DEMO_TASK} ${n} — Classroom Activity`,
        description: `Demo assigned task ${n} for teacher ${teacher.name}. Upload photo proof when complete.`,
        dueDate: daysFromNow((i % 20) + 1),
        status,
        teacher: { connect: { id: teacher.id } },
        proofUrl: hasProof ? `https://picsum.photos/seed/demo-task-${i}/640/480` : null,
        proofDesc: hasProof ? `Demo proof submission for task ${n}` : null,
        proofSubmittedAt: hasProof ? daysAgo(i % 5) : null,
        rejectionReason: status === "REJECTED" ? "Please resubmit clearer classroom photos." : null,
      },
    });
    created++;
  }
  const total = await prisma.task.count({ where: { title: { startsWith: DEMO_TASK } } });
  console.log(`  Tasks: ${total} demo (${created} created)`);
}

async function seedMaterials(course, teachers) {
  const existing = await prisma.material.count({ where: { title: { startsWith: DEMO_MATERIAL } } });
  let created = 0;
  const types = ["PDF", "PPT", "WORKSHEET", "VIDEO"];
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const type = pick(types, i);
    const uploader = pick(teachers, i);
    await prisma.material.create({
      data: {
        title: `${DEMO_MATERIAL} ${n} — ${type} Resource`,
        description: `Demo learning material ${n} for preschool classes.`,
        type,
        fileUrl:
          type === "PDF"
            ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            : `https://picsum.photos/seed/demo-material-${i}/800/600`,
        fileSize: 120000 + i * 1000,
        isApproved: i % 2 === 0,
        course: { connect: { id: course.id } },
        ...(uploader ? { uploadedBy: { connect: { id: uploader.id } } } : {}),
        createdAt: daysAgo(i % 30),
      },
    });
    created++;
  }
  const total = await prisma.material.count({ where: { title: { startsWith: DEMO_MATERIAL } } });
  console.log(`  Materials: ${total} demo (${created} created)`);
}

async function seedPayments(course, students) {
  const existing = await prisma.payment.count({
    where: { gatewayPaymentId: { startsWith: "demo-pay-" } },
  });
  let created = 0;
  const statuses = ["SUCCESS", "SUCCESS", "SUCCESS", "PENDING", "FAILED"];
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const student = pick(students, i);
    if (!student) break;
    const status = pick(statuses, i);
    await prisma.payment.create({
      data: {
        amount: 5000 + (i % 10) * 1500,
        currency: "INR",
        status,
        paymentSessionId: `demo-session-${n}`,
        gatewayPaymentId: `demo-pay-${n}`,
        user: { connect: { id: student.id } },
        course: { connect: { id: course.id } },
        createdAt: daysAgo(i % 45),
      },
    });
    created++;
  }
  const total = await prisma.payment.count({ where: { gatewayPaymentId: { startsWith: "demo-pay-" } } });
  console.log(`  Payments: ${total} demo (${created} created)`);
}

async function seedInquiries() {
  const existing = await prisma.inquiry.count({
    where: { email: { contains: DEMO_INQUIRY_EMAIL } },
  });
  let created = 0;
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const firstName = pick(FIRST_NAMES, i + 2);
    const lastName = pick(LAST_NAMES, i + 7);
    await prisma.inquiry.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${DEMO_INQUIRY_EMAIL}-${n}@example.com`,
        phone: `987652${String(1000 + i).slice(-4)}`,
        message: pick(INQUIRY_MESSAGES, i),
        isRead: i % 3 === 0,
        createdAt: daysAgo(i % 20),
      },
    });
    created++;
  }
  const total = await prisma.inquiry.count({ where: { email: { contains: DEMO_INQUIRY_EMAIL } } });
  console.log(`  General enquiries: ${total} demo (${created} created)`);
}

async function seedFranchiseInquiries() {
  const existing = await prisma.franchiseInquiry.count({
    where: { email: { contains: DEMO_FRANCHISE_EMAIL } },
  });
  let created = 0;
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const firstName = pick(FIRST_NAMES, i + 4);
    const lastName = pick(LAST_NAMES, i + 11);
    await prisma.franchiseInquiry.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${DEMO_FRANCHISE_EMAIL}-${n}@example.com`,
        phone: `987653${String(1000 + i).slice(-4)}`,
        location: pick(FRANCHISE_LOCATIONS, i),
        message: pick(FRANCHISE_MESSAGES, i),
        isRead: i % 4 === 0,
        createdAt: daysAgo(i % 25),
      },
    });
    created++;
  }
  const total = await prisma.franchiseInquiry.count({
    where: { email: { contains: DEMO_FRANCHISE_EMAIL } },
  });
  console.log(`  Franchise enquiries: ${total} demo (${created} created)`);
}

async function ensureTaskFolders() {
  const folders = [];
  for (const spec of DEMO_TASK_FOLDERS) {
    let folder = await prisma.taskFolder.findUnique({ where: { name: spec.name } });
    if (!folder) {
      folder = await prisma.taskFolder.create({
        data: { name: spec.name, studentClass: spec.studentClass },
      });
    }
    folders.push(folder);
  }
  console.log(`  Task folders: ${folders.length} demo folders ready`);
  return folders;
}

async function seedRecurringFolderTasks(folders, teachers) {
  const existing = await prisma.recurringTask.count({
    where: { title: { startsWith: DEMO_FOLDER_TASK } },
  });
  let created = 0;
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const folder = pick(folders, i);
    if (!folder) break;
    await prisma.recurringTask.create({
      data: {
        title: `${DEMO_FOLDER_TASK} ${n} — ${folder.studentClass}`,
        description: `Demo recurring task ${n} in ${folder.name}. Teachers complete weekly classroom activity.`,
        studentClass: folder.studentClass,
        repeatDay: pick(REPEAT_DAYS, i),
        isActive: i % 6 !== 0,
        folderId: folder.id,
        createdAt: daysAgo(i % 30),
      },
    });
    created++;
  }
  const total = await prisma.recurringTask.count({ where: { title: { startsWith: DEMO_FOLDER_TASK } } });
  console.log(`  Folder recurring tasks: ${total} demo (${created} created)`);
}

async function seedRecurringGeneralTasks(teachers) {
  const existing = await prisma.recurringTask.count({
    where: { title: { startsWith: DEMO_GENERAL_TASK } },
  });
  let created = 0;
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    const studentClass = pick(CLASSES, i);
    await prisma.recurringTask.create({
      data: {
        title: `${DEMO_GENERAL_TASK} ${n} — School-wide Activity`,
        description: `Demo general recurring task ${n} for all staff. Not tied to a class folder.`,
        studentClass,
        repeatDay: pick(REPEAT_DAYS, i + 1),
        isActive: i % 5 !== 0,
        folderId: null,
        createdAt: daysAgo(i % 28),
      },
    });
    created++;
  }
  const total = await prisma.recurringTask.count({ where: { title: { startsWith: DEMO_GENERAL_TASK } } });
  console.log(`  General recurring tasks: ${total} demo (${created} created)`);
}

async function seedGallery() {
  const existing = await prisma.gallery.count({ where: { title: { startsWith: DEMO_GALLERY } } });
  let created = 0;
  for (let i = existing + 1; i <= TARGET; i++) {
    const n = String(i).padStart(2, "0");
    await prisma.gallery.create({
      data: {
        title: `${DEMO_GALLERY} ${n}`,
        imageUrl: `https://picsum.photos/seed/simba-gallery-${i}/800/600`,
        type: "IMAGE",
        isActive: i % 6 !== 0,
        createdAt: daysAgo(i % 25),
      },
    });
    created++;
  }
  const total = await prisma.gallery.count({ where: { title: { startsWith: DEMO_GALLERY } } });
  console.log(`  Gallery: ${total} demo (${created} created)`);
}

async function main() {
  console.log(`\n🌱 Seeding demo data (${TARGET} per feature)…\n`);
  console.log("Skipped: Story Library, Parent Reviews, Settings\n");

  const [hashedStudentPassword, hashedTeacherPassword] = await Promise.all([
    bcrypt.hash(STUDENT_PASSWORD, 12),
    bcrypt.hash(TEACHER_PASSWORD, 12),
  ]);

  const students = await ensureStudents(hashedStudentPassword);
  const teachers = await ensureTeachers(hashedTeacherPassword);
  const course = await ensureDemoCourse();

  await seedLessonPlans(course, teachers);
  await seedTasks(teachers);
  const taskFolders = await ensureTaskFolders();
  await seedRecurringFolderTasks(taskFolders, teachers);
  await seedRecurringGeneralTasks(teachers);
  await seedMaterials(course, teachers);
  await seedPayments(course, students);
  await seedInquiries();
  await seedFranchiseInquiries();
  await seedGallery();

  console.log("\n── Login credentials ─────────────────────");
  console.log(`  Students: student01…student${TARGET}@simbaacademy.in / ${STUDENT_PASSWORD}`);
  console.log(`  Teachers: teacher01…teacher${TARGET}@simbaacademy.in / ${TEACHER_PASSWORD}`);
  console.log("────────────────────────────────────────\n");
  console.log("✅ Demo seed complete.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
