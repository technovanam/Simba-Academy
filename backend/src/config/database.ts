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
  const database = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

  // Optional query flags, e.g. ?ssl=true&allowPublicKeyRetrieval=true
  const sslParam = url.searchParams.get("ssl") ?? url.searchParams.get("sslmode");
  const useSsl =
    sslParam === "true" || sslParam === "require" || sslParam === "1";
  const allowPublicKeyRetrieval =
    url.searchParams.get("allowPublicKeyRetrieval") !== "false";

  return { host, port, user, password, database, useSsl, allowPublicKeyRetrieval };
}

const dbConfig = parseDatabaseUrl(env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 10,
  connectTimeout: 30_000,
  // Required for MySQL 8 / MariaDB caching_sha2_password over TCP (common on cPanel)
  allowPublicKeyRetrieval: dbConfig.allowPublicKeyRetrieval,
  ssl: dbConfig.useSsl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
