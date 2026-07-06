import { useState } from "react";
import { User, Mail, CheckCircle2, Loader2, ShieldAlert, Key } from "lucide-react";
import { api, type AuthUser } from "../lib/api";
import { clearSession, saveSession } from "../lib/auth";
import { useNavigate } from "react-router";
import { useAdminOutlet } from "./admin/AdminOutletContext";
import { PasswordInput } from "./PasswordInput";
import { AdminPageBody, AdminPageShell } from "./AdminPageShell";
import {
  PortalSettingsCard,
  PortalSettingsLayout,
  PortalSettingsPageHeader,
  PortalSettingsSessionBar,
  portalSettingsGridClass,
  portalSettingsInputClass,
  portalSettingsLabelClass,
  portalSettingsPasswordClass,
} from "./PortalSettingsUi";

export function AdminSettingsPanel({
  user,
  token,
}: {
  user: AuthUser;
  token: string;
}) {
  const navigate = useNavigate();
  const { setUser, setMessage, setError } = useAdminOutlet();
  
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [sendingReset, setSendingReset] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setError("");
    setMessage("");
    try {
      const updated = await api.updateUser(token, user.id, { name, email });
      saveSession(token, updated);
      setUser(updated);
      setProfileSuccess(true);
      setMessage("Profile settings updated successfully.");
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
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

    setSavingPassword(true);
    setPasswordSuccess(false);
    try {
      await api.changePassword(token, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setMessage("Password changed successfully.");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Verify your current password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleForgotPasswordReset() {
    setError("");
    setMessage("");
    setSendingReset(true);
    try {
      const res = await api.forgotPassword(email, "admin");
      setMessage(res.message || "Password reset email sent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to trigger password reset email.");
    } finally {
      setSendingReset(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/admin/login");
  }

  return (
    <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
      <AdminPageBody className="flex-1 min-h-0 overflow-y-auto !mt-0 !pt-0">
        <PortalSettingsLayout>
          <PortalSettingsPageHeader
            title="Preschool Settings"
            description="Manage your profile, password, and secure session."
          />

          <div className={portalSettingsGridClass}>
            <PortalSettingsCard
              icon={<User className="w-5 h-5 text-[#8AC926]" />}
              iconWrapClassName="bg-[#8AC926]/10"
              title="Profile Settings"
              subtitle="Update account identifier & admin portal access"
            >
              <form onSubmit={handleProfileSave} className="flex flex-col flex-1 min-h-0 h-full">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className={portalSettingsLabelClass}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${portalSettingsInputClass} focus:border-[#8AC926] focus:bg-white`}
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={portalSettingsLabelClass}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${portalSettingsInputClass} focus:border-[#8AC926] focus:bg-white`}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="mt-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-semibold text-amber-800 leading-snug">
                        Changing this email updates your credentials and dynamically routes all notifications.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 mt-auto shrink-0 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#8AC926] text-white font-sans font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-[#78B020] transition-all duration-200 disabled:opacity-50 shadow-md shadow-[#8AC926]/10"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                  {profileSuccess && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </span>
                  )}
                </div>
              </form>
            </PortalSettingsCard>

            <PortalSettingsCard
              icon={<Key className="w-5 h-5 text-slate-600" />}
              iconWrapClassName="bg-slate-100"
              title="Security Settings"
              subtitle="Change password preferences"
            >
              <form onSubmit={handlePasswordSave} className="flex flex-col flex-1 min-h-0 h-full" noValidate autoComplete="off">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className={portalSettingsLabelClass}>Current Password</label>
                    <PasswordInput
                      required
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      placeholder="Enter current password"
                      className={`${portalSettingsPasswordClass} focus:border-[#8AC926] focus:bg-white`}
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
                      className={`${portalSettingsPasswordClass} focus:border-[#8AC926] focus:bg-white`}
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
                      className={`${portalSettingsPasswordClass} focus:border-[#8AC926] focus:bg-white`}
                    />
                    <p className="mt-2 text-right">
                      <button
                        type="button"
                        disabled={sendingReset}
                        onClick={handleForgotPasswordReset}
                        className="text-[10px] font-black text-slate-400 hover:text-[#8AC926] uppercase tracking-wider"
                      >
                        {sendingReset ? "Sending Link..." : "Forgot password?"}
                      </button>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-auto shrink-0 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-sans font-extrabold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update Password"}
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
              description="Logout of the Admin panel securely."
              onLogout={handleLogout}
            />
          </div>
        </PortalSettingsLayout>
      </AdminPageBody>
    </AdminPageShell>
  );
}
