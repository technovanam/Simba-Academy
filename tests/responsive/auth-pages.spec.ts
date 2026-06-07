import { test, expect } from "@playwright/test";
import { expectNoHorizontalOverflow, expectPageHasContent } from "../helpers/responsive";

const AUTH_PAGES = [
  { path: "/login", heading: /login|student/i },
  { path: "/register", heading: /register|sign up|create/i },
  { path: "/teacher/login", heading: /teacher|login/i },
  { path: "/admin/login", heading: /admin|login/i },
  { path: "/forgot-password", heading: /forgot|reset|password/i },
];

for (const { path, heading } of AUTH_PAGES) {
  test(`auth page responsive: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "load" });
    await expectPageHasContent(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("form").first()).toBeVisible();
  });
}
