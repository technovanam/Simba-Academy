import type { AuthUser } from "./api";

const TOKEN_KEY = "simba_token";
const USER_KEY = "simba_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getDashboardPath(role: AuthUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/";
  }
}

const TEACHER_CLASS_FILTER_KEY = "teacherActiveClassFilter";

export function getTeacherAssignedClasses(user: AuthUser | null | undefined): string[] {
  if (!user) return [];
  if (user.assignedClasses && user.assignedClasses.length > 0) return user.assignedClasses;
  if (user.studentClass) return [user.studentClass];
  return [];
}

export function getTeacherClassFilter(): string {
  if (typeof window === "undefined") return "all";
  return sessionStorage.getItem(TEACHER_CLASS_FILTER_KEY) || "all";
}

export function setTeacherClassFilter(value: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TEACHER_CLASS_FILTER_KEY, value);
}

export function teacherClassQueryParam(filter: string): string | undefined {
  if (!filter || filter === "all") return undefined;
  return filter;
}
