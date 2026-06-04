import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/admin.login";
import { api, ApiError } from "../lib/api";
import { getUser, saveSession } from "../lib/auth";
import { PasswordInput } from "../components/PasswordInput";
import { AlertCircle } from "lucide-react";
import { ModalCloseButton } from "../components/ModalCloseButton";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Login | Simba Academy" }];
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorClosing, setErrorClosing] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = typeof window !== "undefined" ? getUser()?.role : null;

  useEffect(() => {
    if (userRole === "ADMIN") {
      navigate("/admin/dashboard");
    }
  }, [userRole, navigate]);

  const triggerErrorClose = () => {
    setErrorClosing(true);
    setTimeout(() => {
      setError("");
      setErrorClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (error || emailError || passwordError) {
      // 1. Dismiss after 3 seconds
      const dismissTimer = setTimeout(() => {
        if (error) triggerErrorClose();
        setEmailError("");
        setPasswordError("");
      }, 3000);

      // 2. Dismiss after clicking anywhere on the screen
      const handleGlobalClick = () => {
        if (error) triggerErrorClose();
        setEmailError("");
        setPasswordError("");
      };
      
      // Delay registering the click handler slightly to avoid catching the submit button click
      const registerTimer = setTimeout(() => {
        window.addEventListener("click", handleGlobalClick);
      }, 100);

      return () => {
        clearTimeout(dismissTimer);
        clearTimeout(registerTimer);
        window.removeEventListener("click", handleGlobalClick);
      };
    }
  }, [error, emailError, passwordError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorClosing(false);
    setEmailError("");
    setPasswordError("");

    let hasErrors = false;

    // Custom UI validations to bypass default browser alerts
    if (!email.trim()) {
      setEmailError("Please enter your admin email");
      hasErrors = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("The email field must be a valid email address.");
        hasErrors = true;
      }
    }

    if (!password) {
      setPasswordError("Please enter your password");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);

    try {
      const { user, token } = await api.login({ email, password });
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-sm text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute right-[-10%] top-[-10%] w-96 h-96 rounded-lg bg-[#8AC926]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute left-[-10%] bottom-[-10%] w-96 h-96 rounded-lg bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-44 h-44 flex items-center justify-center hover:scale-105 transition-transform duration-300">
            <img src="/Simba Logo 2025.pdf.png" alt="Simba Academy Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {error && (
          <div className={`fixed top-6 right-6 z-50 max-w-sm w-full bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl shadow-xl overflow-hidden flex text-left ${errorClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="w-2 bg-red-500 flex-shrink-0" />
            <div className="p-4 flex gap-3.5 items-start w-full">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 leading-tight">Error</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
                <span className="text-[10px] text-slate-400 font-semibold mt-2 block">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <ModalCloseButton
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerErrorClose();
                }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${emailError ? "text-red-500" : "text-slate-600"}`}>
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="director@simbaacademy.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={`w-full rounded-lg bg-white border px-4 py-3 pr-10 outline-none transition-all text-sm ${
                  emailError 
                    ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                    : "border-slate-300 focus:border-[#8AC926] placeholder-slate-400 text-slate-800"
                }`}
              />
              {emailError && (
                <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            {emailError && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold text-left">{emailError}</p>
            )}
          </div>
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${passwordError ? "text-red-500" : "text-slate-600"}`}>
              Password
            </label>
            <div className="relative">
              <PasswordInput
                placeholder="••••••••••••"
                value={password}
                onChange={(val) => {
                  setPassword(val);
                  if (passwordError) setPasswordError("");
                }}
                className={`w-full rounded-lg bg-white border px-4 py-3 pr-12 outline-none transition-all text-sm ${
                  passwordError 
                    ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                    : "border-slate-300 focus:border-[#8AC926] placeholder-slate-400 text-slate-800"
                }`}
              />
              {passwordError && (
                <AlertCircle className="w-5 h-5 text-red-500 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            {passwordError && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold text-left">{passwordError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-[#8AC926] text-white font-bold text-sm tracking-wider uppercase disabled:opacity-60 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 cursor-pointer"
          >
            {loading ? "Signing in..." : "Access Administrator Console"}
          </button>
        </form>

        <p className="text-center text-xs mt-8 font-black uppercase tracking-wider text-slate-500">
          <Link to="/teacher/login" className="text-[#8AC926] hover:underline">Teacher Portal</Link>
          <span className="mx-2 text-slate-300">|</span>
          <Link to="/" className="text-slate-600 hover:underline">Exit to Site</Link>
        </p>
      </div>
    </div>
  );
}
