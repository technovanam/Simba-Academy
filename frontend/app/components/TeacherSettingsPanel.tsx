import { useState } from "react";
import { Link } from "react-router";
import { api, ApiError, type AuthUser } from "../lib/api";
import { getUser, saveSession } from "../lib/auth";
import { PORTAL_AUTH } from "../lib/authPortalPaths";
import { PasswordInput } from "./PasswordInput";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { Loader2, Mail, Phone, Shield, User } from "lucide-react";

interface TeacherSettingsPanelProps {
  token: string;
  user: AuthUser | null;
  profile: AuthUser | null;
  profileLoading: boolean;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
  onProfileUpdated: (user: AuthUser) => void;
}

export function TeacherSettingsPanel({
  token,
  user,
  profile,
  profileLoading,
  onNotify,
  onError,
  onProfileUpdated,
}: TeacherSettingsPanelProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const display = profile ?? user;

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
      onNotify("Password updated successfully.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  const memberSince = display?.createdAt
    ? new Date(display.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Account Settings"
        description="View your profile details and update your login password."
      />

      <AdminPageBody>
        {profileLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
            <p className="font-bold text-slate-600 text-sm">Loading profile…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#8AC926] to-[#78B020] p-0.5 shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[#8AC926] text-sm uppercase">
                    {display?.name ? display.name.substring(0, 2) : "TE"}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{display?.name ?? "Teacher"}</h3>
                  <p className="text-xs text-slate-500 font-medium">Academic Instructor</p>
                </div>
                {display?.status ? <AccountStatusBadge status={display.status} /> : null}
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#8AC926] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</dt>
                    <dd className="font-semibold text-slate-800 break-all">{display?.email ?? "—"}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#8AC926] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</dt>
                    <dd className="font-semibold text-slate-800">{display?.phone?.trim() || "Not provided"}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[#8AC926] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee ID</dt>
                    <dd className="font-semibold text-slate-800">{display?.employeeId?.trim() || "—"}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#8AC926] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</dt>
                    <dd className="font-semibold text-slate-800">Teacher</dd>
                  </div>
                </div>
                {memberSince ? (
                  <p className="text-[10px] text-slate-400 font-semibold pt-1">Member since {memberSince}</p>
                ) : null}
              </dl>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Change Password</h3>
              <p className="text-xs text-slate-500 font-medium mb-4">
                Use a strong password with at least 8 characters.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate autoComplete="off">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Current password
                  </label>
                  <PasswordInput
                    required
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 bg-white text-sm outline-none focus:border-[#8AC926]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    New password
                  </label>
                  <PasswordInput
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 bg-white text-sm outline-none focus:border-[#8AC926]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirm new password
                  </label>
                  <PasswordInput
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 bg-white text-sm outline-none focus:border-[#8AC926]"
                  />
                  <p className="mt-2 text-right">
                    <Link
                      to={PORTAL_AUTH.teacher.forgotPath}
                      className="text-[10px] font-bold text-[#8AC926] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 rounded-xl bg-[#8AC926] text-white font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>
            </section>
          </div>
        )}
      </AdminPageBody>
    </AdminPageShell>
  );
}
