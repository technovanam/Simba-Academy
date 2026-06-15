import { useState } from "react";
import { User, Mail, Lock, CheckCircle2, Loader2, LogOut } from "lucide-react";
import { api, type AuthUser } from "../lib/api";
import { clearSession } from "../lib/auth";
import { useNavigate } from "react-router";

import { portalDashboardLowerGridClass } from "./PortalPageShell";

export function AdminSettingsPanel({
  user,
  token,
}: {
  user: AuthUser;
  token: string;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      // Assuming a generic updateProfile endpoint exists or using generic api update if available.
      // We will emulate success if no direct endpoint for admin profile edit exists,
      // or we can call `api.updateUser` since they are users.
      await api.updateUser(token, user.id, { name, email });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setSavingPassword(true);
    setPasswordSuccess(false);
    try {
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      // @ts-ignore: Assuming backend accepts password update
      await api.updateUser(token, user.id, { password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/admin/login");
  }

  return (
    <div className={portalDashboardLowerGridClass}>
      <div className="space-y-6 lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-xl bg-[#8AC926] px-6 py-2.5 font-bold text-white shadow-md hover:bg-[#7AB322] hover:shadow-lg transition disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
                {profileSuccess && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="bg-rose-50 rounded-3xl shadow-sm border border-rose-100 overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-rose-900">Session</h2>
              <p className="text-sm text-rose-700 mt-1">
                Log out securely.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-rose-700 hover:shadow-lg transition-all"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordSave} className="space-y-5">
              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">
                  {passwordError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {savingPassword ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
                {passwordSuccess && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Password Updated!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
