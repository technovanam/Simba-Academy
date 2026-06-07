import { test, expect, type Page } from "@playwright/test";
import {
  ADMIN_ROUTES,
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  TEST_CREDENTIALS,
} from "../helpers/config";
import { apiLogin, injectSession, type LoginResult } from "../helpers/auth";
import { expectNoHorizontalOverflow, expectPageHasContent } from "../helpers/responsive";

async function assertPortalPage(page: Page, path: string, loginPath: RegExp) {
  const response = await page.goto(path, { waitUntil: "load" });
  expect(response?.status()).toBeLessThan(500);
  await expect(page).not.toHaveURL(loginPath);
  await expectPageHasContent(page);
  await expectNoHorizontalOverflow(page);
}

test.describe.configure({ mode: "serial" });

test.describe("Teacher portal pages", () => {
  let session: LoginResult | null = null;

  test.beforeAll(async () => {
    session = await apiLogin(
      TEST_CREDENTIALS.teacher.email,
      TEST_CREDENTIALS.teacher.password
    );
    test.skip(!session, "Teacher demo login unavailable — run: cd backend && npm run db:seed:demo");
  });

  test.beforeEach(async ({ page }) => {
    if (!session) return;
    await injectSession(page, session);
  });

  for (const path of TEACHER_ROUTES) {
    test(`teacher portal responsive: ${path}`, async ({ page }) => {
      test.skip(!session, "No teacher session");
      await assertPortalPage(page, path, /\/teacher\/login/);
    });
  }
});

test.describe("Admin portal pages", () => {
  let session: LoginResult | null = null;

  test.beforeAll(async () => {
    const { email, password } = TEST_CREDENTIALS.admin;
    test.skip(!password, "Set DEFAULT_ADMIN_PASSWORD in backend/.env");
    session = await apiLogin(email, password);
    test.skip(!session, "Admin login failed");
  });

  test.beforeEach(async ({ page }) => {
    if (!session) return;
    await injectSession(page, session);
  });

  for (const path of ADMIN_ROUTES) {
    test(`admin portal responsive: ${path}`, async ({ page }) => {
      test.skip(!session, "No admin session");
      await assertPortalPage(page, path, /\/admin\/login/);
    });
  }
});

test.describe("Student portal pages", () => {
  let session: LoginResult | null = null;

  test.beforeAll(async () => {
    const { email, password } = TEST_CREDENTIALS.student;
    test.skip(!email || !password, "Set TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD in backend/.env");
    session = await apiLogin(email, password);
    test.skip(!session, "Student login failed");
  });

  test.beforeEach(async ({ page }) => {
    if (!session) return;
    await injectSession(page, session);
  });

  for (const path of STUDENT_ROUTES) {
    test(`student portal responsive: ${path}`, async ({ page }) => {
      test.skip(!session, "No student session");
      await assertPortalPage(page, path, /\/login/);
    });
  }
});
