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

  // ── Domains (CORS) ─────────────────────────────────────────────
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:3000,https://www.simbapreschool.in,https://simbapreschool.in").split(",").map(s => s.trim()),

  // ── Storage (Web Disk) ─────────────────────────────────────────
  STORAGE_PATH: envString("STORAGE_PATH", "public_html/simba"),
  MAX_FILE_SIZE: envInt("MAX_FILE_SIZE", 50 * 1024 * 1024), // 50 MB

  // ── Rate Limiting ──────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: envInt("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX: envInt("RATE_LIMIT_MAX", 100),
} as const;
