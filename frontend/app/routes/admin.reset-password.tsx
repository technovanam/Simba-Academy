import type { Route } from "./+types/admin.reset-password";
import { ResetPasswordView, resetPasswordMeta } from "../components/AuthForgotReset";
import { PORTAL_AUTH } from "../lib/authPortalPaths";

export function meta({}: Route.MetaArgs) {
  return resetPasswordMeta(PORTAL_AUTH.admin);
}

export default function AdminResetPasswordPage() {
  return <ResetPasswordView portal="admin" />;
}
