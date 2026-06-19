import { useState } from "react";
import { User, Mail, Lock, CheckCircle2, Loader2, LogOut, ShieldAlert, Key } from "lucide-react";
import { api, type AuthUser } from "../lib/api";
import { clearSession, saveSession } from "../lib/auth";
import { useNavigate } from "react-router";
import { useAdminOutlet } from "./admin/AdminOutletContext";
import { PasswordInput } from "./PasswordInput";

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full min-h-0 flex-1 overflow-hidden">
      {/* Profile Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col justify-between">
        <div>
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/40">
            <div className="p-2.5 bg-[#8AC926]/10 rounded-xl">
              <User className="w-5 h-5 text-[#8AC926]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Profile Settings</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Update account identifier & admin portal access
              </p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleProfileSave} className="space-y-4.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-slate-50/30 border border-slate-200/80 pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#8AC926] focus:bg-white transition-all duration-200 font-semibold shadow-2xs"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-50/30 border border-slate-200/80 pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#8AC926] focus:bg-white transition-all duration-200 font-semibold shadow-2xs"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="mt-2.5 p-3.5 bg-amber-50/40 rounded-xl border border-amber-100/60 flex items-start gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-800/95 leading-normal">
                    Changing this email updates your credentials and dynamically routes all notifications.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#8AC926] text-white font-sans font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-[#78B020] active:scale-98 transition-all duration-200 disabled:opacity-50 shadow-md shadow-[#8AC926]/10"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
                {profileSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col justify-between">
        <div>
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/40">
            <div className="p-2.5 bg-slate-100 rounded-xl">
              <Key className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Security Settings</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Change password preferences
              </p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordSave} className="space-y-4" noValidate autoComplete="off">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                  Current Password
                </label>
                <PasswordInput
                  required
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 pr-12 bg-slate-50/30 text-sm font-semibold outline-none focus:border-[#8AC926] focus:bg-white transition-all duration-200 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                  New Password
                </label>
                <PasswordInput
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 pr-12 bg-slate-50/30 text-sm font-semibold outline-none focus:border-[#8AC926] focus:bg-white transition-all duration-200 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                  Confirm New Password
                </label>
                <PasswordInput
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-200/80 px-4 py-2.5 pr-12 bg-slate-50/30 text-sm font-semibold outline-none focus:border-[#8AC926] focus:bg-white transition-all duration-200 shadow-2xs"
                />
                
                <p className="mt-2.5 text-right">
                  <button
                    type="button"
                    disabled={sendingReset}
                    onClick={handleForgotPasswordReset}
                    className="text-[10px] font-black text-slate-400 hover:text-[#8AC926] active:scale-95 transition-all duration-200 uppercase tracking-wider"
                  >
                    {sendingReset ? "Sending Link..." : "Forgot password?"}
                  </button>
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-sans font-extrabold text-xs uppercase tracking-wider hover:bg-slate-800 active:scale-98 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
                {passwordSuccess && (
                  <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 mt-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Password changed!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Session / Logout Card - Spans full width at the bottom */}
      <div className="lg:col-span-2 bg-rose-50/30 rounded-2xl shadow-xs border border-rose-100/60 overflow-hidden transition-all duration-300 hover:shadow-sm">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xs font-black text-rose-800 uppercase tracking-widest">Active Session</h2>
            <p className="text-xs text-rose-700/80 font-bold leading-none">
              Logout of the Admin panel securely.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white font-sans font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-rose-700 active:scale-98 transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
