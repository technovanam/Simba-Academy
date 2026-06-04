import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/register";
import { PasswordInput } from "../components/PasswordInput";
import {
  AuthAlert,
  AuthField,
  AuthInlineLink,
  AuthPageShell,
  AuthSubmitButton,
  authInputClass,
} from "../components/AuthUi";
import { Toast } from "../components/Toast";
import { api, ApiError } from "../lib/api";
import { openZohoCheckout } from "../lib/zohoCheckout";
import { saveSession } from "../lib/auth";
import { STUDENT_PLATFORM_FEE_INR } from "../lib/constants";
import { AlertCircle, Check, CreditCard, Shield } from "lucide-react";
import { ModalCloseButton } from "../components/ModalCloseButton";
import { AntiAutofillTrap, blockAutofillInputProps } from "../components/AntiAutofillTrap";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Student Sign Up | Simba Academy" }];
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [mockOrderData, setMockOrderData] = useState<{ orderId: string; amount: number; currency: string; key: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setStatusMessage("");

    let hasErrors = false;

    if (!form.name.trim()) {
      setNameError("Please enter your full name");
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

    if (!form.password) {
      setPasswordError("Please enter a password");
      hasErrors = true;
    } else if (form.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);
    setStatusMessage("Checking email availability...");

    try {
      // 1. Verify email is available
      const checkRes = await api.checkEmail(form.email);
      if (!checkRes.available) {
        setEmailError("Email is already registered");
        throw new Error("This email is already registered. Please log in or choose a different one.");
      }

      // 2. Request pre-registration order
      setStatusMessage("Creating secure order...");
      const orderData = await api.createPreRegisterOrder();

      if (orderData.isPlaceholder) {
        setMockOrderData({
          orderId: orderData.paymentSessionId,
          amount: orderData.amount,
          currency: orderData.currency,
          key: orderData.apiKey,
        });
        setShowSimulatedModal(true);
        setStatusMessage("Awaiting simulated payment...");
        return;
      }

      setStatusMessage("Opening Zoho Payments…");
      try {
        const payment = await openZohoCheckout({
          session: orderData,
          description: "Student Platform Registration Fee",
          invoiceNumber: `REG-${Date.now()}`,
          referenceNumber: orderData.paymentSessionId,
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
          },
        });

        setLoading(true);
        setStatusMessage("Verifying payment and creating account...");
        const verifyResult = await api.registerWithPayment({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          paymentSessionId: payment.payments_session_id,
          paymentId: payment.payment_id,
          signature: payment.signature,
        });

        saveSession(verifyResult.token, verifyResult.user);
        navigate("/student/dashboard");
      } catch (payErr: unknown) {
        const code = (payErr as { code?: string })?.code;
        if (code === "widget_closed") {
          setError("Registration payment was cancelled.");
        } else {
          setError(
            payErr instanceof ApiError
              ? payErr.message
              : payErr instanceof Error
                ? payErr.message
                : "Payment failed."
          );
        }
      }

    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err.message || "Registration initialization failed.");
      setLoading(false);
      setStatusMessage("");
    }
  }

  const feeLabel = `₹${STUDENT_PLATFORM_FEE_INR}`;

  return (
    <>
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <AuthPageShell maxWidth="max-w-4xl" portal="student">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col min-h-0">
            <div className="grid lg:grid-cols-2 flex-1 min-h-0 overflow-hidden">
              {/* Left — account details (second on mobile, first on desktop) */}
              <div className="order-2 lg:order-1 p-5 sm:p-6 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 min-h-0 overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <img src="/favicon.png" alt="" className="w-11 h-11 object-contain" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c77a00] bg-[#FF9F1C]/10 border border-[#FF9F1C]/25 px-2 py-0.5 rounded-full">
                        Student sign up
                      </span>
                      <h1 className="text-lg font-extrabold text-slate-900 mt-1">Create your account</h1>
                    </div>
                  </div>
                  <p className="text-sm text-[#c77a00]/90 font-medium">
                    Enter your details to unlock the student platform.
                  </p>
                </div>

                {statusMessage && loading && (
                  <AuthAlert variant="info" message={statusMessage} portal="student" />
                )}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  autoComplete="off"
                  data-autofill="block"
                  className="relative space-y-3 flex-1"
                >
                  <AntiAutofillTrap />
                  <AuthField label="Full name" error={nameError} portal="student">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Your name"
                        {...blockAutofillInputProps}
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          if (nameError) setNameError("");
                        }}
                        className={authInputClass(!!nameError, "student")}
                      />
                      {nameError && (
                        <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </AuthField>

                  <AuthField label="Email" error={emailError} portal="student">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="email"
                        placeholder="you@example.com"
                        {...blockAutofillInputProps}
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          if (emailError) setEmailError("");
                        }}
                        className={authInputClass(!!emailError, "student")}
                      />
                      {emailError && (
                        <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </AuthField>

                  <AuthField label="Phone (optional)" portal="student">
                    <input
                      type="tel"
                      placeholder="+91 …"
                      {...blockAutofillInputProps}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={authInputClass(false, "student")}
                    />
                  </AuthField>

                  <AuthField label="Password" error={passwordError} portal="student">
                    <PasswordInput
                      value={form.password}
                      onChange={(password) => {
                        setForm({ ...form, password });
                        if (passwordError) setPasswordError("");
                      }}
                      autoComplete="one-time-code"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      placeholder="At least 6 characters"
                      className={authInputClass(!!passwordError, "student") + " pr-12"}
                    />
                  </AuthField>

                  <div className="lg:hidden pt-1 space-y-3">
                    <AuthSubmitButton
                      portal="student"
                      loading={loading}
                      loadingText={statusMessage || "Processing…"}
                    >
                      Pay {feeLabel} & sign up
                    </AuthSubmitButton>
                    <p className="text-center text-xs text-slate-500 font-medium">
                      Already registered?{" "}
                      <AuthInlineLink to="/login" portal="student">
                        Sign in
                      </AuthInlineLink>
                    </p>
                  </div>
                </form>
              </div>

              {/* Right — payment summary (first on mobile, second on desktop) */}
              <div className="order-1 lg:order-2 p-5 sm:p-6 lg:p-8 bg-gradient-to-br from-[#FF9F1C]/8 via-white to-slate-50 flex flex-col justify-between border-b lg:border-b-0 border-slate-100 min-h-0 overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 text-[#c77a00] mb-4">
                    <CreditCard className="w-5 h-5 text-[#FF9F1C]" />
                    <span className="text-xs font-bold uppercase tracking-widest">Payment</span>
                  </div>

                  <p className="text-sm font-semibold text-[#c77a00] mb-1">Platform access fee</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl lg:text-5xl font-extrabold text-[#c77a00] tracking-tight">
                      {feeLabel}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">one-time</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-5">
                    Secure checkout via Zoho Payments after you submit the form.
                  </p>

                  <ul className="space-y-2">
                    {[
                      "Unlimited storybook library",
                      "Student dashboard & progress",
                      "Course materials when enrolled",
                      "Activity log & learning tools",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 font-medium">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF9F1C]/15">
                          <Check className="w-3 h-3 text-[#c77a00]" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 space-y-3 shrink-0">
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4 space-y-2 text-sm">
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Registration fee</span>
                      <span className="text-slate-900 font-bold">{feeLabel}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>GST</span>
                      <span className="text-slate-500">Included</span>
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-baseline">
                      <span className="font-bold text-slate-800">Total to pay</span>
                      <span className="text-2xl font-extrabold text-[#c77a00]">{feeLabel}</span>
                    </div>
                  </div>

                  <div className="hidden lg:block space-y-3">
                    <AuthSubmitButton
                      portal="student"
                      loading={loading}
                      loadingText={statusMessage || "Processing…"}
                    >
                      Pay {feeLabel} & sign up
                    </AuthSubmitButton>
                    <p className="text-center text-xs text-slate-500 font-medium">
                      Already registered?{" "}
                      <AuthInlineLink to="/login" portal="student">
                        Sign in
                      </AuthInlineLink>
                    </p>
                  </div>

                  <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    Encrypted payment · Simba Preschool
                  </p>
                </div>
              </div>
            </div>
          </div>
      </AuthPageShell>

      {/* Simulated Sandbox Payment Modal */}
      {showSimulatedModal && mockOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#FF9F1C]" />
            <ModalCloseButton
              className="absolute top-3 right-3"
              onClick={() => {
                setShowSimulatedModal(false);
                setLoading(false);
                setStatusMessage("");
              }}
            />

            <div className="mx-auto w-12 h-12 bg-[#FF9F1C]/10 rounded-full flex items-center justify-center text-xl mb-4 mt-2">
              🦁
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">Simba Sandbox Checkout</h3>
            <p className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Zoho Payments Sandbox Simulation</p>
            
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3">
              Zoho credentials are not configured. You can simulate payment completion below for local testing.
            </p>

            <div className="bg-[#FF9F1C]/5 rounded-xl p-4 border border-[#FF9F1C]/10 mb-6 text-left space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Description:</span>
                <span className="text-slate-800 font-bold">Platform Access Fee</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Order ID:</span>
                <span className="text-slate-800 font-mono truncate max-w-[160px] font-bold">{mockOrderData.orderId}</span>
              </div>
              <div className="border-t border-dashed border-[#FF9F1C]/20 my-2 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700">Total Amount:</span>
                <span className="text-xl font-extrabold text-[#c77a00]">₹{(mockOrderData.amount / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  setShowSimulatedModal(false);
                  setLoading(true);
                  setStatusMessage("Verifying payment and creating account...");
                  try {
                    const verifyResult = await api.registerWithPayment({
                      name: form.name,
                      email: form.email,
                      password: form.password,
                      phone: form.phone || undefined,
                      paymentSessionId: mockOrderData.orderId,
                      paymentId: `pay_mock_${Date.now()}`,
                      signature: `sig_mock_${Date.now()}`,
                    });

                    saveSession(verifyResult.token, verifyResult.user);
                    navigate("/student/dashboard");
                  } catch (err) {
                    console.error("Simulation error:", err);
                    setError(err instanceof ApiError ? err.message : "Payment verification and registration failed.");
                    setLoading(false);
                    setStatusMessage("");
                  }
                }}
                className="w-full py-2.5 rounded-lg bg-[#FF9F1C] hover:bg-[#e88f0a] text-white font-sans font-extrabold transition-colors shadow-md text-sm cursor-pointer"
              >
                Simulate Successful Payment
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowSimulatedModal(false);
                  setLoading(false);
                  setStatusMessage("");
                  setError("Registration payment was cancelled.");
                }}
                className="w-full py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans font-bold transition-colors text-sm cursor-pointer"
              >
                Cancel / Simulate Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
