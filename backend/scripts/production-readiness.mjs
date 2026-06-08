/**
 * Production readiness audit — static checks + optional live API checks.
 * Usage:
 *   node backend/scripts/production-readiness.mjs --static-only
 *   node backend/scripts/production-readiness.mjs   (includes API if server up)
 */
import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
config({ path: resolve(__dirname, "../.env") });

const staticOnly = process.argv.includes("--static-only");
const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3001";
const isProd = process.env.NODE_ENV === "production";

const results = [];

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function warn(name, detail = "") {
  results.push({ ok: true, warn: true, name, detail });
  console.log(`⚠️  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

function read(path) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function fileExists(path) {
  return existsSync(resolve(ROOT, path));
}

console.log("\n═══ Simba Academy — Production Readiness Audit ═══\n");

// ── Phase 16: CI/CD ───────────────────────────────────────────────
if (fileExists(".github/workflows/ci.yml")) {
  pass("CI/CD", "GitHub Actions workflow present");
} else {
  fail("CI/CD", "Missing .github/workflows/ci.yml");
}

// ── Phase 13: SEO basics ──────────────────────────────────────────
if (fileExists("frontend/public/robots.txt")) {
  pass("SEO", "robots.txt present");
} else {
  warn("SEO", "robots.txt missing");
}

if (fileExists("frontend/public/sitemap.xml")) {
  pass("SEO", "sitemap.xml present");
} else {
  warn("SEO", "sitemap.xml missing");
}

const homeRoute = fileExists("frontend/app/routes/home.tsx") ? read("frontend/app/routes/home.tsx") : "";
if (homeRoute.includes("meta(")) {
  pass("SEO", "Route-level meta() exports found");
} else {
  warn("SEO", "Add meta descriptions on marketing pages");
}

// ── Phase 6: Security static ─────────────────────────────────────
const appTs = read("backend/src/app.ts");
if (appTs.includes("helmet(")) pass("Security", "Helmet enabled");
else fail("Security", "Helmet not found");

if (appTs.includes("cors(")) pass("Security", "CORS configured");
else fail("Security", "CORS not configured");

if (appTs.includes("apiLimiter")) pass("Security", "API rate limiting mounted");
else fail("Security", "API rate limiter missing");

const rateLimiter = read("backend/src/middleware/rateLimiter.ts");
const authTs = read("backend/src/routes/auth.ts");
if (rateLimiter.includes("authLimiter")) pass("Security", "Auth rate limiter defined");
if (rateLimiter.includes("emailCheckLimiter")) pass("Security", "Check-email rate limiter defined");
if (authTs.includes("PORTAL_ROLE")) pass("Security", "Portal-scoped login enforced");
if (appTs.includes("entity.too.large")) pass("Security", "Oversized JSON returns 413");
if (authTs.includes("bcrypt.hash") && authTs.includes("12")) {
  pass("Security", "Passwords hashed with bcrypt cost 12");
}

if ((process.env.JWT_SECRET ?? "").length >= 32) {
  pass("Security", "JWT_SECRET length ≥ 32");
} else if (process.env.JWT_SECRET) {
  warn("Security", "JWT_SECRET should be at least 32 characters");
} else if (staticOnly) {
  warn("Security", "JWT_SECRET not loaded (expected in CI/deploy env)");
} else {
  fail("Security", "JWT_SECRET missing or too short");
}

if (isProd && (process.env.ALLOWED_ORIGINS ?? "").includes("localhost")) {
  warn("Security", "Production ALLOWED_ORIGINS includes localhost");
} else if (process.env.ALLOWED_ORIGINS) {
  pass("Security", "ALLOWED_ORIGINS configured");
}

// ── Phase 14: Monitoring gaps ─────────────────────────────────────
const frontendPkg = read("frontend/package.json");
const backendPkg = read("backend/package.json");
if (frontendPkg.includes("sentry") || backendPkg.includes("sentry")) {
  pass("Monitoring", "Sentry SDK installed (enable with SENTRY_DSN / VITE_SENTRY_DSN)");
} else {
  warn("Monitoring", "Sentry not installed — add before go-live");
}
if (frontendPkg.includes("posthog")) {
  pass("Monitoring", "PostHog SDK installed (enable with VITE_POSTHOG_KEY)");
} else {
  warn("Monitoring", "PostHog/analytics not in app dependencies");
}

// ── Phase 1: Auth gaps (documented) ───────────────────────────────
if (!authTs.includes("refresh")) {
  warn("Auth", "No refresh token rotation — JWT-only sessions");
}
if (authTs.includes("/logout")) {
  pass("Auth", "Logout endpoint present (client clears JWT)");
} else {
  warn("Auth", "No logout endpoint");
}
if (!authTs.includes("emailVerified")) {
  warn("Auth", "No email verification flow");
}

// ── Phase 8: Email ────────────────────────────────────────────────
const resendApiKey = process.env.RESEND_API_KEY ?? "";
if (resendApiKey && !resendApiKey.includes("re_xxxxxxxxx")) {
  pass("Email", "Resend API key configured");
} else if (isProd) {
  fail("Email", "Configure Resend API Key for production");
} else {
  warn("Email", "Resend API Key not configured");
}

// ── Phase 15: Backups (manual checklist) ──────────────────────────
warn("Backups", "Verify cPanel MySQL automated backups manually");
warn("Backups", "Verify uploads/ storage backup policy manually");

// ── Tests present ─────────────────────────────────────────────────
if (fileExists("playwright.config.ts")) pass("Testing", "Playwright configured");
if (fileExists("tests/api-db.integration.spec.ts")) pass("Testing", "API integration tests");
if (fileExists("tests/auth.functional.spec.ts")) pass("Testing", "Auth functional tests");
if (fileExists("tests/rbac.api.spec.ts")) pass("Testing", "RBAC API tests");

// ── Live API checks (optional) ────────────────────────────────────
if (!staticOnly) {
  console.log("\n── Live API security smoke ──\n");
  try {
    const health = await fetch(`${API_URL}/api/health`);
    if (health.ok) pass("API live", "Health endpoint OK");
    else fail("API live", `Health returned ${health.status}`);

    const noAuth = await fetch(`${API_URL}/api/admin/users`);
    if (noAuth.status === 401) pass("RBAC live", "Admin API returns 401 without token");
    else fail("RBAC live", `Expected 401, got ${noAuth.status}`);

    const badLogin = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "x" }),
    });
    if (badLogin.status === 400) pass("Validation live", "Invalid login payload returns 400");
    else warn("Validation live", `Invalid login returned ${badLogin.status}`);
  } catch (err) {
    warn("API live", `Server not reachable at ${API_URL} — start backend for live checks`);
  }
}

const failed = results.filter((r) => !r.ok);
const warnings = results.filter((r) => r.warn);

console.log(`\n═══ Summary: ${results.length - failed.length}/${results.length} passed, ${warnings.length} warnings ═══\n`);

if (failed.length > 0) {
  process.exit(1);
}
