import type { Route } from "./+types/admin.forgot-password";
import { ForgotPasswordView, forgotPasswordMeta } from "../components/AuthForgotReset";
import { PORTAL_AUTH } from "../lib/authPortalPaths";

export function meta({}: Route.MetaArgs) {
  return forgotPasswordMeta(PORTAL_AUTH.admin);
}

export default function AdminForgotPasswordPage() {
  return <ForgotPasswordView portal="admin" />;
}
