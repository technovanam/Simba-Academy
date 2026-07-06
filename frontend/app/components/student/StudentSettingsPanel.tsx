import { useState } from "react";
import { useNavigate } from "react-router";
import { api, ApiError, type AuthUser } from "../../lib/api";
import { getUser, saveSession, clearSession } from "../../lib/auth";
import { PORTAL_AUTH } from "../../lib/authPortalPaths";
import { PasswordInput } from "../PasswordInput";
import { AdminPageBody, AdminPageShell } from "../AdminPageShell";
import {
  PortalSettingsCard,
  PortalSettingsLayout,
  PortalSettingsLoading,
  PortalSettingsPageHeader,
  PortalSettingsSessionBar,
  portalSettingsGridClass,
  portalSettingsInputClass,
  portalSettingsLabelClass,
  portalSettingsPasswordClass,
} from "../PortalSettingsUi";
import { AccountStatusBadge } from "../AccountStatusBadge";
import {
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  Key,
  CheckCircle2,
} from "lucide-react";

interface StudentSettingsPanelProps {
  token: string;
  user: AuthUser | null;
  profile: AuthUser | null;
  profileLoading: boolean;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
  onProfileUpdated: (user: AuthUser) => void;
}

export function StudentSettingsPanel({
  token,
  user,
  profile,
  profileLoading,
  onNotify,
  onError,
  onProfileUpdated,
}: StudentSettingsPanelProps) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const display = profile ?? user;
  const email = display?.email ?? "";

  const memberSince = display?.createdAt
    ? new Date(display.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      onError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(false);
    try {
      await api.changePassword(token, { currentPassword, newPassword });
      const sessionUser = getUser();
      if (sessionUser) {
        const updated = { ...sessionUser, mustChangePassword: false };
        saveSession(token, updated);
        onProfileUpdated(updated);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      onNotify("Password updated successfully.");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleForgotPasswordReset() {
    if (!email) {
      onError("No email on file for password reset.");
      return;
    }
    setSendingReset(true);
    try {
      const res = await api.forgotPassword(email, "student");
      onNotify(res.message || "Password reset email sent successfully!");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to trigger password reset email.");
    } finally {
      setSendingReset(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate(PORTAL_AUTH.student.loginPath);
  }

  return (
    <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
      <AdminPageBody className="flex-1 min-h-0 overflow-y-auto !mt-0 !pt-0">
        {profileLoading ? (
          <PortalSettingsLoading spinnerClassName="text-[#FF9F1C]" />
        ) : (
          <PortalSettingsLayout>
            <PortalSettingsPageHeader
              title="Preschool Settings"
              description="Manage your profile, password, and secure session."
            />

            <div className={portalSettingsGridClass}>
              <PortalSettingsCard
                icon={<User className="w-5 h-5 text-[#FF9F1C]" />}
                iconWrapClassName="bg-[#FF9F1C]/10 border border-[#FF9F1C]/15"
                title="Profile Settings"
                subtitle="Your student portal account details"
                trailing={display?.status ? <AccountStatusBadge status={display.status} /> : null}
              >
                <div className="flex flex-col flex-1 min-h-0 h-full">
                  <div className="space-y-4 flex-1">
                    {[
                      { label: "Full Name", icon: User, value: display?.name ?? "" },
                      { label: "Email Address", icon: Mail, value: email },
                      { label: "Phone", icon: Phone, value: display?.phone?.trim() || "Not provided" },
                      { label: "Class", icon: GraduationCap, value: display?.studentClass ?? "Not set" },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className={portalSettingsLabelClass}>{field.label}</label>
                        <div className="relative">
                          <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            readOnly
                            value={field.value}
                            className={`${portalSettingsInputClass} cursor-default`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 pt-4 mt-auto shrink-0 border-t border-slate-100">
                    <Shield className="w-4 h-4 text-[#FF9F1C] mt-0.5 shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-500">
                      Role: <span className="text-slate-800 font-bold">Student</span>
                      {memberSince ? (
                        <>
                          {" "}
                          · Member since <span className="text-slate-800 font-bold">{memberSince}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </PortalSettingsCard>

              <PortalSettingsCard
                icon={<Key className="w-5 h-5 text-slate-600" />}
                iconWrapClassName="bg-slate-100"
                title="Security Settings"
                subtitle="Change password preferences"
              >
                <form onSubmit={handlePasswordSubmit} className="flex flex-col flex-1 min-h-0 h-full" noValidate autoComplete="off">
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className={portalSettingsLabelClass}>Current Password</label>
                      <PasswordInput
                        required
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="Enter current password"
                        className={`${portalSettingsPasswordClass} focus:border-[#FF9F1C] focus:bg-white`}
                      />
                    </div>
                    <div>
                      <label className={portalSettingsLabelClass}>New Password</label>
                      <PasswordInput
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="At least 8 characters"
                        className={`${portalSettingsPasswordClass} focus:border-[#FF9F1C] focus:bg-white`}
                      />
                    </div>
                    <div>
                      <label className={portalSettingsLabelClass}>Confirm New Password</label>
                      <PasswordInput
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Repeat new password"
                        className={`${portalSettingsPasswordClass} focus:border-[#FF9F1C] focus:bg-white`}
                      />
                      <p className="mt-2 text-right">
                        <button
                          type="button"
                          disabled={sendingReset}
                          onClick={handleForgotPasswordReset}
                          className="text-[10px] font-black text-slate-400 hover:text-[#FF9F1C] uppercase tracking-wider"
                        >
                          {sendingReset ? "Sending Link..." : "Forgot password?"}
                        </button>
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-auto shrink-0 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-sans font-extrabold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update Password"}
                    </button>
                    {passwordSuccess && (
                      <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 mt-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Password changed!
                      </span>
                    )}
                  </div>
                </form>
              </PortalSettingsCard>

              <PortalSettingsSessionBar
                description="Logout of the Student Portal securely."
                onLogout={handleLogout}
              />
            </div>
          </PortalSettingsLayout>
        )}
      </AdminPageBody>
    </AdminPageShell>
  );
}
