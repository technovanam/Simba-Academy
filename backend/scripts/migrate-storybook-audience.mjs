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

const pool = mariadb.createPool(parseDatabaseUrl(process.env.DATABASE_URL));
const conn = await pool.getConnection();

try {
  const cols = await conn.query("SHOW COLUMNS FROM StoryBook");
  const names = cols.map((c) => c.Field);
  if (names.includes("audience")) {
    console.log("StoryBook.audience already exists.");
  } else {
    await conn.query(
      "ALTER TABLE StoryBook ADD COLUMN audience ENUM('STUDENT','TEACHER','BOTH') NOT NULL DEFAULT 'BOTH'"
    );
    console.log("Added StoryBook.audience column (default BOTH).");
  }
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  conn.release();
  await pool.end();
}
