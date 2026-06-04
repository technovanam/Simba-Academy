import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/teacher.change-password";
import { api, ApiError } from "../lib/api";
import { PORTAL_AUTH } from "../lib/authPortalPaths";
import { getToken, getUser, saveSession, clearSession } from "../lib/auth";
import { PasswordInput } from "../components/PasswordInput";
import {
  AuthField,
  AuthInlineLink,
  AuthLayout,
  AuthSubmitButton,
  authInputClass,
} from "../components/AuthUi";
import { Toast } from "../components/Toast";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Change Password | Simba Academy" }];
}

export default function TeacherChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || user?.role !== "TEACHER") {
      navigate("/teacher/login");
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      await api.changePassword(token, { currentPassword, newPassword });
      const user = getUser();
      if (user) {
        saveSession(token, { ...user, mustChangePassword: false });
      }
      setMessage("Password updated. Redirecting to your dashboard…");
      setTimeout(() => navigate("/teacher/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={message} variant="success" onDismiss={() => setMessage("")} />
      <AuthLayout
        portal="teacher"
        title="Set a new password"
        subtitle="Required before you can access your teacher dashboard"
      >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate autoComplete="off">
        <AuthField label="Current / temporary password" portal="teacher">
          <PasswordInput
            required
            placeholder="From your welcome email"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="off"
            className={authInputClass(false, "teacher") + " pr-12"}
          />
        </AuthField>
        <AuthField label="New password" portal="teacher">
          <PasswordInput
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="off"
            className={authInputClass(false, "teacher") + " pr-12"}
          />
        </AuthField>
        <AuthField
          label="Confirm new password"
          portal="teacher"
          hint={
            <p className="mt-2 text-right">
              <AuthInlineLink to={PORTAL_AUTH.teacher.forgotPath} portal="teacher">
                Forgot password?
              </AuthInlineLink>
            </p>
          }
        >
          <PasswordInput
            required
            minLength={8}
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="off"
            className={authInputClass(false, "teacher") + " pr-12"}
          />
        </AuthField>
        <AuthSubmitButton portal="teacher" loading={loading} loadingText="Updating…">
          Update password
        </AuthSubmitButton>
      </form>

      <button
        type="button"
        onClick={() => {
          clearSession();
          navigate("/teacher/login");
        }}
        className="mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        Sign out
      </button>
    </AuthLayout>
    </>
  );
}
