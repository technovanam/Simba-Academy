import type { Route } from "./+types/reset-password";
import { ResetPasswordView, resetPasswordMeta } from "../components/AuthForgotReset";
import { PORTAL_AUTH } from "../lib/authPortalPaths";

export function meta({}: Route.MetaArgs) {
  return resetPasswordMeta(PORTAL_AUTH.student);
}

export default function StudentResetPasswordPage() {
  return <ResetPasswordView portal="student" />;
}
