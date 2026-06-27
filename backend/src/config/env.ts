import "dotenv/config.js";
import { UPLOADS_DIR } from "./uploads.js";

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
  PORT: process.env.PORT || 3001,

  // ── Database ───────────────────────────────────────────────────
  DATABASE_URL: envString("DATABASE_URL"),

  // ── JWT ────────────────────────────────────────────────────────
  JWT_SECRET: envString("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",

  // ── Zoho Payments ───────────────────────────────────────────────
  ZOHO_PAYMENTS_ACCOUNT_ID: envString("ZOHO_PAYMENTS_ACCOUNT_ID", "placeholder"),
  ZOHO_PAYMENTS_API_KEY: envString("ZOHO_PAYMENTS_API_KEY", "placeholder"),
  ZOHO_PAYMENTS_SIGNING_KEY: envString("ZOHO_PAYMENTS_SIGNING_KEY", "placeholder"),
  ZOHO_PAYMENTS_CLIENT_ID: envString("ZOHO_PAYMENTS_CLIENT_ID", "placeholder"),
  ZOHO_PAYMENTS_CLIENT_SECRET: envString("ZOHO_PAYMENTS_CLIENT_SECRET", "placeholder"),
  ZOHO_PAYMENTS_REFRESH_TOKEN: envString("ZOHO_PAYMENTS_REFRESH_TOKEN", "placeholder"),
  ZOHO_ACCOUNTS_URL: (process.env.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.in").replace(
    /\/$/,
    ""
  ),
  ZOHO_PAYMENTS_API_URL: (
    process.env.ZOHO_PAYMENTS_API_URL ?? "https://payments.zoho.in/api/v1"
  ).replace(/\/$/, ""),
  ZOHO_PAYMENTS_DOMAIN: process.env.ZOHO_PAYMENTS_DOMAIN ?? "IN",
  ZOHO_PAYMENTS_TEST_MODE: process.env.ZOHO_PAYMENTS_TEST_MODE === "true",
  ZOHO_PAYMENTS_PLACEHOLDER:
    process.env.ZOHO_PAYMENTS_PLACEHOLDER === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.ZOHO_PAYMENTS_PLACEHOLDER !== "false"),
  /** When false, skip Zoho entirely — registration and enrollment work without payment. */
  PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED === "true",
  /** One-time student platform registration fee (INR) */
  STUDENT_REGISTRATION_FEE_INR: envInt("STUDENT_REGISTRATION_FEE_INR", 120),

  // ── Email (Resend API) ─────────────────────────────────────────
  RESEND_API_KEY: envString("RESEND_API_KEY", "re_xxxxxxxxx"),
  EMAIL_FROM: process.env.EMAIL_FROM ?? "contact@simbapreschool.in",
  EMAIL_TO: process.env.EMAIL_TO ?? "contact@simbapreschool.in",
  PLATFORM_NAME: process.env.PLATFORM_NAME ?? "Simba Academy",
  FRONTEND_URL: (process.env.FRONTEND_URL ?? "https://simbapreschool.in").replace(/\/$/, ""),
  PASSWORD_RESET_EXPIRES_MINUTES: envInt("PASSWORD_RESET_EXPIRES_MINUTES", 30),

  // ── Domains (CORS) ─────────────────────────────────────────────
  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ??
    "http://localhost:5173,http://localhost:3000,https://www.simbapreschool.in,https://simbapreschool.in"
  )
    .split(",")
    .map((s) => s.trim()),

  // ── Storage (backend/uploads — PPT, PDF, images, etc.) ───────────
  /** Always <backend>/uploads inside the Node app (served at /backend/uploads on cPanel). */
  STORAGE_PATH: UPLOADS_DIR,
  MAX_FILE_SIZE: envInt("MAX_FILE_SIZE", 50 * 1024 * 1024), // 50 MB
  /** Public API base for absolute file links in emails (no trailing slash). */
  PUBLIC_API_URL: (
    process.env.PUBLIC_API_URL ??
    `${(process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "")}/backend`
  ).replace(/\/$/, ""),

  // ── Rate Limiting ──────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: envInt("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX: envInt("RATE_LIMIT_MAX", 10000),

  // ── Admin Bootstrap (server-side only, not exposed in UI) ───────
  // No password default on purpose — if DEFAULT_ADMIN_PASSWORD is unset the
  // seed is skipped, so a known credential is never baked into the source.
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "admin@simbaacademy.in",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
  SYNC_DEFAULT_ADMIN_PASSWORD: process.env.SYNC_DEFAULT_ADMIN_PASSWORD === "true",

  // ── Web Disk / WebDAV (optional — only when API runs off-server) ─
  /** Prefer USE_WEBDAV=false when the API runs on cPanel and writes to STORAGE_PATH directly. */
  USE_WEBDAV: process.env.USE_WEBDAV === "true",
  WEBDAV_URL: process.env.WEBDAV_URL ?? "https://webdisk.simbapreschool.in",
  WEBDAV_USER: process.env.WEBDAV_USER ?? "simba@simbapreschool.in",
  WEBDAV_PASSWORD: process.env.WEBDAV_PASSWORD ?? "",
  /** Public URL prefix for files stored via WebDAV (optional). */
  WEBDAV_BASE_URL: process.env.WEBDAV_BASE_URL ?? "https://simbapreschool.in/uploads",
  /** Remote folder on WebDAV home, e.g. uploads → /home1/simapre/uploads */
  WEBDAV_REMOTE_PATH: process.env.WEBDAV_REMOTE_PATH ?? "uploads",

  // ── Google Reviews (Places API New) ─────────────────────────────
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY ?? "",
  /** Single location (legacy). Use GOOGLE_PLACE_IDS for all branches. */
  GOOGLE_PLACE_ID: process.env.GOOGLE_PLACE_ID ?? "",
  /** Comma-separated Place IDs for every Google Business location */
  GOOGLE_PLACE_IDS: process.env.GOOGLE_PLACE_IDS ?? "",
  /** Auto-find locations when GOOGLE_PLACE_IDS is empty, e.g. "Simba Preschool Salem" */
  GOOGLE_PLACES_SEARCH_QUERY: process.env.GOOGLE_PLACES_SEARCH_QUERY ?? "",
  GOOGLE_PLACES_NAME_FILTER: process.env.GOOGLE_PLACES_NAME_FILTER ?? "simba",
  GOOGLE_PLACES_SEARCH_MAX: envInt("GOOGLE_PLACES_SEARCH_MAX", 20),
  /** In-memory cache TTL (minutes) when live fetch is enabled. */
  GOOGLE_REVIEWS_CACHE_MINUTES: envInt("GOOGLE_REVIEWS_CACHE_MINUTES", 15),
  /** Min minutes between manual "Refresh now" syncs (protects Google API quota). */
  GOOGLE_REVIEWS_SYNC_COOLDOWN_MINUTES: envInt("GOOGLE_REVIEWS_SYNC_COOLDOWN_MINUTES", 15),
  /** After a Google quota error, pause GBP calls (minutes). Minimum 30 enforced on quota errors. */
  GOOGLE_GBP_RATE_LIMIT_COOLDOWN_MINUTES: envInt("GOOGLE_GBP_RATE_LIMIT_COOLDOWN_MINUTES", 30),
  /** false = serve saved snapshot (safe). true = call Google on every page load (hits quota fast). */
  GOOGLE_REVIEWS_LIVE_FETCH: process.env.GOOGLE_REVIEWS_LIVE_FETCH === "true",

  /** Google Business Profile OAuth — full review text from your account */
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
  GOOGLE_OAUTH_REDIRECT_URI:
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    "http://localhost:3001/api/admin/google-reviews/oauth-callback",
  GOOGLE_BUSINESS_REFRESH_TOKEN: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN ?? "",
  GOOGLE_BUSINESS_ACCOUNT_ID: process.env.GOOGLE_BUSINESS_ACCOUNT_ID ?? "",
  BRANCH_ID_1: process.env.BRANCH_ID_1 ?? "",
  BRANCH_ID_2: process.env.BRANCH_ID_2 ?? "",
  BRANCH_ID_3: process.env.BRANCH_ID_3 ?? "",
  BRANCH_ID_4: process.env.BRANCH_ID_4 ?? "",
  BRANCH_ID_5: process.env.BRANCH_ID_5 ?? "",
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID ?? "",
  GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "",
} as const;
