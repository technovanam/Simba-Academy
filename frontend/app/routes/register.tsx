import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/register";
import { PageShell } from "../components/PageShell";
import { PasswordInput } from "../components/PasswordInput";
import { api, ApiError } from "../lib/api";
import { saveSession } from "../lib/auth";
import { AlertCircle } from "lucide-react";
import { ModalCloseButton } from "../components/ModalCloseButton";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Student Sign Up | Simba Academy" }];
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [errorClosing, setErrorClosing] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [mockOrderData, setMockOrderData] = useState<{ orderId: string; amount: number; currency: string; key: string } | null>(null);

  const triggerErrorClose = () => {
    setErrorClosing(true);
    setTimeout(() => {
      setError("");
      setErrorClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (error || nameError || emailError || passwordError) {
      const dismissTimer = setTimeout(() => {
        if (error) triggerErrorClose();
        setNameError("");
        setEmailError("");
        setPasswordError("");
      }, 5000); // 5 seconds default for error Toast

      const handleGlobalClick = () => {
        if (error) triggerErrorClose();
        setNameError("");
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
  }, [error, nameError, emailError, passwordError]);

  const loadScript = (src: string) => {
    return new Promise<boolean>((resolve) => {
      // Check if script is already present
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorClosing(false);
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

      // 3. Check for Sandbox mode (placeholder key)
      if (orderData.key === "rzp_test_placeholder") {
        setMockOrderData(orderData);
        setShowSimulatedModal(true);
        setStatusMessage("Awaiting simulated payment...");
        return;
      }

      // 4. Load Razorpay Checkout SDK
      setStatusMessage("Loading payment gateway...");
      const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!scriptLoaded) {
        throw new Error("Razorpay Checkout SDK failed to load. Please check your internet connection.");
      }

      // 5. Open Razorpay Popup
      setStatusMessage("Awaiting payment approval...");
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Simba Academy 🦁",
        description: "Student Platform Registration Fee",
        image: "/Simba Logo 2025.pdf.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);
            setStatusMessage("Verifying payment and creating account...");
            const verifyResult = await api.registerWithPayment({
              name: form.name,
              email: form.email,
              password: form.password,
              phone: form.phone || undefined,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            saveSession(verifyResult.token, verifyResult.user);
            navigate("/student/dashboard");
          } catch (err) {
            console.error("Verification and registration error:", err);
            setError(err instanceof ApiError ? err.message : "Payment verification and registration failed.");
            setLoading(false);
            setStatusMessage("");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone ?? "",
        },
        theme: {
          color: "#8AC926",
        },
        modal: {
          ondismiss: function() {
            setError("Registration payment was cancelled.");
            setLoading(false);
            setStatusMessage("");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
        setStatusMessage("");
      });
      rzp.open();

    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err.message || "Registration initialization failed.");
      setLoading(false);
      setStatusMessage("");
    }
  }

  return (
    <PageShell showFooter={false}>
      <section className="max-w-md mx-auto px-6 py-12">
        <div className="glass-panel rounded-lg p-8 shadow-xl">
          <h1 className="font-sans text-3xl font-extrabold text-center mb-2">Student Sign Up</h1>
          <p className="text-center text-sm text-[#5D4037] font-semibold mb-6">
            Get platform access to start your learning journey
          </p>

          {/* Pricing Highlight Card */}
          <div className="bg-[#8AC926]/10 border border-[#8AC926]/20 rounded-xl p-4 mb-6">
            <div className="text-center">
              <span className="text-xs font-bold text-[#4E8C52] uppercase tracking-wider block mb-1">Simba Platform Access</span>
              <div className="flex justify-center items-baseline gap-1 text-slate-800">
                <span className="text-3xl font-extrabold text-[#4E8C52]">₹120</span>
                <span className="text-sm font-semibold text-slate-500">/ one-time</span>
              </div>
            </div>
            <div className="mt-3.5 space-y-1.5 text-xs text-[#5D4037] font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[#8AC926] text-sm">✓</span> Unlimited access to Storybook Library
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8AC926] text-sm">✓</span> Interactive Student Activity Log
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8AC926] text-sm">✓</span> Student Dashboard & Progress Tracking
              </div>
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

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className={`block text-sm font-bold mb-2 transition-colors ${nameError ? "text-red-500" : ""}`}>Full Name</label>
              <div className="relative">
                <input
                  type="text"
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
              <label className={`block text-sm font-bold mb-2 transition-colors ${emailError ? "text-red-500" : ""}`}>Email</label>
              <div className="relative">
                <input
                  type="email"
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
            <div>
              <label className="block text-sm font-bold mb-2">Phone (Optional)</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border-2 border-[#8AC926]/20 px-4 py-3 bg-white outline-none focus:border-[#8AC926]"
              />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 transition-colors ${passwordError ? "text-red-500" : ""}`}>Password</label>
              <div className="relative">
                <PasswordInput
                  value={form.password}
                  onChange={(password) => {
                    setForm({ ...form, password });
                    if (passwordError) setPasswordError("");
                  }}
                  autoComplete="new-password"
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
              className="w-full py-3 rounded-md bg-[#8AC926] hover:bg-[#78B020] text-white font-sans font-extrabold disabled:opacity-60 cursor-pointer transition-colors shadow-md flex items-center justify-center min-h-[48px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{statusMessage || "Processing..."}</span>
                </div>
              ) : (
                "Pay ₹120 & Sign Up"
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6 font-semibold text-[#5D4037]">
            Already have an account? <Link to="/login" className="text-[#4E8C52] font-extrabold hover:underline">Login</Link>
          </p>
        </div>
      </section>

      {/* Simulated Sandbox Payment Modal */}
      {showSimulatedModal && mockOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 max-w-sm w-full text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <ModalCloseButton
              className="absolute top-3 right-3"
              onClick={() => {
                setShowSimulatedModal(false);
                setLoading(false);
                setStatusMessage("");
              }}
            />
            {/* Header Design */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#8AC926]" />
            
            <div className="mx-auto w-12 h-12 bg-[#8AC926]/10 rounded-full flex items-center justify-center text-xl mb-4">
              🦁
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">Simba Sandbox Checkout</h3>
            <p className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Razorpay Developer Simulation</p>
            
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3">
              We detected <code className="bg-slate-200 px-1 py-0.5 rounded text-amber-600 font-mono text-[10px]">rzp_test_placeholder</code> keys. You can simulate the payment completion below.
            </p>

            <div className="bg-[#8AC926]/5 rounded-xl p-4 border border-[#8AC926]/10 mb-6 text-left space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Description:</span>
                <span className="text-slate-800 font-bold">Platform Access Fee</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Order ID:</span>
                <span className="text-slate-800 font-mono truncate max-w-[160px] font-bold">{mockOrderData.orderId}</span>
              </div>
              <div className="border-t border-dashed border-[#8AC926]/20 my-2 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700">Total Amount:</span>
                <span className="text-xl font-extrabold text-[#4E8C52]">₹{(mockOrderData.amount / 100).toFixed(2)}</span>
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
                      razorpayOrderId: mockOrderData.orderId,
                      razorpayPaymentId: `pay_mock_${Date.now()}`,
                      razorpaySignature: `sig_mock_${Date.now()}`,
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
                className="w-full py-2.5 rounded-lg bg-[#8AC926] hover:bg-[#78B020] text-white font-sans font-extrabold transition-colors shadow-md text-sm cursor-pointer"
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
    </PageShell>
  );
}
