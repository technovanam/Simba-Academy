import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { AlertCircle } from "lucide-react";
import { PortalSelect } from "./PortalSelect";
import { Toast } from "./Toast";

interface ContactFormProps {
  defaultType?: "Preschool" | "Franchise";
}

export function ContactForm({ defaultType = "Preschool" }: ContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: defaultType,
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Field errors
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [messageError, setMessageError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setError("");
    setSuccessMessage("");
    setNameError("");
    setEmailError("");
    setMessageError("");

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

    if (!form.message.trim()) {
      setMessageError("Please enter your message");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setStatus("loading");

    try {
      const result = await api.submitInquiry(form);
      setStatus("success");
      setSuccessMessage(result.message);
      setForm({ name: "", email: "", phone: "", inquiryType: defaultType, message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Failed to submit inquiry");
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
            <label className="block text-sm font-bold mb-2">Phone</label>
            <input
              type="tel"
              autoComplete="off"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border-2 border-[#8AC926]/20 px-4 py-3 bg-white focus:border-[#8AC926] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Inquiry Type *</label>
            <PortalSelect
              value={form.inquiryType}
              onChange={(e) =>
                setForm({ ...form, inquiryType: e.target.value as "Preschool" | "Franchise" })
              }
              className="rounded-lg border-2 border-[#8AC926]/20 px-4 py-3 bg-white focus:border-[#8AC926] outline-none"
            >
              <option value="Preschool">Preschool</option>
              <option value="Franchise">Franchise</option>
            </PortalSelect>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${messageError ? "text-red-500" : ""}`}>Message *</label>
          <div className="relative">
            <textarea
              rows={5}
              autoComplete="off"
              value={form.message}
              onChange={(e) => {
                setForm({ ...form, message: e.target.value });
                if (messageError) setMessageError("");
              }}
              className={`w-full rounded-lg border px-4 py-3 pr-10 bg-white outline-none transition-all resize-none ${
                messageError 
                  ? "border-red-500 focus:border-red-500 shadow-xs shadow-red-100 text-red-900 placeholder-red-300" 
                  : "border-[#8AC926]/20 focus:border-[#8AC926]"
              }`}
            />
            {messageError && (
              <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-6 pointer-events-none" />
            )}
          </div>
          {messageError && (
            <p className="mt-1.5 text-xs text-red-500 font-semibold text-left">{messageError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-4 rounded-md bg-[#FF9F1C] border-b-4 border-[#E07A00] text-white font-sans font-extrabold text-lg hover:bg-[#FFAE33] disabled:opacity-60 transition-all cursor-pointer"
        >
          {status === "loading" ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}
