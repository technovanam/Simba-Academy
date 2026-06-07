import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/teacher.login";
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
  return [{ title: "Teacher Login | Simba Academy" }];
}

export default function TeacherLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = typeof window !== "undefined" ? getUser()?.role : null;

  useEffect(() => {
    if (userRole === "TEACHER") {
      navigate("/teacher/dashboard");
    }
  }, [userRole, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    let hasErrors = false;
    if (!email.trim()) {
      setEmailError("Please enter your teacher email");
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
      const { user, token } = await api.login({ email, password, portal: "teacher" });
      if (user.role !== "TEACHER") {
        throw new ApiError("This portal is for teachers only", 403);
      }
      saveSession(token, user);
      if (user.mustChangePassword) {
        navigate("/teacher/change-password");
      } else {
        navigate("/teacher/dashboard");
      }
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
        portal="teacher"
        title="Teacher sign in"
        subtitle="Access tasks, materials, and your workspace"
      >
      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-5">
        <AuthField label="Email" error={emailError} portal="teacher">
          <div className="relative">
            <input
              type="email"
              autoComplete="off"
              placeholder="teacher@simbaacademy.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={authInputClass(!!emailError, "teacher")}
            />
            {emailError && (
              <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </AuthField>

        <AuthField
          label="Password"
          error={passwordError}
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
            placeholder="Your password"
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (passwordError) setPasswordError("");
            }}
            autoComplete="off"
            className={authInputClass(!!passwordError, "teacher") + " pr-12"}
          />
        </AuthField>

        <AuthSubmitButton portal="teacher" loading={loading} loadingText="Signing in…">
          Sign in
        </AuthSubmitButton>
      </form>
    </AuthLayout>
    </>
  );
}
