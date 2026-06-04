import type { AuthPortal } from "../components/AuthUi";

export interface PortalAuthPaths {
  portal: AuthPortal;
  loginPath: string;
  forgotPath: string;
  resetPath: string;
  emailLabel: string;
  emailPlaceholder: string;
  forgotTitle: string;
  resetTitle: string;
  resetSubtitle: string;
  pageTitleForgot: string;
  pageTitleReset: string;
}

export const PORTAL_AUTH: Record<AuthPortal, PortalAuthPaths> = {
  student: {
    portal: "student",
    loginPath: "/login",
    forgotPath: "/forgot-password",
    resetPath: "/reset-password",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    forgotTitle: "Forgot password",
    resetTitle: "Reset password",
    resetSubtitle: "Choose a new password for your student account",
    pageTitleForgot: "Forgot Password | Simba Academy",
    pageTitleReset: "Reset Password | Simba Academy",
  },
  teacher: {
    portal: "teacher",
    loginPath: "/teacher/login",
    forgotPath: "/teacher/forgot-password",
    resetPath: "/teacher/reset-password",
    emailLabel: "Teacher email",
    emailPlaceholder: "teacher@simbaacademy.in",
    forgotTitle: "Forgot password",
    resetTitle: "Reset password",
    resetSubtitle: "Choose a new password for your teacher account",
    pageTitleForgot: "Forgot Password | Simba Academy",
    pageTitleReset: "Reset Password | Simba Academy",
  },
  admin: {
    portal: "admin",
    loginPath: "/admin/login",
    forgotPath: "/admin/forgot-password",
    resetPath: "/admin/reset-password",
    emailLabel: "Admin email",
    emailPlaceholder: "director@simbaacademy.in",
    forgotTitle: "Forgot password",
    resetTitle: "Reset password",
    resetSubtitle: "Choose a new password for your admin account",
    pageTitleForgot: "Forgot Password | Simba Academy",
    pageTitleReset: "Reset Password | Simba Academy",
  },
};
