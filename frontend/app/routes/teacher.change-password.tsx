import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/teacher.change-password";
import { api, ApiError } from "../lib/api";
import { getToken, getUser, saveSession, clearSession } from "../lib/auth";
import { PasswordInput } from "../components/PasswordInput";
import { AlertCircle, Check, Loader2 } from "lucide-react";

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
      setMessage("Password updated successfully. Redirecting to your dashboard…");
      setTimeout(() => navigate("/teacher/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Set a new password</h1>
        <p className="text-xs text-slate-600 font-medium mb-6">
          For security, you must choose a new password before continuing.
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-2 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex gap-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordInput
            required
            placeholder="Current / temporary password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-xs outline-none focus:border-[#8AC926]"
          />
          <PasswordInput
            required
            minLength={8}
            placeholder="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-xs outline-none focus:border-[#8AC926]"
          />
          <PasswordInput
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-xs outline-none focus:border-[#8AC926]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            clearSession();
            navigate("/teacher/login");
          }}
          className="mt-4 w-full text-center text-2xs font-bold text-slate-500 hover:text-slate-800"
        >
          Sign out
        </button>
        <p className="mt-4 text-center text-2xs text-slate-500">
          <Link to="/teacher/forgot-password" className="text-[#8AC926] font-bold hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
