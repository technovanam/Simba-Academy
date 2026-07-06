import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.login";
import { api, ApiError } from "../lib/api";
import { PORTAL_AUTH } from "../lib/authPortalPaths";
import { getUser, saveSession } from "../lib/auth";
import { PasswordInput } from "../components/PasswordInput";
import {
  AuthField,
  AuthInlineLink,
  AuthLayout,
  AuthSubmitButton,
  authInputClass,
} from "../components/AuthUi";
import { Toast } from "../components/Toast";
import { AlertCircle } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Login | Simba Preschool" }];
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = typeof window !== "undefined" ? getUser()?.role : null;

  useEffect(() => {
    if (userRole === "ADMIN") {
      navigate("/admin/dashboard");
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "true") {
      setError("Your session has expired due to inactivity. Please log in again.");
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    let hasErrors = false;
    if (!email.trim()) {
      setEmailError("Please enter your admin email");
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
      const { user, token } = await api.login({ email, password, portal: "admin" });
      if (user.role !== "ADMIN") {
        throw new ApiError("This portal is for administrators only", 403);
      }
      saveSession(token, user);
      navigate("/admin/dashboard");
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
        portal="admin"
        title="Admin sign in"
        subtitle="Manage academy operations and content"
      >
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-5">
        <AuthField label="Email" error={emailError} portal="admin">
          <div className="relative">
            <input
              type="email"
              autoComplete="off"
              placeholder="director@simbaacademy.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={authInputClass(!!emailError, "admin")}
            />
            {emailError && (
              <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </AuthField>

        <AuthField
          label="Password"
          error={passwordError}
          portal="admin"
          hint={
            <p className="mt-2 text-right">
              <AuthInlineLink to={PORTAL_AUTH.admin.forgotPath} portal="admin">
                Forgot password?
              </AuthInlineLink>
            </p>
          }
        >
          <PasswordInput
            placeholder="Your password"
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (passwordError) setPasswordError("");
            }}
            autoComplete="off"
            className={authInputClass(!!passwordError, "admin") + " pr-12"}
          />
        </AuthField>

        <AuthSubmitButton portal="admin" loading={loading} loadingText="Signing in…">
          Sign in
        </AuthSubmitButton>
      </form>
    </AuthLayout>
    </>
  );
}
