import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api, ApiError } from "../lib/api";
import { PORTAL_AUTH, type PortalAuthPaths } from "../lib/authPortalPaths";
import { PasswordInput } from "./PasswordInput";
import {
  AuthField,
  AuthInlineLink,
  AuthLayout,
  AuthSubmitButton,
  authInputClass,
  type AuthPortal,
} from "./AuthUi";
import { Toast } from "./Toast";

export function ForgotPasswordView({ portal }: { portal: AuthPortal }) {
  const paths = PORTAL_AUTH[portal];
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim(), portal);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to process request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={message} variant="success" onDismiss={() => setMessage("")} />
      <AuthLayout portal={portal} title={paths.forgotTitle} subtitle="We'll email you a reset link (valid for 30 minutes)">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate autoComplete="off">
        <AuthField label={paths.emailLabel} portal={portal}>
          <input
            required
            type="email"
            autoComplete="off"
            placeholder={paths.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass(false, portal)}
          />
        </AuthField>
        <AuthSubmitButton portal={portal} loading={loading} loadingText="Sending…">
          Send reset link
        </AuthSubmitButton>

        <p className="text-center text-sm text-slate-500 font-medium pt-1">
          <AuthInlineLink to={paths.loginPath} portal={portal}>
            Back to sign in
          </AuthInlineLink>
        </p>
      </form>
    </AuthLayout>
    </>
  );
}

export function ResetPasswordView({ portal }: { portal: AuthPortal }) {
  const paths = PORTAL_AUTH[portal];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This reset link is invalid or expired.");
    }
  }, [token]);

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
      setTimeout(() => navigate(paths.loginPath), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={message} variant="success" onDismiss={() => setMessage("")} />
      <AuthLayout portal={portal} title={paths.resetTitle} subtitle={paths.resetSubtitle}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate autoComplete="off">
        <AuthField label="New password" portal={portal}>
          <PasswordInput
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
            autoComplete="off"
            className={authInputClass(false, portal) + " pr-12"}
          />
        </AuthField>
        <AuthField label="Confirm password" portal={portal}>
          <PasswordInput
            required
            minLength={8}
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="off"
            className={authInputClass(false, portal) + " pr-12"}
          />
        </AuthField>
        <AuthSubmitButton portal={portal} loading={loading || !token}>
          Reset password
        </AuthSubmitButton>

        <p className="text-center text-sm text-slate-500 font-medium pt-1">
          <AuthInlineLink to={paths.loginPath} portal={portal}>
            Back to sign in
          </AuthInlineLink>
        </p>
      </form>
    </AuthLayout>
    </>
  );
}

export function forgotPasswordMeta(paths: PortalAuthPaths) {
  return [{ title: paths.pageTitleForgot }];
}

export function resetPasswordMeta(paths: PortalAuthPaths) {
  return [{ title: paths.pageTitleReset }];
}
