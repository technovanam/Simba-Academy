export const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3001";
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

function env(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

export const TEST_CREDENTIALS = {
  admin: {
    email: env("TEST_ADMIN_EMAIL", env("DEFAULT_ADMIN_EMAIL", "admin@simbaacademy.in")),
    password: env("TEST_ADMIN_PASSWORD", env("DEFAULT_ADMIN_PASSWORD")),
  },
  teacher: {
    email: process.env.TEST_TEACHER_EMAIL ?? "priya.teacher@simbapreschool.in",
    password: process.env.TEST_TEACHER_PASSWORD ?? "Simba@Demo2026",
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL ?? "demo.student@simbapreschool.in",
    password: process.env.TEST_STUDENT_PASSWORD ?? "Simba@Demo2026",
  },
};

export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/courses",
  "/franchise",
  "/contact",
  "/gallery",
  "/login",
  "/register",
  "/forgot-password",
  "/teacher/login",
  "/admin/login",
] as const;

export const ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/users",
  "/admin/payments",
  "/admin/teachers",
  "/admin/courses",
  "/admin/materials",
  "/admin/tasks",
  "/admin/planner",
  "/admin/books",
  "/admin/inquiries",
  "/admin/reviews",
  "/admin/gallery",
] as const;

export const STUDENT_ROUTES = [
  "/student/dashboard",
  "/student/library",
  "/student/notifications",
  "/student/settings",
] as const;

export const TEACHER_ROUTES = [
  "/teacher/dashboard",
  "/teacher/tasks",
  "/teacher/library",
  "/teacher/planner",
  "/teacher/notifications",
  "/teacher/settings",
] as const;
