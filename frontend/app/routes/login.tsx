import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { PasswordInput } from "../components/PasswordInput";
import {
  AuthField,
  AuthInlineLink,
  AuthLayout,
  AuthSubmitButton,
  authInputClass,
} from "../components/AuthUi";
import { Toast } from "../components/Toast";
import { api, ApiError } from "../lib/api";
import { PORTAL_AUTH } from "../lib/authPortalPaths";
import { getDashboardPath, saveSession } from "../lib/auth";
import { AlertCircle } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Student Login | Simba Academy" }];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    let hasErrors = false;
    if (!email.trim()) {
      setEmailError("Please enter your email");
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      hasErrors = true;
    }
    if (!password) {
      setPasswordError("Please enter your password");
      hasErrors = true;
    }
    if (hasErrors) return;

    setLoading(true);
    try {
      const { user, token } = await api.login({ email, password });
      saveSession(token, user);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <AuthLayout
        portal="student"
        title="Welcome back"
        subtitle="Sign in to your student dashboard"
      >
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-5">
        <AuthField label="Email" error={emailError} portal="student">
          <div className="relative">
            <input
              type="email"
              autoComplete="off"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={authInputClass(!!emailError, "student")}
            />
            {emailError && (
              <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </AuthField>

        <AuthField
          label="Password"
          error={passwordError}
          portal="student"
          hint={
            <p className="mt-2 text-right">
              <AuthInlineLink to={PORTAL_AUTH.student.forgotPath} portal="student">
                Forgot password?
              </AuthInlineLink>
            </p>
          }
        >
          <div className="relative">
            <PasswordInput
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (passwordError) setPasswordError("");
              }}
              placeholder="Your password"
              autoComplete="off"
              className={authInputClass(!!passwordError, "student") + " pr-12"}
            />
          </div>
        </AuthField>

        <AuthSubmitButton portal="student" loading={loading} loadingText="Signing in…">
          Sign in
        </AuthSubmitButton>

        <p className="text-center text-sm text-slate-500 font-medium pt-1">
          New here?{" "}
          <AuthInlineLink to="/register" portal="student">
            Create an account
          </AuthInlineLink>
        </p>
      </form>
    </AuthLayout>
    </>
  );
}
