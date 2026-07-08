import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/register";
import { PasswordInput } from "../components/PasswordInput";
import {
  AuthField,
  AuthInlineLink,
  AuthSplitLayout,
  AuthSubmitButton,
  authInputClass,
} from "../components/AuthUi";
import { FormPillSelect } from "../components/FormPillSelect";
import { Toast } from "../components/Toast";
import { api, ApiError, formatApiError } from "../lib/api";
import { useMockPaymentGateway } from "../lib/useMockPaymentGateway";
import { getUser, saveSession } from "../lib/auth";
import {
  PAYMENTS_ENABLED,
  PAYMENTS_MOCK_MODE,
  STUDENT_CLASS_OPTIONS,
  STUDENT_PLATFORM_FEE_INR,
  type StudentClassLevel,
} from "../lib/constants";
import { AlertCircle, CreditCard, FileText, Presentation } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Student Sign Up | Simba Preschool" }];
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { runCheckout, mockModal } = useMockPaymentGateway();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    studentClass: "" as StudentClassLevel | "",
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [classError, setClassError] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = typeof window !== "undefined" ? getUser()?.role : null;

  useEffect(() => {
    if (userRole === "STUDENT") {
      navigate("/student/dashboard");
    }
  }, [userRole, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setClassError("");

    let hasErrors = false;

    if (!form.name.trim()) {
      setNameError("Please enter your full name");
      hasErrors = true;
    }

    if (!form.email.trim()) {
      setEmailError("Please enter your email");
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailError("Enter a valid email address");
      hasErrors = true;
    }

    if (!form.phone.trim()) {
      setPhoneError("Please enter your phone number");
      hasErrors = true;
    } else if (form.phone.trim().length < 7) {
      setPhoneError("Please enter a valid phone number");
      hasErrors = true;
    }

    if (!form.password) {
      setPasswordError("Please enter a password");
      hasErrors = true;
    } else if (form.password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      hasErrors = true;
    }

    if (!form.studentClass) {
      setClassError("Please select your child's class");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);

    try {
      const checkRes = await api.checkEmail(form.email);
      if (!checkRes.available) {
        setEmailError("Email is already registered");
        throw new Error("This email is already registered. Please log in or choose a different one.");
      }

      if (!PAYMENTS_ENABLED) {
        const result = await api.register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          studentClass: form.studentClass,
        });
        saveSession(result.token, result.user);
        navigate("/student/dashboard");
        return;
      }

      const orderData = await api.createPreRegisterOrder();

      try {
        const payment = await runCheckout({
          session: orderData,
          description: "Student Platform Registration Fee",
          invoiceNumber: `REG-${Date.now()}`,
          referenceNumber: orderData.paymentSessionId,
          customer: {
            name: form.name,
            email: form.email,
          },
        });

        const result = await api.registerWithPayment({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          studentClass: form.studentClass,
          paymentSessionId: payment.payments_session_id ?? orderData.paymentSessionId,
          paymentId: payment.payment_id,
          signature: payment.signature,
        });

        saveSession(result.token, result.user);
        navigate("/student/dashboard");
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "widget_closed") {
          setError("Payment was cancelled. Your account was not created.");
        } else {
          throw err;
        }
      } finally {
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(formatApiError(err, "Registration failed. No account was created."));
      setLoading(false);
    }
  }

  const feeLabel = `₹${STUDENT_PLATFORM_FEE_INR}`;
  const submitLabel = PAYMENTS_ENABLED ? `Pay ${feeLabel} & sign up` : "Create account";
  const inputClass = (hasError: boolean) => authInputClass(hasError, "student", true);

  const sideSubtitle = PAYMENTS_ENABLED
    ? "One-time fee to unlock story books for your child's class."
    : "Free access to PDF & PPT story books by class.";

  const mobileFeeBanner = PAYMENTS_ENABLED ? (
    <div className="rounded-xl bg-white/12 border border-white/20 px-3.5 py-2.5 flex items-center justify-between gap-3">
      <p className="text-xs font-semibold text-white/85">Registration fee</p>
      <p className="text-xl sm:text-2xl font-black text-white shrink-0">{feeLabel}</p>
    </div>
  ) : null;

  const feeFooter = PAYMENTS_ENABLED ? (
    <div className="rounded-2xl bg-white/12 border border-white/20 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80">Registration fee</p>
          <p className="text-[11px] text-white/65 font-medium mt-0.5">
            {PAYMENTS_MOCK_MODE ? "Demo checkout" : "Zoho Payments"} · account created after pay
          </p>
        </div>
      </div>
      <p className="text-2xl font-black text-white shrink-0">{feeLabel}</p>
    </div>
  ) : null;

  return (
    <>
      {PAYMENTS_MOCK_MODE ? mockModal : null}
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <AuthSplitLayout
        portal="student"
        title="Sign up"
        subtitle={sideSubtitle}
        mobileSideFooter={mobileFeeBanner}
        highlights={[
          {
            icon: <FileText className="w-4 h-4 text-white" />,
            title: "Story books (PDF)",
            description: "Read and print PDF story books for Playgroup, Pre-KG, LKG & UKG.",
          },
          {
            icon: <Presentation className="w-4 h-4 text-white" />,
            title: "Story books (PPT)",
            description: "View presentation-style story books shared by Simba teachers.",
          },
        ]}
        sideFooter={feeFooter}
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3.5"
        >
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <AuthField label="Full name" error={nameError} portal="student" softLabel>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Parent / guardian name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (nameError) setNameError("");
                  }}
                  className={inputClass(!!nameError)}
                />
                {nameError && (
                  <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </AuthField>

            <AuthField label="Email" error={emailError} portal="student" softLabel>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (emailError) setEmailError("");
                  }}
                  className={inputClass(!!emailError)}
                />
                {emailError && (
                  <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </AuthField>
          </div>

          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <AuthField label="Child's class" error={classError} portal="student" softLabel>
              <FormPillSelect
                compact
                value={form.studentClass}
                options={STUDENT_CLASS_OPTIONS}
                onChange={(studentClass) => {
                  setForm({ ...form, studentClass });
                  if (classError) setClassError("");
                }}
                ariaLabel="Select child's class"
                placeholder="Choose class"
                hasError={!!classError}
              />
            </AuthField>

            <AuthField label="Phone number" error={phoneError} portal="student" softLabel>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="Contact number"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (phoneError) setPhoneError("");
                  }}
                  className={inputClass(!!phoneError)}
                />
                {phoneError && (
                  <AlertCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </AuthField>
          </div>

          <AuthField label="Password" error={passwordError} portal="student" softLabel>
            <PasswordInput
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(password) => {
                setForm({ ...form, password });
                if (passwordError) setPasswordError("");
              }}
              autoComplete="new-password"
              className={inputClass(!!passwordError) + " pr-12"}
            />
          </AuthField>

          <div className="pt-2 space-y-3">
            <AuthSubmitButton
              portal="student"
              compact
              loading={loading}
              loadingText={PAYMENTS_ENABLED ? "Processing payment…" : "Creating account…"}
            >
              {submitLabel}
            </AuthSubmitButton>

            <p className="text-center text-xs text-slate-500 font-medium">
              Already have an account?{" "}
              <AuthInlineLink to="/login" portal="student">
                Sign in
              </AuthInlineLink>
            </p>
          </div>
        </form>
      </AuthSplitLayout>
    </>
  );
}
