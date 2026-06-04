/**
 * Permanently delete all TEACHER users and their tasks.
 * Materials uploaded by teachers are kept; uploader is cleared.
 * Run: npm run db:purge-teachers
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

function parseDatabaseUrl(urlStr) {
  const parsed = new URL(urlStr);
  const host = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.startsWith("/")
    ? parsed.pathname.slice(1)
    : parsed.pathname;
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
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: { id: true, email: true, name: true, isDeleted: true },
  });

  if (teachers.length === 0) {
    console.log("No teachers found in the database.");
    return;
  }

  const ids = teachers.map((t) => t.id);
  console.log(`Found ${teachers.length} teacher(s):`);
  teachers.forEach((t) =>
    console.log(`  - ${t.email} (${t.name})${t.isDeleted ? " [soft-deleted]" : ""}`)
  );

  const result = await prisma.$transaction(async (tx) => {
    const tasks = await tx.task.deleteMany({ where: { teacherId: { in: ids } } });
    const materials = await tx.material.updateMany({
      where: { uploadedById: { in: ids } },
      data: { uploadedById: null },
    });
    const resets = await tx.passwordResetToken.deleteMany({ where: { userId: { in: ids } } });
    const users = await tx.user.deleteMany({ where: { role: "TEACHER" } });
    return { tasks, materials, resets, users };
  });

  console.log("\nDeleted:");
  console.log(`  Tasks: ${result.tasks.count}`);
  console.log(`  Materials unlinked: ${result.materials.count}`);
  console.log(`  Password reset tokens: ${result.resets.count}`);
  console.log(`  Teacher accounts: ${result.users.count}`);
  console.log("\nDone. All teachers removed from the database.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
