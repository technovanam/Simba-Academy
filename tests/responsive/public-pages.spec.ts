import { test, expect } from "@playwright/test";
import { PUBLIC_ROUTES } from "../helpers/config";
import { expectNoHorizontalOverflow, expectPageHasContent } from "../helpers/responsive";

for (const path of PUBLIC_ROUTES) {
  test(`public page loads without overflow: ${path}`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "load" });
    expect(response?.status()).toBeLessThan(500);
    await expectPageHasContent(page);
    await expectNoHorizontalOverflow(page);
  });
}
