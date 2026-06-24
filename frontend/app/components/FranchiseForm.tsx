import { useState } from "react";
import { api, ApiError, formatApiError } from "../lib/api";
import { AlertCircle } from "lucide-react";
import { Toast } from "./Toast";

export function FranchiseForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Field errors
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setError("");
    setSuccessMessage("");
    setNameError("");
    setEmailError("");
    setPhoneError("");

    let hasErrors = false;

    if (!form.name.trim()) {
      setNameError("Please enter your name");
      hasErrors = true;
    }

    if (!form.email.trim()) {
      setEmailError("Please enter your email");
      hasErrors = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setEmailError("The email field must be a valid email address.");
        hasErrors = true;
      }
    }

    if (!form.phone.trim()) {
      setPhoneError("Please enter your phone number");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setStatus("loading");

    try {
      const result = await api.submitFranchise(form);
      setStatus("success");
      setSuccessMessage(result.message);
      setForm({ name: "", email: "", phone: "", location: "", message: "" });
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && err.errors) {
        if (err.errors.name) setNameError(err.errors.name[0]);
        if (err.errors.email) setEmailError(err.errors.email[0]);
        if (err.errors.phone) setPhoneError(err.errors.phone[0]);
        setError("Please check the fields for errors.");
      } else {
        setError(formatApiError(err, "Failed to submit franchise inquiry"));
      }
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="relative">
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={successMessage} variant="success" onDismiss={() => setSuccessMessage("")} />

      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${nameError ? "text-red-500" : "text-slate-700"}`}>Full Name *</label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (nameError) setNameError("");
                }}
                className={`w-full rounded-xl px-4 py-3.5 outline-none transition-all ${
                  nameError 
                    ? "bg-red-50 border-2 border-red-500 text-red-900 placeholder-red-300" 
                    : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#E8AF34] focus:ring-4 focus:ring-[#E8AF34]/10"
                }`}
              />
              {nameError && (
                <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            {nameError && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold text-left">{nameError}</p>
            )}
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${emailError ? "text-red-500" : "text-slate-700"}`}>Email Address *</label>
            <div className="relative">
              <input
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (emailError) setEmailError("");
                }}
                className={`w-full rounded-xl px-4 py-3.5 outline-none transition-all ${
                  emailError 
                    ? "bg-red-50 border-2 border-red-500 text-red-900 placeholder-red-300" 
                    : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#E8AF34] focus:ring-4 focus:ring-[#E8AF34]/10"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${phoneError ? "text-red-500" : "text-slate-700"}`}>Phone Number *</label>
            <div className="relative">
              <input
                type="tel"
                autoComplete="off"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (phoneError) setPhoneError("");
                }}
                className={`w-full rounded-xl px-4 py-3.5 outline-none transition-all ${
                  phoneError 
                    ? "bg-red-50 border-2 border-red-500 text-red-900 placeholder-red-300" 
                    : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#E8AF34] focus:ring-4 focus:ring-[#E8AF34]/10"
                }`}
              />
              {phoneError && (
                <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
            {phoneError && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold text-left">{phoneError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">Preferred Location</label>
            <input
              type="text"
              autoComplete="off"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 focus:bg-white focus:border-[#E8AF34] focus:ring-4 focus:ring-[#E8AF34]/10 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700">Message or Questions</label>
          <textarea
            rows={4}
            autoComplete="off"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 focus:bg-white focus:border-[#E8AF34] focus:ring-4 focus:ring-[#E8AF34]/10 outline-none resize-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-4 mt-4 rounded-xl bg-[#E8AF34] text-white font-extrabold text-base hover:bg-[#d69f2e] disabled:opacity-60 transition-all cursor-pointer shadow-md shadow-[#E8AF34]/20 hover:-translate-y-1"
        >
          {status === "loading" ? "Submitting..." : "Submit Franchise Inquiry"}
        </button>
      </form>
    </div>
  );
}
