import { test, expect } from "@playwright/test";

const PAGES = ["/", "/login", "/contact", "/admin/login", "/teacher/login"];

test.describe("Phase 12 — Accessibility smoke", () => {
  for (const path of PAGES) {
    test(`page has lang and focusable primary action: ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      const lang = await page.locator("html").getAttribute("lang");
      expect(lang).toBeTruthy();

      const focusable = page.locator(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
      );
      await expect(focusable.first()).toBeVisible();

      // Login pages should expose labeled inputs
      if (path.includes("login")) {
        await expect(page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first()).toBeVisible();
      }
    });
  }
});
