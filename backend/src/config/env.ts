import "dotenv/config";

function envString(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function envInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (!raw) return fallback ?? 0;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) throw new Error(`Invalid integer for ${key}: ${raw}`);
  return parsed;
}

export const env = {
  // ── Server ─────────────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: envInt("PORT", 3001),

  // ── Database ───────────────────────────────────────────────────
  DATABASE_URL: envString("DATABASE_URL"),

  // ── JWT ────────────────────────────────────────────────────────
  JWT_SECRET: envString("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",

  // ── Razorpay ───────────────────────────────────────────────────
  RAZORPAY_KEY_ID: envString("RAZORPAY_KEY_ID", "rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET: envString("RAZORPAY_KEY_SECRET", "placeholder"),

  // ── Email (Nodemailer + Brevo) ─────────────────────────────────
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp-relay.brevo.com",
  SMTP_PORT: envInt("SMTP_PORT", 587),
  SMTP_USER: envString("SMTP_USER", "placeholder@email.com"),
  SMTP_PASS: envString("SMTP_PASS", "placeholder"),
  EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@simbapreschool.in",
  EMAIL_TO: process.env.EMAIL_TO ?? "info@simbapreschool.in",
  PLATFORM_NAME: process.env.PLATFORM_NAME ?? "Simba Academy",
  FRONTEND_URL: (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, ""),
  PASSWORD_RESET_EXPIRES_MINUTES: envInt("PASSWORD_RESET_EXPIRES_MINUTES", 30),

  // ── Domains (CORS) ─────────────────────────────────────────────
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:3000,https://www.simbapreschool.in,https://simbapreschool.in").split(",").map(s => s.trim()),

  // ── Storage (Web Disk) ─────────────────────────────────────────
  STORAGE_PATH: envString("STORAGE_PATH", "public_html/simba"),
  MAX_FILE_SIZE: envInt("MAX_FILE_SIZE", 50 * 1024 * 1024), // 50 MB

  // ── Rate Limiting ──────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: envInt("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX: envInt("RATE_LIMIT_MAX", 100),

  // ── Admin Bootstrap (server-side only, not exposed in UI) ───────
  // No password default on purpose — if DEFAULT_ADMIN_PASSWORD is unset the
  // seed is skipped, so a known credential is never baked into the source.
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "admin@simbaacademy.in",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
  SYNC_DEFAULT_ADMIN_PASSWORD: process.env.SYNC_DEFAULT_ADMIN_PASSWORD === "true",

  // ── Web Disk / WebDAV (cPanel Storage) ──────────────────────────
  USE_WEBDAV: process.env.USE_WEBDAV === "true",
  WEBDAV_URL: process.env.WEBDAV_URL ?? "https://simbapreschool.in:2078",
  WEBDAV_USER: process.env.WEBDAV_USER ?? "simba@simbapreschool.in",
  WEBDAV_PASSWORD: process.env.WEBDAV_PASSWORD ?? "",
  WEBDAV_BASE_URL: process.env.WEBDAV_BASE_URL ?? "https://simbapreschool.in/simba",
} as const;
