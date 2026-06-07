import { test, expect } from "@playwright/test";
import { API_URL, TEST_CREDENTIALS } from "./helpers/config";
import { apiLogin } from "./helpers/auth";

const ADMIN_ONLY = [
  "/api/admin/users",
  "/api/admin/teachers",
  "/api/admin/tasks",
  "/api/admin/lesson-plans",
  "/api/admin/books",
];

const TEACHER_ALLOWED = [
  "/api/teacher/tasks",
  "/api/teacher/books",
  "/api/teacher/lesson-plans",
  "/api/teacher/notifications",
];

const STUDENT_ONLY = [
  "/api/student/notifications",
  "/api/library/storybooks",
];

test.describe("Phase 1 — Role-based API access", () => {
  test("unauthenticated requests get 401 on protected routes", async () => {
    for (const path of [...ADMIN_ONLY, ...TEACHER_ALLOWED, ...STUDENT_ONLY]) {
      const res = await fetch(`${API_URL}${path}`);
      expect(res.status, `${path} should require auth`).toBe(401);
    }
  });

  test("teacher cannot access admin APIs", async () => {
    const session = await apiLogin(
      TEST_CREDENTIALS.teacher.email,
      TEST_CREDENTIALS.teacher.password
    );
    test.skip(!session, "Demo teacher unavailable");

    const headers = { Authorization: `Bearer ${session!.token}` };
    for (const path of ADMIN_ONLY) {
      const res = await fetch(`${API_URL}${path}`, { headers });
      expect(res.status, `Teacher blocked from ${path}`).toBe(403);
    }
  });

  test("teacher can access teacher APIs", async () => {
    const session = await apiLogin(
      TEST_CREDENTIALS.teacher.email,
      TEST_CREDENTIALS.teacher.password
    );
    test.skip(!session, "Demo teacher unavailable");

    const headers = { Authorization: `Bearer ${session!.token}` };
    for (const path of TEACHER_ALLOWED) {
      const res = await fetch(`${API_URL}${path}`, { headers });
      expect(res.status, `Teacher allowed on ${path}`).toBe(200);
    }
  });

  test("admin can access admin APIs", async () => {
    const { email, password } = TEST_CREDENTIALS.admin;
    test.skip(!password, "Set DEFAULT_ADMIN_PASSWORD in backend/.env");
    const session = await apiLogin(email, password);
    test.skip(!session, "Admin login failed");

    const headers = { Authorization: `Bearer ${session!.token}` };
    for (const path of ADMIN_ONLY) {
      const res = await fetch(`${API_URL}${path}`, { headers });
      expect(res.status, `Admin allowed on ${path}`).toBe(200);
    }
  });

  test("admin cannot access student-only notification shape", async () => {
    const { email, password } = TEST_CREDENTIALS.admin;
    test.skip(!password, "Admin password not set");
    const session = await apiLogin(email, password);
    test.skip(!session, "Admin login failed");

    const res = await fetch(`${API_URL}/api/student/notifications`, {
      headers: { Authorization: `Bearer ${session!.token}` },
    });
    expect(res.status).toBe(403);
  });
});
