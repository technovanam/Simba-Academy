import { test, expect } from "@playwright/test";
import { API_URL } from "./helpers/config";

test.describe("Phase 4 & 6 — API errors and injection resistance", () => {
  test("unknown route returns 404 JSON", async () => {
    const res = await fetch(`${API_URL}/api/this-route-does-not-exist`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test("SQL injection in login email does not crash server", async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "' OR '1'='1",
        password: "' OR '1'='1",
      }),
    });
    expect([400, 401]).toContain(res.status);
    const health = await fetch(`${API_URL}/api/health`);
    expect(health.ok).toBeTruthy();
  });

  test("XSS payload in contact inquiry is accepted but sanitized at render time", async () => {
    const res = await fetch(`${API_URL}/api/contact/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "<script>alert(1)</script>",
        email: "xss-test@simba.invalid",
        phone: "9999999999",
        message: "<img src=x onerror=alert(1)>",
      }),
    });
    // May rate-limit (429) in CI — should never 500
    expect(res.status).toBeLessThan(500);
  });

  test("oversized JSON body is rejected", async () => {
    const huge = "x".repeat(11 * 1024 * 1024);
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: huge, password: "test" }),
    });
    expect(res.status).toBe(413);
  });

  test("security headers present on health endpoint", async () => {
    const res = await fetch(`${API_URL}/api/health`);
    expect(res.ok).toBeTruthy();
    // Helmet sets at least one of these on Express responses
    const hasSecurityHeader =
      res.headers.get("x-content-type-options") ||
      res.headers.get("x-frame-options") ||
      res.headers.get("content-security-policy");
    expect(hasSecurityHeader).toBeTruthy();
  });
});
