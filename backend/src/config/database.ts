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

  // Optional query flags: ?ssl=true, TiDB ?sslaccept=strict, Aiven ?ssl-mode=REQUIRED
  const sslParam =
    url.searchParams.get("ssl") ??
    url.searchParams.get("sslmode") ??
    url.searchParams.get("ssl-mode");
  const sslAccept = url.searchParams.get("sslaccept");
  const useSsl =
    sslParam === "true" ||
    sslParam === "require" ||
    sslParam === "REQUIRED" ||
    sslParam === "1" ||
    sslAccept === "strict" ||
    sslAccept === "true";
  const allowPublicKeyRetrieval =
    url.searchParams.get("allowPublicKeyRetrieval") !== "false";

  // MariaDB driver validates TLS by default; Aiven/TiDB use CAs Node may not trust.
  const sslVerify = url.searchParams.get("sslVerify") === "true";

  return { host, port, user, password, database, useSsl, sslVerify, allowPublicKeyRetrieval };
}

function buildSslOption(useSsl: boolean, sslVerify: boolean) {
  if (!useSsl) return false as const;
  return { rejectUnauthorized: sslVerify };
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
  ssl: buildSslOption(dbConfig.useSsl, dbConfig.sslVerify),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
