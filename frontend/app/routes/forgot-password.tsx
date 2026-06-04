import type { Route } from "./+types/forgot-password";
import { ForgotPasswordView, forgotPasswordMeta } from "../components/AuthForgotReset";
import { PORTAL_AUTH } from "../lib/authPortalPaths";

export function meta({}: Route.MetaArgs) {
  return forgotPasswordMeta(PORTAL_AUTH.student);
}

export default function StudentForgotPasswordPage() {
  return <ForgotPasswordView portal="student" />;
}
