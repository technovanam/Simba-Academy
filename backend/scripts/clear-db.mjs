/**
 * Database Reset Utility Script.
 * Purges all tables in the database (safely disabling FK checks) and re-seeds the default admin.
 * Run: npm run db:clear (from root) or node scripts/clear-db.mjs (from backend)
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set in environment");
  process.exit(1);
}

function parseDatabaseUrl(urlStr) {
  // Replace mysql: prefix temporarily if needed for URL parser compatibility
  const normalized = urlStr.replace(/^mysql:/, "http:");
  const parsed = new URL(normalized);
  const host = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
  return { host, port, user, password, database };
}

const dbConfig = parseDatabaseUrl(url);
const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`\n⚠️  WARNING: Resetting database: ${dbConfig.database} on ${dbConfig.host}`);
  console.log(
    "This will permanently delete all users, courses, payments, tasks, and notifications.\n"
  );

  await prisma.$transaction(async (tx) => {
    console.log("🔒 Disabling foreign key constraints...");
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

    const tables = [
      "PasswordResetToken",
      "StudentNotification",
      "TeacherNotification",
      "Payment",
      "Material",
      "Course",
      "Inquiry",
      "Testimonial",
      "Gallery",
      "FranchiseInquiry",
      "Task",
      "LessonPlan",
      "StoryBook",
      "User",
    ];

    for (const table of tables) {
      console.log(`🧹 Clearing table: ${table}...`);
      await tx.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
    }

    console.log("🔓 Re-enabling foreign key constraints...");
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
  });

  console.log("✅ All tables cleared successfully.");

  // Re-seed default admin
  const email = (process.env.DEFAULT_ADMIN_EMAIL ?? "admin@simbaacademy.in").toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!password) {
    console.warn("⚠️  DEFAULT_ADMIN_PASSWORD not set. Skipping default admin seed.");
    return;
  }

  console.log(`🌱 Seeding default admin account: ${email}...`);
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Simba Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("✅ Default admin seeded successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
