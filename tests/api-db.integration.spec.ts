import { test, expect } from "@playwright/test";
import { API_URL, TEST_CREDENTIALS } from "./helpers/config";
import { apiLogin } from "./helpers/auth";

test.describe("API health & database connectivity", () => {
  test("health endpoint responds", async () => {
    const res = await fetch(`${API_URL}/api/health`);
    expect(res.ok).toBeTruthy();
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  test("public courses endpoint (DB-backed)", async () => {
    const res = await fetch(`${API_URL}/api/courses`);
    expect(res.ok).toBeTruthy();
    const courses = await res.json();
    expect(Array.isArray(courses)).toBeTruthy();
  });

  test("public gallery endpoint (DB-backed)", async () => {
    const res = await fetch(`${API_URL}/api/public/gallery`);
    expect(res.ok).toBeTruthy();
    const gallery = await res.json();
    expect(Array.isArray(gallery)).toBeTruthy();
  });
});

test.describe("Authenticated API — teacher portal (DB)", () => {
  test("teacher can load tasks, books, lesson plans, notifications", async () => {
    const session = await apiLogin(
      TEST_CREDENTIALS.teacher.email,
      TEST_CREDENTIALS.teacher.password
    );
    test.skip(!session, "Teacher demo credentials not available");

    const headers = { Authorization: `Bearer ${session!.token}` };

    const [tasks, books, plans, notifications, unread] = await Promise.all([
      fetch(`${API_URL}/api/teacher/tasks`, { headers }),
      fetch(`${API_URL}/api/teacher/books`, { headers }),
      fetch(`${API_URL}/api/teacher/lesson-plans`, { headers }),
      fetch(`${API_URL}/api/teacher/notifications`, { headers }),
      fetch(`${API_URL}/api/teacher/notifications/unread-count`, { headers }),
    ]);

    expect(tasks.ok).toBeTruthy();
    expect(books.ok).toBeTruthy();
    expect(plans.ok).toBeTruthy();
    expect(notifications.ok).toBeTruthy();
    expect(unread.ok).toBeTruthy();

    expect(Array.isArray(await tasks.json())).toBeTruthy();
    expect(Array.isArray(await books.json())).toBeTruthy();
    expect(Array.isArray(await plans.json())).toBeTruthy();
    expect(Array.isArray(await notifications.json())).toBeTruthy();
    const unreadBody = (await unread.json()) as { count: number };
    expect(typeof unreadBody.count).toBe("number");
  });
});

test.describe("Authenticated API — admin portal (DB)", () => {
  test("admin can load core resources", async () => {
    const { email, password } = TEST_CREDENTIALS.admin;
    test.skip(!password, "Set TEST_ADMIN_PASSWORD for admin API tests");

    const session = await apiLogin(email, password);
    test.skip(!session, "Admin login failed — check TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD");

    const headers = { Authorization: `Bearer ${session!.token}` };

    const endpoints = [
      "/api/admin/books",
      "/api/admin/tasks",
      "/api/admin/lesson-plans",
      "/api/admin/users",
      "/api/admin/teachers",
    ];

    for (const path of endpoints) {
      const res = await fetch(`${API_URL}${path}`, { headers });
      expect(res.ok, `${path} should return 200`).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });
});

test.describe("Authenticated API — student portal (DB)", () => {
  test("student notifications endpoint (DB-backed)", async () => {
    const { email, password } = TEST_CREDENTIALS.student;
    test.skip(!email || !password, "Set TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD");

    const session = await apiLogin(email, password);
    test.skip(!session, "Student login failed");

    const headers = { Authorization: `Bearer ${session!.token}` };
    const res = await fetch(`${API_URL}/api/student/notifications`, { headers });
    expect(res.ok).toBeTruthy();
    expect(Array.isArray(await res.json())).toBeTruthy();
  });
});
