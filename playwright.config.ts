import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

loadEnv({ path: resolve("backend/.env") });
if (!process.env.TEST_ADMIN_PASSWORD && process.env.DEFAULT_ADMIN_PASSWORD) {
  process.env.TEST_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
}
if (!process.env.TEST_ADMIN_EMAIL && process.env.DEFAULT_ADMIN_EMAIL) {
  process.env.TEST_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const apiURL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3001";

/** Production-recommended breakpoints + Tailwind-adjacent sizes */
const RESPONSIVE_VIEWPORTS = [
  { label: "mobile-320", width: 320, height: 568 },
  { label: "mobile-375", width: 375, height: 667 },
  { label: "mobile-425", width: 425, height: 844 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "laptop-1024", width: 1024, height: 768 },
  { label: "desktop-1280", width: 1280, height: 720 },
  { label: "desktop-1440", width: 1440, height: 900 },
  { label: "desktop-1920", width: 1920, height: 1080 },
  { label: "ultrawide-2560", width: 2560, height: 1440 },
] as const;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    browserName: "chromium",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "api-db",
      testMatch: /api-db\.integration\.spec\.ts/,
    },
    {
      name: "api-auth",
      testMatch: /auth\.functional\.spec\.ts/,
    },
    {
      name: "api-rbac",
      testMatch: /rbac\.api\.spec\.ts/,
    },
    {
      name: "api-security",
      testMatch: /api-security\.spec\.ts/,
    },
    {
      name: "a11y",
      testMatch: /a11y\.smoke\.spec\.ts/,
    },
    ...RESPONSIVE_VIEWPORTS.map((viewport) => ({
      name: `responsive-${viewport.label}`,
      testMatch: /responsive\/.*\.spec\.ts/,
      use: {
        viewport: { width: viewport.width, height: viewport.height },
      },
    })),
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "backend",
      url: `${apiURL}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      cwd: "frontend",
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
