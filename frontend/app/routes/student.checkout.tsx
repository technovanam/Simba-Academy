import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/student.checkout";
import { api, ApiError, type AuthUser, type Course } from "../lib/api";
import { clearSession, getToken, getUser } from "../lib/auth";
import { ModalCloseButton } from "../components/ModalCloseButton";
import {
  LogOut,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Compass,
  ArrowRight,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Enrollment Checkout | Simba Academy" }];
}

export default function StudentCheckoutPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorClosing, setErrorClosing] = useState(false);
  const [messageClosing, setMessageClosing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerErrorClose = () => {
    setErrorClosing(true);
    setTimeout(() => {
      setError("");
      setErrorClosing(false);
    }, 300);
  };

  const triggerMessageClose = () => {
    setMessageClosing(true);
    setTimeout(() => {
      setMessage("");
      setMessageClosing(false);
    }, 300);
  };

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!token || user?.role !== "STUDENT") {
      navigate("/login");
      return;
    }

    async function initializeCheckout() {
      try {
        const [allCourses, allPayments] = await Promise.all([
          api.getCourses(),
          api.getStudentPayments(token!),
        ]);

        const successful = allPayments.filter((p) => p.status === "SUCCESS");
        if (successful.length > 0) {
          // Already enrolled, bypass checkout
          navigate("/student/dashboard");
          return;
        }

        setCourses(allCourses);
      } catch (err) {
        console.error("Failed to load checkout details:", err);
        setError("Failed to sync details with database. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    initializeCheckout();
  }, [mounted, token, user, navigate]);

  useEffect(() => {
    if (error || message) {
      const dismissTimer = setTimeout(() => {
        if (error) triggerErrorClose();
        if (message) triggerMessageClose();
      }, 5000);

      const handleGlobalClick = () => {
        if (error) triggerErrorClose();
        if (message) triggerMessageClose();
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
  }, [error, message]);

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function handleEnroll(course: Course) {
    if (!token || !user) return;
    setActionLoading(`enroll-${course.id}`);
    setError("");
    setMessage("");

    try {
      // 1. Load Razorpay Checkout SDK
      const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!scriptLoaded) {
        throw new Error("Razorpay Checkout SDK failed to load. Are you connected to the internet?");
      }

      // 2. Request order details from backend
      const orderData = await api.createOrder(token, {
        courseId: course.id,
      });

      // 3. Open Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Simba Academy 🦁",
        description: `Enroll: ${course.title}`,
        image: "/Simba Logo 2025.pdf.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setActionLoading("verify");
            const verifyResult = await api.verifyPayment(token, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              setMessage(`Congratulations! Course "${course.title}" unlocked successfully!`);
              setIsSuccess(true);
            } else {
              setError("Payment verification failed. Please contact Simba support.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            setError("Signature validation failed. Contact support.");
          } finally {
            setActionLoading(null);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone ?? "",
        },
        theme: {
          color: "#8AC926",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate payment.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F0F7F4] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#52b788]" />
        <p className="font-bold text-[#1b4332] text-sm tracking-wider">Loading Simba Checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9F6] font-sans text-sm text-slate-800 flex flex-col justify-between relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute right-[-10%] top-[-10%] w-96 h-96 rounded-lg bg-[#52b788]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute left-[-10%] bottom-[-10%] w-96 h-96 rounded-lg bg-[#ffb703]/5 blur-3xl pointer-events-none"></div>

      {/* Floating Notification Alerts */}
      {error && (
        <div className={`fixed top-6 right-6 z-50 max-w-sm w-full bg-white/90 backdrop-blur-md border border-red-100 rounded-2xl shadow-xl overflow-hidden flex text-left ${errorClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
          <div className="w-2 bg-red-500 flex-shrink-0" />
          <div className="p-4 flex gap-3.5 items-start w-full">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 leading-tight">Error</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
            </div>
            <ModalCloseButton size="sm" className="shrink-0" onClick={triggerErrorClose} />
          </div>
        </div>
      )}

      {message && (
        <div className={`fixed top-6 right-6 z-50 max-w-sm w-full bg-white/90 backdrop-blur-md border border-emerald-100 rounded-2xl shadow-xl overflow-hidden flex text-left ${messageClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
          <div className="w-2 bg-emerald-500 flex-shrink-0" />
          <div className="p-4 flex gap-3.5 items-start w-full">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 leading-tight">Success</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">{message}</p>
            </div>
            <ModalCloseButton size="sm" className="shrink-0" onClick={triggerMessageClose} />
          </div>
        </div>
      )}

      {/* Header bar */}
      <header className="h-16 border-b border-slate-200 bg-white/85 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-black text-lg tracking-wider text-[#1b4332]">SIMBA ACADEMY 🦁</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ffb703]/10 text-[#f57f17] border border-[#ffe082]/20">
            Explorer Portal
          </span>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Leave Camp</span>
        </button>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 overflow-y-auto px-6 py-12 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#52b788]" />
            <p className="font-bold text-[#1b4332] text-xs">Assembling your explorer backpack...</p>
          </div>
        ) : isSuccess ? (
          /* Celebratory Successful Enrollment Screen */
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fade-in relative">
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              🦁
            </div>
            <div className="space-y-2">
              <h2 className="font-sans text-2xl font-black text-[#1b4332] tracking-tight">Tuition Verified!</h2>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Welcome to the Savanna! Your transaction was successfully verified. Your class dashboard, study library, and guides are now fully unlocked.
              </p>
            </div>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="w-full py-4 rounded-2xl bg-[#52b788] hover:bg-[#2d6a4f] text-white font-sans font-black text-sm tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-[#52b788]/20 cursor-pointer"
            >
              Enter Safari Playground <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Course selection checklist */
          <div className="max-w-4xl w-full space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white border border-[#52b788]/20 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#ffb703] animate-pulse" />
                <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#2d6a4f]">
                  Account Created Successfully
                </span>
                <Sparkles className="w-4 h-4 text-[#ffb703] animate-pulse" />
              </div>
              <h1 className="font-sans text-3xl sm:text-4xl text-[#1b4332] font-black leading-tight">
                Unlock Your Simba Safari Adventure
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-semibold leading-relaxed">
                Select your preschool class below to complete enrollment and pay the tuition fee. Once completed, your workspace is instantly unlocked.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {courses.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-white rounded-3xl border-2 border-slate-100 hover:border-[#52b788]/50 shadow-md hover:shadow-xl transition-all p-6 flex flex-col justify-between gap-6 relative overflow-hidden group"
                >
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#52b788]/10 group-hover:bg-[#52b788]/20 rounded-full transition pointer-events-none"></div>
                  
                  <div className="space-y-3 text-left">
                    <span className="px-2.5 py-0.5 rounded-lg text-4xs font-black uppercase bg-[#52b788]/10 text-[#2d6a4f] border border-[#52b788]/20">
                      {c.level} Adventure 🧭
                    </span>
                    <h3 className="font-sans font-black text-sm text-slate-900 leading-tight">{c.title}</h3>
                    <p className="text-2xs text-slate-600 leading-relaxed line-clamp-4">{c.description || "Interactive children curriculum safari classes."}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-left">
                      <span className="text-3xs font-black text-slate-500 uppercase tracking-wider">Tuition Fee</span>
                      <span className="text-md font-black text-[#2d6a4f]">₹{(c.price ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      onClick={() => handleEnroll(c)}
                      disabled={actionLoading !== null}
                      className="w-full py-3 rounded-2xl bg-[#ff9f1c] hover:bg-[#ffb703] disabled:bg-slate-200 text-white disabled:text-slate-400 font-sans font-black text-xs tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-[#ff9f1c]/10 cursor-pointer"
                    >
                      {actionLoading === `enroll-${c.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>Pay Tuition & Enroll 🚀</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="h-14 border-t border-slate-200 bg-white/70 backdrop-blur-md px-6 flex items-center justify-center shrink-0 text-3xs font-semibold text-slate-400">
        Simba Preschool Academy © {new Date().getFullYear()} — Secure Payment Processing via Razorpay
      </footer>

    </div>
  );
}
