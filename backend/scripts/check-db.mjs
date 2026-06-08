import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
const placeholders = ["YOUR_DB_PASSWORD", "YOUR_PASSWORD", "simbapre_DBUSER"];

if (!url || placeholders.some((p) => url.includes(p))) {
  console.error(
    "❌ Set DATABASE_URL in backend/.env\n" +
      "   Server: mysql://simbapre_school:password@localhost:3306/simbapre_simbaacademy?allowPublicKeyRetrieval=true\n" +
      "   Local:  mysql://simbapre_school:password@simbapreschool.in:3306/simbapre_simbaacademy?allowPublicKeyRetrieval=true"
  );
  process.exit(1);
}

function parseDatabaseUrl(urlStr) {
  const parsed = new URL(urlStr);
  const sslParam =
    parsed.searchParams.get("ssl") ??
    parsed.searchParams.get("sslmode") ??
    parsed.searchParams.get("ssl-mode");
  const sslAccept = parsed.searchParams.get("sslaccept");
  const useSsl =
    sslParam === "true" ||
    sslParam === "require" ||
    sslParam === "REQUIRED" ||
    sslParam === "1" ||
    sslAccept === "strict" ||
    sslAccept === "true";
  const sslVerify = parsed.searchParams.get("sslVerify") === "true";

  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname,
    ssl: useSsl ? { rejectUnauthorized: sslVerify } : false,
    allowPublicKeyRetrieval: parsed.searchParams.get("allowPublicKeyRetrieval") !== "false",
  };
}

const dbConfig = parseDatabaseUrl(url);

const adapter = new PrismaMariaDb({
  ...dbConfig,
  connectionLimit: 1,
  connectTimeout: 30_000,
});

const prisma = new PrismaClient({ adapter });

try {
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  const dbName = dbConfig.database;
  const host = `${dbConfig.host}:${dbConfig.port}`;
  console.log(`✅ Connected to MySQL (${dbName} @ ${host})`);
  console.log("   Query result:", rows);
  process.exit(0);
} catch (err) {
  const cause = err?.cause?.cause ?? err?.cause?.message ?? err?.message ?? String(err);
  console.error("❌ Database connection failed:", cause);
  console.error(
    "\nCheck:\n" +
      "  • DATABASE_URL password is correct (URL-encode @ ! # in password)\n" +
      "  • On server: host is localhost\n" +
      "  • From PC: cPanel → Remote MySQL → your IP added, host simbapreschool.in\n" +
      "  • User simbapre_school has ALL PRIVILEGES on simbapre_simbaacademy"
  );
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
