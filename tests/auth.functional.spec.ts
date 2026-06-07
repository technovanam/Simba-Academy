import { test, expect } from "@playwright/test";
import { API_URL, TEST_CREDENTIALS } from "./helpers/config";
import { apiLogin } from "./helpers/auth";

async function post(path: string, body: unknown) {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test.describe("Phase 1 — Authentication API", () => {
  test("login rejects invalid email format", async () => {
    const res = await post("/api/auth/login", { email: "not-email", password: "password1" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test("login rejects wrong password", async () => {
    const res = await post("/api/auth/login", {
      email: TEST_CREDENTIALS.teacher.email,
      password: "DefinitelyWrongPassword!99",
    });
    expect(res.status).toBe(401);
  });

  test("login rejects unknown email", async () => {
    const res = await post("/api/auth/login", {
      email: "nobody.exists@simba-test.invalid",
      password: "SomePassword1!",
    });
    expect(res.status).toBe(401);
  });

  test("teacher login rejects wrong portal", async () => {
    const res = await post("/api/auth/login", {
      email: TEST_CREDENTIALS.teacher.email,
      password: TEST_CREDENTIALS.teacher.password,
      portal: "student",
    });
    expect(res.status).toBe(401);
  });

  test("valid teacher login returns token and user", async () => {
    const session = await apiLogin(
      TEST_CREDENTIALS.teacher.email,
      TEST_CREDENTIALS.teacher.password,
      "teacher"
    );
    test.skip(!session, "Demo teacher unavailable — run: cd backend && npm run db:seed:demo");
    expect(session!.token.length).toBeGreaterThan(20);
    expect(session!.user.role).toBe("TEACHER");
  });

  test("profile requires authentication", async () => {
    const res = await fetch(`${API_URL}/api/auth/profile`);
    expect(res.status).toBe(401);
  });

  test("profile works with valid token", async () => {
    const session = await apiLogin(
      TEST_CREDENTIALS.teacher.email,
      TEST_CREDENTIALS.teacher.password,
      "teacher"
    );
    test.skip(!session, "Demo teacher unavailable");

    const res = await fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${session!.token}` },
    });
    expect(res.status).toBe(200);
    const profile = (await res.json()) as { email: string };
    expect(profile.email).toBe(TEST_CREDENTIALS.teacher.email);
  });

  test("register rejects invalid payload", async () => {
    const res = await post("/api/auth/register", {
      name: "A",
      email: "bad",
      password: "123",
    });
    expect([400, 403]).toContain(res.status);
  });

  test("forgot-password accepts valid email shape", async () => {
    const res = await post("/api/auth/forgot-password", {
      email: TEST_CREDENTIALS.teacher.email,
      portal: "teacher",
    });
    // 200 even if email not sent in dev — should not 500
    expect(res.status).toBeLessThan(500);
  });

  test("reset-password rejects invalid token", async () => {
    const res = await post("/api/auth/reset-password", {
      token: "invalid-token-00000000",
      password: "NewPassword1!",
    });
    expect([400, 404]).toContain(res.status);
  });
});
