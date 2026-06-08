import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/student.checkout";
import { api, ApiError, type AuthUser, type Course } from "../lib/api";
import { PAYMENTS_ENABLED, PAYMENTS_MOCK_MODE } from "../lib/constants";
import { useMockPaymentGateway } from "../lib/useMockPaymentGateway";
import { clearSession, getToken, getUser } from "../lib/auth";
import { isActionBusy } from "../lib/actionGuard";
import { Toast } from "../components/Toast";
import { LogOut, Loader2, CreditCard, ArrowRight } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Enrollment Checkout | Simba Academy" }];
}

export default function StudentCheckoutPage() {
  const navigate = useNavigate();
  const { runCheckout, mockModal } = useMockPaymentGateway();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (!PAYMENTS_ENABLED) {
      navigate("/student/dashboard");
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
          navigate("/student/dashboard");
          return;
        }

        setCourses(allCourses);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          navigate("/login");
        } else {
          setError("Failed to load enrollment options. Please refresh.");
        }
      } finally {
        setLoading(false);
      }
    }

    initializeCheckout();
  }, [mounted, token, user, navigate]);

  async function handleEnroll(course: Course) {
    if (!token || !user || isActionBusy(actionLoading)) return;
    setActionLoading(`enroll-${course.id}`);
    setError("");
    setMessage("");

    try {
      const orderData = await api.createOrder(token, { courseId: course.id });

      const payment = await runCheckout({
        session: orderData,
        description: `Unlock Course: ${course.title}`,
        referenceNumber: orderData.paymentSessionId,
        customer: {
          name: user.name,
          email: user.email,
          phone: user.phone ?? undefined,
        },
      });

      setActionLoading("verify");
      const verifyResult = await api.verifyPayment(token, {
        paymentSessionId: payment.payments_session_id ?? orderData.paymentSessionId,
        paymentId: payment.payment_id,
        signature: payment.signature,
      });

      if (verifyResult.success) {
        setMessage(`Course "${course.title}" unlocked successfully.`);
        setIsSuccess(true);
      } else {
        setError("Payment verification failed. Please contact Simba support.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "widget_closed") {
        setError("Payment was cancelled.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to initiate payment.");
      }
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF9F1C]" />
        <p className="font-bold text-slate-600 text-sm">Loading checkout…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-sm text-slate-900 flex flex-col relative overflow-hidden">
      {PAYMENTS_MOCK_MODE ? mockModal : null}

      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF9F1C]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#FF9F1C]/8 blur-3xl pointer-events-none" />

      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={message} variant="success" onDismiss={() => setMessage("")} />

      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="" className="w-9 h-9 object-contain" />
          <div>
            <span className="font-bold text-sm text-slate-900 block">Simba Academy</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Student Portal</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-12 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF9F1C]" />
            <p className="font-bold text-slate-600 text-xs">Loading courses…</p>
          </div>
        ) : isSuccess ? (
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-[#FF9F1C]/10 border border-[#FF9F1C]/25 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-[#FF9F1C]" />
            </div>
            <div className="space-y-2">
              <h2 className="font-sans text-2xl font-extrabold text-slate-900">Payment verified</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your enrollment is complete. Course materials, story books, and your dashboard are now unlocked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="w-full py-3.5 rounded-xl bg-[#FF9F1C] hover:bg-[#e88f0a] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shadow-[#FF9F1C]/10 cursor-pointer"
            >
              Go to dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h1 className="font-sans text-2xl sm:text-3xl text-slate-900 font-extrabold leading-tight">
                Complete your enrollment
              </h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
                Select a course below to pay the tuition fee. Once verified, your student portal will be fully unlocked.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between gap-5 hover:border-[#FF9F1C]/30 transition"
                >
                  <div className="space-y-2 text-left">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-[#FF9F1C]/10 text-[#c77a00] border border-[#FF9F1C]/20">
                      {c.level}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                      {c.description || "Interactive children curriculum lessons."}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tuition</span>
                      <span className="text-sm font-black text-slate-900">₹{(c.price ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEnroll(c)}
                      disabled={actionLoading !== null}
                      className="w-full py-2.5 rounded-xl bg-[#FF9F1C] hover:bg-[#e88f0a] disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-[#FF9F1C]/10 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {actionLoading === `enroll-${c.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Pay & enroll"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-center shrink-0 text-[10px] font-semibold text-slate-400">
        Simba Academy © {new Date().getFullYear()} —{" "}
        {PAYMENTS_MOCK_MODE ? "Demo checkout" : "Secure payments via Zoho Payments"}
      </footer>
    </div>
  );
}
