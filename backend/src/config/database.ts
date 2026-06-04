import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDatabaseUrl(urlStr: string) {
  const url = new URL(urlStr);
  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : 3306;
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  return { host, port, user, password, database };
}

const dbConfig = parseDatabaseUrl(env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 10,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
