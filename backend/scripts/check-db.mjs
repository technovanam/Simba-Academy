import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
const placeholders = ["YOUR_DB_PASSWORD", "simbapre_DBUSER"];

if (!url || placeholders.some((p) => url.includes(p))) {
  console.error(
    "❌ Set DATABASE_URL in backend/.env with your cPanel MySQL/MariaDB credentials.\n" +
      "   Example: mysql://simbapre_school:your_password@localhost:3306/simbapre_simbaacademy"
  );
  process.exit(1);
}

function parseDatabaseUrl(urlStr) {
  const url = new URL(urlStr);
  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : 3306;
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
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

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Connected to cPanel MySQL/MariaDB (simbapre_simbaacademy)");
  process.exit(0);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("❌ Database connection failed:", message);
  console.error(
    "\nCheck in cPanel:\n" +
      "  • User exists with prefix simbapre_ and is added to simbapre_simbaacademy\n" +
      "  • Password in DATABASE_URL is correct (URL-encode special chars)\n" +
      "  • Host is localhost on the server, or your server hostname for remote dev\n" +
      "  • Remote MySQL/MariaDB is enabled if connecting from your local PC"
  );
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
