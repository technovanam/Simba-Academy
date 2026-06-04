import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { PageShell } from "../components/PageShell";
import { PasswordInput } from "../components/PasswordInput";
import { api, ApiError } from "../lib/api";
import { getDashboardPath, saveSession } from "../lib/auth";
import { AlertCircle } from "lucide-react";
import { ModalCloseButton } from "../components/ModalCloseButton";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login | Simba Academy" }];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorClosing, setErrorClosing] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerErrorClose = () => {
    setErrorClosing(true);
    setTimeout(() => {
      setError("");
      setErrorClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (error || emailError || passwordError) {
      const dismissTimer = setTimeout(() => {
        if (error) triggerErrorClose();
        setEmailError("");
        setPasswordError("");
      }, 3000);

      const handleGlobalClick = () => {
        if (error) triggerErrorClose();
        setEmailError("");
        setPasswordError("");
      };
      
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

    if (!email.trim()) {
      setEmailError("Please enter your email");
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
      saveSession(token, user);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell showFooter={false}>
      <section className="max-w-md mx-auto px-6 py-20">
        <div className="glass-panel rounded-lg p-8 shadow-xl">
          <h1 className="font-sans text-3xl font-extrabold text-center mb-2">Welcome Back</h1>
          <p className="text-center text-sm text-[#5D4037] font-semibold mb-8">Login for students and teachers</p>

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

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className={`block text-sm font-bold mb-2 transition-colors ${emailError ? "text-red-500" : ""}`}>Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className={`w-full rounded-lg border px-4 py-3 pr-10 bg-white outline-none transition-all ${
                    emailError 
                      ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                      : "border-[#8AC926]/20 focus:border-[#8AC926]"
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
              <label className={`block text-sm font-bold mb-2 transition-colors ${passwordError ? "text-red-500" : ""}`}>Password</label>
              <div className="relative">
                <PasswordInput
                  value={password}
                  onChange={(val) => {
                    setPassword(val);
                    if (passwordError) setPasswordError("");
                  }}
                  className={`w-full rounded-lg border px-4 py-3 pr-12 bg-white outline-none transition-all ${
                    passwordError 
                      ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                      : "border-[#8AC926]/20 focus:border-[#8AC926]"
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
              className="w-full py-3 rounded-md bg-[#FF9F1C] text-white font-sans font-extrabold disabled:opacity-60 cursor-pointer animate-none"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm mt-6 font-semibold text-[#5D4037]">
            New student? <Link to="/register" className="text-[#4E8C52] font-extrabold hover:underline">Sign up</Link>
          </p>
          <p className="text-center text-sm mt-2 font-semibold text-[#5D4037]">
            Teacher? <Link to="/teacher/login" className="text-[#8AC926] font-extrabold hover:underline">Teacher Portal</Link>
          </p>
          <p className="text-center text-sm mt-2 font-semibold text-[#5D4037]">
            Admin? <Link to="/admin/login" className="text-[#FF9F1C] font-extrabold hover:underline">Admin Portal</Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
