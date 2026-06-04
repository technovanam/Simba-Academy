import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import type { Route } from "./+types/teacher.reset-password";
import { api, ApiError } from "../lib/api";
import { PasswordInput } from "../components/PasswordInput";
import { AlertCircle, Check, Loader2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Reset Password | Simba Academy" }];
}

export default function TeacherResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Request a new reset email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({ token, password });
      setMessage(res.message);
      setTimeout(() => navigate("/teacher/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Reset password</h1>
        <p className="text-xs text-slate-600 font-medium mb-6">Choose a new password for your teacher account.</p>

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
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-xs outline-none focus:border-[#8AC926]"
          />
          <PasswordInput
            required
            minLength={8}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-xs outline-none focus:border-[#8AC926]"
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-center text-2xs font-bold text-slate-600">
          <Link to="/teacher/login" className="text-[#8AC926] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
