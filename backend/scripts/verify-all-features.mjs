/**
 * Verifies all major features are wired to the database and API routes respond.
 * Run: npm run test:db (from repo root) or npm run test:db in backend via root script.
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3001";

function parseDatabaseUrl(urlStr) {
  const url = new URL(urlStr.replace(/^mysql:/, "http:"));
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "").split("?")[0],
  };
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({ ...dbConfig, connectionLimit: 2 });
const prisma = new PrismaClient({ adapter });

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function checkTable(model, label) {
  try {
    const count = await prisma[model].count();
    pass(`DB table: ${label}`, `${count} row(s)`);
    return true;
  } catch (err) {
    fail(`DB table: ${label}`, err.message);
    return false;
  }
}

async function checkApi(path, label, options = {}) {
  try {
    const res = await fetch(`${API_URL}${path}`, options);
    if (!res.ok) {
      fail(`API: ${label}`, `HTTP ${res.status}`);
      return false;
    }
    pass(`API: ${label}`, `HTTP ${res.status}`);
    return true;
  } catch (err) {
    fail(`API: ${label}`, err.message);
    return false;
  }
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  return res.json();
}

try {
  console.log("\n═══ Simba Academy — DB & API Feature Verification ═══\n");

  await prisma.$queryRaw`SELECT 1`;
  pass("Database connection");

  const tables = [
    ["user", "User"],
    ["task", "Task"],
    ["lessonPlan", "LessonPlan"],
    ["storyBook", "StoryBook"],
    ["studentNotification", "StudentNotification"],
    ["teacherNotification", "TeacherNotification"],
    ["payment", "Payment"],
    ["course", "Course"],
    ["material", "Material"],
    ["inquiry", "Inquiry"],
    ["gallery", "Gallery"],
    ["testimonial", "Testimonial"],
  ];

  for (const [model, label] of tables) {
    await checkTable(model, label);
  }

  console.log("\n── Public API routes ──\n");
  await checkApi("/api/health", "Health check");
  await checkApi("/api/courses", "Courses list");
  await checkApi("/api/public/gallery", "Public gallery");
  await checkApi("/api/public/testimonials", "Public testimonials");

  console.log("\n── Teacher portal API (DB) ──\n");
  const teacherEmail = process.env.TEST_TEACHER_EMAIL ?? "priya.teacher@simbapreschool.in";
  const teacherPassword = process.env.TEST_TEACHER_PASSWORD ?? "Simba@Demo2026";
  const teacherSession = await login(teacherEmail, teacherPassword);

  if (teacherSession?.token) {
    const auth = { headers: { Authorization: `Bearer ${teacherSession.token}` } };
    await checkApi("/api/teacher/tasks", "Teacher tasks", auth);
    await checkApi("/api/teacher/books", "Teacher story books", auth);
    await checkApi("/api/teacher/lesson-plans", "Teacher lesson plans", auth);
    await checkApi("/api/teacher/notifications", "Teacher notifications", auth);
    await checkApi("/api/teacher/notifications/unread-count", "Teacher unread count", auth);
  } else {
    fail("Teacher login", "Could not authenticate demo teacher");
  }

  console.log("\n── Admin portal API (DB) ──\n");
  const adminEmail = process.env.TEST_ADMIN_EMAIL ?? process.env.DEFAULT_ADMIN_EMAIL ?? "admin@simbaacademy.in";
  const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? process.env.DEFAULT_ADMIN_PASSWORD ?? "";
  const adminSession = adminPassword ? await login(adminEmail, adminPassword) : null;

  if (adminSession?.token) {
    const auth = { headers: { Authorization: `Bearer ${adminSession.token}` } };
    await checkApi("/api/admin/books", "Admin story books", auth);
    await checkApi("/api/admin/tasks", "Admin tasks", auth);
    await checkApi("/api/admin/lesson-plans", "Admin lesson plans", auth);
    await checkApi("/api/admin/users", "Admin users", auth);
    await checkApi("/api/admin/teachers", "Admin teachers", auth);
    await checkApi("/api/admin/payments", "Admin payments", auth);
  } else {
    console.log("⚠️  Skipping admin API checks — set TEST_ADMIN_PASSWORD or DEFAULT_ADMIN_PASSWORD");
  }

  console.log("\n── Student portal API (DB) ──\n");
  const studentEmail = process.env.TEST_STUDENT_EMAIL ?? "demo.student@simbapreschool.in";
  const studentPassword = process.env.TEST_STUDENT_PASSWORD ?? "Simba@Demo2026";
  const studentSession =
    studentEmail && studentPassword ? await login(studentEmail, studentPassword) : null;

  if (studentSession?.token) {
    const auth = { headers: { Authorization: `Bearer ${studentSession.token}` } };
    await checkApi("/api/student/notifications", "Student notifications", auth);
    await checkApi("/api/student/notifications/unread-count", "Student unread count", auth);
    await checkApi("/api/library/storybooks", "Student story library", auth);
  } else {
    console.log("⚠️  Skipping student API checks — set TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n═══ Summary: ${results.length - failed.length}/${results.length} passed ═══\n`);

  if (failed.length > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error("Verification failed:", err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
