import { expect, type Page } from "@playwright/test";

/** Fail if the page has horizontal overflow (common responsive bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `Horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth}`
  ).toBeLessThanOrEqual(metrics.clientWidth + 2);
}

/** Page should render meaningful content (not blank / error shell). */
export async function expectPageHasContent(page: Page) {
  const bodyText = await page.locator("body").innerText();
  expect(bodyText.trim().length).toBeGreaterThan(20);
  await expect(page.locator("body")).toBeVisible();
}
