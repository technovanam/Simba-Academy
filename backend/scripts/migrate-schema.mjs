/**
 * Apply incremental SQL migrations when Prisma db push is not used on the server.
 * Safe to run multiple times — skips steps that are already applied.
 */
import "dotenv/config";
import * as mariadb from "mariadb";

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

async function columnNames(conn, table) {
  const cols = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
  return cols.map((c) => c.Field);
}

const pool = mariadb.createPool(parseDatabaseUrl(process.env.DATABASE_URL));
const conn = await pool.getConnection();

try {
  console.log(`Database: ${parseDatabaseUrl(process.env.DATABASE_URL).database}`);

  // ── Payment: Razorpay → Zoho column names ─────────────────────────
  const paymentCols = await columnNames(conn, "Payment");
  console.log("Payment columns:", paymentCols.join(", "));

  if (paymentCols.includes("paymentSessionId")) {
    console.log("✓ Payment columns already use Zoho field names.");
  } else if (paymentCols.includes("razorpayOrderId")) {
    await conn.query(`
      ALTER TABLE Payment
        CHANGE COLUMN razorpayOrderId paymentSessionId VARCHAR(191) NULL,
        CHANGE COLUMN razorpayPaymentId gatewayPaymentId VARCHAR(191) NULL,
        CHANGE COLUMN razorpaySignature paymentSignature VARCHAR(191) NULL
    `);
    console.log("✓ Renamed Payment columns to Zoho field names.");
  } else {
    console.error(
      "✗ Payment table has neither paymentSessionId nor razorpayOrderId. Run: npx prisma db push"
    );
    process.exit(1);
  }

  // ── User: student class for signup & story book filtering ───────────
  const userCols = await columnNames(conn, "User");
  if (userCols.includes("studentClass")) {
    console.log("✓ User.studentClass already exists.");
  } else {
    await conn.query(
      "ALTER TABLE `User` ADD COLUMN `studentClass` VARCHAR(191) NULL AFTER `phone`"
    );
    console.log("✓ Added User.studentClass column.");
  }

  // ── StoryBook: audience (student / teacher / both) ──────────────────
  try {
    const bookCols = await columnNames(conn, "StoryBook");
    if (bookCols.includes("audience")) {
      console.log("✓ StoryBook.audience already exists.");
    } else {
      await conn.query(
        "ALTER TABLE StoryBook ADD COLUMN audience ENUM('STUDENT','TEACHER','BOTH') NOT NULL DEFAULT 'BOTH'"
      );
      console.log("✓ Added StoryBook.audience column.");
    }
  } catch {
    console.log("· StoryBook table not found — skipped audience migration.");
  }

  // ── DriveAccessRule: title ──────────────────────────────────────────
  try {
    const ruleCols = await columnNames(conn, "DriveAccessRule");
    if (ruleCols.includes("title")) {
      console.log("✓ DriveAccessRule.title already exists.");
    } else {
      await conn.query(
        "ALTER TABLE DriveAccessRule ADD COLUMN title VARCHAR(191) NOT NULL DEFAULT 'Untitled Document'"
      );
      console.log("✓ Added DriveAccessRule.title column.");
    }
  } catch {
    console.log("· DriveAccessRule table not found — skipped title migration.");
  }

  // ── StudentNotification table ─────────────────────────────────────
  try {
    await conn.query("SELECT 1 FROM StudentNotification LIMIT 1");
    console.log("✓ StudentNotification table already exists.");
    const notifCols = await columnNames(conn, "StudentNotification");
    if (!notifCols.includes("fileId")) {
      await conn.query(
        "ALTER TABLE StudentNotification ADD COLUMN fileId VARCHAR(191) NULL"
      );
      console.log("✓ Added StudentNotification.fileId column.");
    }
  } catch {
    await conn.query(`
      CREATE TABLE StudentNotification (
        id VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NOT NULL,
        type VARCHAR(191) NOT NULL DEFAULT 'STORY_BOOK',
        title VARCHAR(191) NOT NULL,
        message TEXT NOT NULL,
        storyBookId VARCHAR(191) NULL,
        fileId VARCHAR(191) NULL,
        isRead TINYINT(1) NOT NULL DEFAULT 0,
        readingStatus VARCHAR(191) NOT NULL DEFAULT 'UNREAD',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX StudentNotification_userId_isRead_idx (userId, isRead),
        INDEX StudentNotification_userId_createdAt_idx (userId, createdAt),
        CONSTRAINT StudentNotification_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT StudentNotification_storyBookId_fkey FOREIGN KEY (storyBookId) REFERENCES StoryBook(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("✓ Created StudentNotification table.");
  }

  // ── TeacherNotification table ─────────────────────────────────────
  try {
    await conn.query("SELECT 1 FROM TeacherNotification LIMIT 1");
    console.log("✓ TeacherNotification table already exists.");
  } catch {
    await conn.query(`
      CREATE TABLE TeacherNotification (
        id VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NOT NULL,
        type VARCHAR(191) NOT NULL DEFAULT 'STORY_BOOK',
        title VARCHAR(191) NOT NULL,
        message TEXT NOT NULL,
        storyBookId VARCHAR(191) NULL,
        taskId VARCHAR(191) NULL,
        lessonPlanId VARCHAR(191) NULL,
        isRead TINYINT(1) NOT NULL DEFAULT 0,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX TeacherNotification_userId_isRead_idx (userId, isRead),
        INDEX TeacherNotification_userId_createdAt_idx (userId, createdAt),
        CONSTRAINT TeacherNotification_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT TeacherNotification_storyBookId_fkey FOREIGN KEY (storyBookId) REFERENCES StoryBook(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT TeacherNotification_taskId_fkey FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT TeacherNotification_lessonPlanId_fkey FOREIGN KEY (lessonPlanId) REFERENCES LessonPlan(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("✓ Created TeacherNotification table.");
  }

  // ── TeacherAssignedClass (multi-class teacher assignments) ─────────
  try {
    await conn.query("SELECT 1 FROM TeacherAssignedClass LIMIT 1");
    console.log("✓ TeacherAssignedClass table already exists.");
  } catch {
    await conn.query(`
      CREATE TABLE TeacherAssignedClass (
        id VARCHAR(191) NOT NULL,
        teacherId VARCHAR(191) NOT NULL,
        className VARCHAR(191) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE INDEX TeacherAssignedClass_teacherId_className_key (teacherId, className),
        INDEX TeacherAssignedClass_className_idx (className),
        INDEX TeacherAssignedClass_teacherId_idx (teacherId),
        CONSTRAINT TeacherAssignedClass_teacherId_fkey FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("✓ Created TeacherAssignedClass table.");
  }

  const legacyTeachers = await conn.query(
    `SELECT id, studentClass FROM User WHERE role = 'TEACHER' AND studentClass IS NOT NULL AND studentClass != '' AND isDeleted = 0`
  );
  let migratedCount = 0;
  for (const row of legacyTeachers) {
    const existing = await conn.query(
      `SELECT id FROM TeacherAssignedClass WHERE teacherId = ? AND className = ? LIMIT 1`,
      [row.id, row.studentClass]
    );
    if (existing.length === 0) {
      const id = `tac_${row.id}_${row.studentClass.replace(/[^a-zA-Z0-9]/g, "")}`;
      await conn.query(
        `INSERT INTO TeacherAssignedClass (id, teacherId, className, createdAt) VALUES (?, ?, ?, NOW(3))`,
        [id.slice(0, 191), row.id, row.studentClass]
      );
      migratedCount++;
    }
  }
  if (legacyTeachers.length > 0) {
    console.log(`✓ Migrated ${migratedCount} teacher class assignment(s) from User.studentClass.`);
  }

  console.log("\nSchema migration complete.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  conn.release();
  await pool.end();
}
