import type { Route } from "./+types/teacher.forgot-password";
import { ForgotPasswordView, forgotPasswordMeta } from "../components/AuthForgotReset";
import { PORTAL_AUTH } from "../lib/authPortalPaths";

export function meta({}: Route.MetaArgs) {
  return forgotPasswordMeta(PORTAL_AUTH.teacher);
}

export default function TeacherForgotPasswordPage() {
  return <ForgotPasswordView portal="teacher" />;
}
