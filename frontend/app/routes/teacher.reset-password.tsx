import type { Route } from "./+types/teacher.reset-password";
import { ResetPasswordView, resetPasswordMeta } from "../components/AuthForgotReset";
import { PORTAL_AUTH } from "../lib/authPortalPaths";

export function meta({}: Route.MetaArgs) {
  return resetPasswordMeta(PORTAL_AUTH.teacher);
}

export default function TeacherResetPasswordPage() {
  return <ResetPasswordView portal="teacher" />;
}
