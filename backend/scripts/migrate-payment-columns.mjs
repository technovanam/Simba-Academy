import "dotenv/config";
import * as mariadb from "mariadb";

const alterSql = `
ALTER TABLE Payment
  CHANGE COLUMN razorpayOrderId paymentSessionId VARCHAR(191) NULL,
  CHANGE COLUMN razorpayPaymentId gatewayPaymentId VARCHAR(191) NULL,
  CHANGE COLUMN razorpaySignature paymentSignature VARCHAR(191) NULL;
`;

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
  const columns = await conn.query("SHOW COLUMNS FROM Payment");
  const names = columns.map((c) => c.Field);
  console.log("Current Payment columns:", names.join(", "));

  if (names.includes("paymentSessionId")) {
    console.log("Already migrated — nothing to do.");
    process.exit(0);
  }

  if (!names.includes("razorpayOrderId")) {
    console.error("Expected razorpayOrderId column; run `npm run db:push` instead.");
    process.exit(1);
  }

  await conn.query(alterSql);
  const after = await conn.query("SHOW COLUMNS FROM Payment");
  console.log("Migration OK. Columns:", after.map((c) => c.Field).join(", "));
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  conn.release();
  await pool.end();
}
