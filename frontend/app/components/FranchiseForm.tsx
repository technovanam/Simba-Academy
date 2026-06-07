import { useState } from "react";
import { api, ApiError } from "../lib/api";
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
      setError(err instanceof ApiError ? err.message : "Failed to submit franchise inquiry");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="relative">
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={successMessage} variant="success" onDismiss={() => setSuccessMessage("")} />

      <form onSubmit={handleSubmit} noValidate autoComplete="off" className="glass-panel rounded-lg p-8 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${nameError ? "text-red-500" : ""}`}>Name *</label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (nameError) setNameError("");
                }}
                className={`w-full rounded-lg border px-4 py-3 pr-10 bg-white outline-none transition-all ${
                  nameError 
                    ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                    : "border-[#8AC926]/20 focus:border-[#8AC926]"
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
            <label className={`block text-sm font-bold mb-2 transition-colors ${emailError ? "text-red-500" : ""}`}>Email *</label>
            <div className="relative">
              <input
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${phoneError ? "text-red-500" : ""}`}>Phone *</label>
            <div className="relative">
              <input
                type="tel"
                autoComplete="off"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (phoneError) setPhoneError("");
                }}
                className={`w-full rounded-lg border px-4 py-3 pr-10 bg-white outline-none transition-all ${
                  phoneError 
                    ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                    : "border-[#8AC926]/20 focus:border-[#8AC926]"
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
            <label className="block text-sm font-bold mb-2">Preferred Location</label>
            <input
              type="text"
              autoComplete="off"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-lg border-2 border-[#8AC926]/20 px-4 py-3 bg-white focus:border-[#8AC926] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Message</label>
          <textarea
            rows={4}
            autoComplete="off"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border-2 border-[#8AC926]/20 px-4 py-3 bg-white focus:border-[#8AC926] outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-4 rounded-md bg-[#8AC926] border-b-4 border-[#6FA31D] text-white font-sans font-extrabold text-lg hover:bg-[#9BE230] disabled:opacity-60 transition-all cursor-pointer"
        >
          {status === "loading" ? "Submitting..." : "Submit Franchise Inquiry"}
        </button>
      </form>
    </div>
  );
}
