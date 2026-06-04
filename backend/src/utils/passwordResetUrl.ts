import { env } from "../config/env.js";

/** Frontend reset-password path for each account role */
export function getPasswordResetPath(role: string): string {
  switch (role) {
    case "TEACHER":
      return "/teacher/reset-password";
    case "ADMIN":
      return "/admin/reset-password";
    case "STUDENT":
    default:
      return "/reset-password";
  }
}

export function buildPasswordResetUrl(role: string, token: string): string {
  return `${env.FRONTEND_URL}${getPasswordResetPath(role)}?token=${encodeURIComponent(token)}`;
}
