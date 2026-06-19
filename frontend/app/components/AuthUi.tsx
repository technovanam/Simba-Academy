import type { ReactNode } from "react";
import { Link } from "react-router";
import { AlertCircle, Check, LayoutGrid, Loader2 } from "lucide-react";
import { STUDENT_AUTH_BG_DESKTOP, STUDENT_AUTH_BG_MOBILE } from "../lib/constants";

const studentAuthBgImgClass =
  "absolute inset-0 h-full w-full object-cover object-center pointer-events-none";

/** Student auth content wrapper — no outer box; sits on jungle background */
export const studentAuthCardClass = "overflow-hidden";

/** Uniform height for student login inputs and submit button */
export const studentAuthControlClass = "h-12 w-full rounded-lg box-border text-sm";

/**
 * Fixed field column width on parchment (must match Tailwind classes below).
 * Mobile: 200px · Desktop (lg+): 320px · Height: 48px (h-12)
 */
export const STUDENT_AUTH_FIELD_WIDTH_MOBILE_PX = 200;
export const STUDENT_AUTH_FIELD_WIDTH_DESKTOP_PX = 320;

const studentAuthFieldWidthClass = "w-full max-w-[200px] lg:max-w-[320px] mx-auto";

/** Login form — fixed-width field column centered on parchment */
export const studentParchmentFormClass = studentAuthFieldWidthClass;

/** Sign-up form — same fixed width as login */
export const studentRegisterFormClass = studentAuthFieldWidthClass;

export function StudentParchmentHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center text-lg font-extrabold text-[#c77a00] tracking-tight mb-1 [@media(max-height:480px)]:text-base [@media(max-height:400px)]:text-[15px] [@media(max-height:400px)]:mb-0.5">
      {children}
    </h2>
  );
}

export type StudentParchmentVariant = "login" | "register";

const studentParchmentSlots: Record<StudentParchmentVariant, string> = {
  login:
    "left-[14%] right-[14%] top-[22%] bottom-[8%] lg:left-[20%] lg:right-[20%] lg:top-[36%] lg:bottom-[9%]",
  register:
    "left-[13%] right-[13%] top-[24%] bottom-[11%] lg:left-[19%] lg:right-[19%] lg:top-[36%] lg:bottom-[13%]",
};

export type AuthPortal = "student" | "teacher" | "admin";

const GREEN = {
  badgeClass: "bg-[#8AC926]/10 text-[#4E8C52] border-[#8AC926]/25",
  buttonClass: "bg-[#8AC926] hover:bg-[#78B020] shadow-[#8AC926]/20",
  focusRing: "focus:border-[#8AC926]",
  linkClass: "text-[#4E8C52]",
  iconClass: "text-[#8AC926]",
  subtitleClass: "text-[#4E8C52]/90",
  labelClass: "text-[#4E8C52]",
  shellTop: "bg-[#8AC926]/10",
  shellBottom: "bg-[#8AC926]/8",
  infoAlert: "bg-[#8AC926]/10 border-[#8AC926]/25 text-[#4E8C52]",
  successAlert: "bg-emerald-50 border-emerald-200 text-emerald-800",
};

const ORANGE = {
  badgeClass: "bg-[#FF9F1C]/10 text-[#c77a00] border-[#FF9F1C]/25",
  buttonClass: "bg-[#FF9F1C] hover:bg-[#e88f0a] shadow-[#FF9F1C]/25",
  focusRing: "focus:border-[#FF9F1C]",
  linkClass: "text-[#c77a00]",
  iconClass: "text-[#FF9F1C]",
  subtitleClass: "text-[#c77a00]/90",
  labelClass: "text-[#c77a00]",
  shellTop: "bg-[#FF9F1C]/12",
  shellBottom: "bg-[#FF9F1C]/8",
  infoAlert: "bg-[#FF9F1C]/10 border-[#FF9F1C]/25 text-[#9a5c00]",
  successAlert: "bg-amber-50 border-amber-200 text-amber-900",
};

const PORTAL_META: Record<
  AuthPortal,
  {
    label: string;
    badgeClass: string;
    buttonClass: string;
    focusRing: string;
    linkClass: string;
    iconClass: string;
    subtitleClass: string;
    labelClass: string;
    shellTop: string;
    shellBottom: string;
    infoAlert: string;
    successAlert: string;
  }
> = {
  student: {
    label: "Student Portal",
    badgeClass: ORANGE.badgeClass,
    buttonClass: ORANGE.buttonClass,
    focusRing: ORANGE.focusRing,
    linkClass: ORANGE.linkClass,
    iconClass: ORANGE.iconClass,
    subtitleClass: ORANGE.subtitleClass,
    labelClass: ORANGE.labelClass,
    shellTop: ORANGE.shellTop,
    shellBottom: ORANGE.shellBottom,
    infoAlert: ORANGE.infoAlert,
    successAlert: ORANGE.successAlert,
  },
  admin: {
    label: "Admin Portal",
    badgeClass: GREEN.badgeClass,
    buttonClass: GREEN.buttonClass,
    focusRing: GREEN.focusRing,
    linkClass: GREEN.linkClass,
    iconClass: GREEN.iconClass,
    subtitleClass: GREEN.subtitleClass,
    labelClass: GREEN.labelClass,
    shellTop: GREEN.shellTop,
    shellBottom: GREEN.shellBottom,
    infoAlert: GREEN.infoAlert,
    successAlert: GREEN.successAlert,
  },
  teacher: {
    label: "Teacher Portal",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    buttonClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25",
    focusRing: "focus:border-blue-500",
    linkClass: "text-blue-600",
    iconClass: "text-blue-600",
    subtitleClass: "text-blue-600/90",
    labelClass: "text-blue-700",
    shellTop: "bg-blue-500/12",
    shellBottom: "bg-blue-400/10",
    infoAlert: "bg-blue-50 border-blue-200 text-blue-800",
    successAlert: "bg-blue-50 border-blue-200 text-blue-800",
  },
};

/** Fixed top-right control — back to portal picker */
export function AuthBackButton({ portal }: { portal?: AuthPortal }) {
  const iconClass = portal ? PORTAL_META[portal].iconClass : ORANGE.iconClass;
  return (
    <Link
      to="/"
      className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
    >
      <LayoutGrid className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />
      Portals
    </Link>
  );
}

interface AuthPageShellProps {
  children: ReactNode;
  maxWidth?: string;
  portal?: AuthPortal;
  /** Align form inside the parchment zone of the student jungle background */
  parchmentFit?: boolean | StudentParchmentVariant;
}

/** Always-visible credit — pinned below scrollable auth content */
function AuthTechnoVanamCredit({ jungle = false }: { jungle?: boolean }) {
  return (
    <footer
      className={`shrink-0 relative z-30 w-full px-4 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] text-center text-[11px] sm:text-xs font-sans font-extrabold pointer-events-auto ${
        jungle
          ? "text-amber-100/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
          : "text-slate-500/80"
      }`}
    >
      Developed & Maintained by{" "}
      <a
        href="https://technovanam.in"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#71d300" }}
        className="hover:opacity-80 transition-opacity font-extrabold"
      >
        Techno Vanam
      </a>
    </footer>
  );
}

/** Full-viewport auth wrapper — credit stays visible; content scrolls when needed */
export function AuthPageShell({
  children,
  maxWidth = "max-w-md",
  portal = "student",
  parchmentFit = false,
}: AuthPageShellProps) {
  const parchmentVariant: StudentParchmentVariant | null =
    parchmentFit === "register" ? "register" : parchmentFit ? "login" : null;

  const theme = PORTAL_META[portal];
  const isStudentJungle = portal === "student" && Boolean(parchmentFit);

  return (
    <div
      className={`w-full max-w-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-x-hidden overflow-hidden font-sans relative ${
        isStudentJungle ? "bg-[#1b4332]" : "bg-slate-100"
      }`}
    >
      {isStudentJungle ? (
        <>
          <img
            src={STUDENT_AUTH_BG_MOBILE}
            alt=""
            className={`${studentAuthBgImgClass} lg:hidden`}
            aria-hidden
            fetchPriority="high"
          />
          <img
            src={STUDENT_AUTH_BG_DESKTOP}
            alt=""
            className={`${studentAuthBgImgClass} hidden lg:block`}
            aria-hidden
            fetchPriority="high"
          />
        </>
      ) : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div
            className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl ${theme.shellTop}`}
          />
          <div
            className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl ${theme.shellBottom}`}
          />
        </div>
      )}
      <AuthBackButton portal={portal} />
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-full flex flex-col overflow-hidden">
        {isStudentJungle && parchmentVariant ? (
          <div
            className={`absolute inset-0 min-h-0 overflow-hidden ${
              parchmentVariant === "register" ? "translate-y-[1%] lg:translate-y-[6%]" : ""
            } ${studentParchmentSlots[parchmentVariant]}`}
          >
            <div
              className={`h-full w-full flex flex-col items-stretch justify-center min-h-0 overflow-y-auto scrollbar-hide ${
                parchmentVariant === "register"
                  ? studentRegisterFormClass
                  : studentParchmentFormClass
              } [@media(max-height:560px)]:[&_input]:!h-10 [@media(max-height:560px)]:[&_button]:!h-10 [@media(max-height:480px)]:[&_input]:!h-9 [@media(max-height:480px)]:[&_button]:!h-9 [@media(max-height:400px)]:[&_input]:!h-8 [@media(max-height:400px)]:[&_button]:!h-8 [@media(max-height:560px)]:[&_.h-12]:!h-10 [@media(max-height:480px)]:[&_.h-12]:!h-9 [@media(max-height:400px)]:[&_.h-12]:!h-8`}
            >
              {children}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full max-w-full portal-main-scroll overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="min-h-full w-full max-w-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-6">
              <div className={`w-full max-w-full mx-auto ${maxWidth} min-h-0 min-w-0 shrink-0`}>{children}</div>
            </div>
          </div>
        )}
      </div>
      <AuthTechnoVanamCredit jungle={isStudentJungle} />
    </div>
  );
}

export function authInputClass(
  hasError: boolean,
  portal: AuthPortal = "student",
  compact = false
) {
  const focus = PORTAL_META[portal].focusRing;
  const size = compact
    ? "w-full rounded-xl px-3.5 py-2.5 text-sm"
    : "w-full rounded-xl px-4 py-3.5 text-base";
  return `${size} border text-slate-800 outline-none transition-all placeholder:text-slate-400 ${
    hasError
      ? "border-red-400 bg-red-50/50 focus:border-red-500 pr-10"
      : `border-slate-200 bg-slate-50/80 focus:bg-white ${focus}`
  }`;
}

export function portalLinkClass(portal: AuthPortal) {
  return `${PORTAL_META[portal].linkClass} text-sm font-bold hover:underline`;
}

export function portalButtonClass(portal: AuthPortal, compact = false) {
  const shape = compact
    ? "w-full py-3 rounded-xl text-sm"
    : "w-full py-3.5 rounded-xl text-base";
  return `${shape} text-white font-bold tracking-wide transition-colors shadow-md shadow-black/5 disabled:opacity-60 disabled:cursor-not-allowed ${PORTAL_META[portal].buttonClass}`;
}

/** Same-portal helper link (form area — not a footer bar) */
export function AuthInlineLink({
  children,
  to,
  portal,
  className,
}: {
  children: ReactNode;
  to: string;
  portal: AuthPortal;
  className?: string;
}) {
  return (
    <Link to={to} className={className ?? portalLinkClass(portal)}>
      {children}
    </Link>
  );
}

interface AuthLayoutProps {
  portal: AuthPortal;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
  /** Fit form inside the parchment area; hides duplicate header (title is on the background art) */
  parchmentFit?: boolean;
}

export function AuthLayout({
  portal,
  title,
  subtitle,
  children,
  wide,
  parchmentFit = false,
}: AuthLayoutProps) {
  const meta = PORTAL_META[portal];
  const isStudentParchment = portal === "student" && parchmentFit;

  const cardClass =
    "bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-h-full flex flex-col min-h-0 w-full";

  return (
    <AuthPageShell
      maxWidth={wide ? "max-w-lg" : "max-w-md"}
      portal={portal}
      parchmentFit={isStudentParchment}
    >
      <div className={cardClass}>
        <div className={isStudentParchment ? "w-full" : "p-6 sm:p-8 overflow-y-auto min-h-0 flex-1"}>
          {!isStudentParchment && (
            <div className="flex flex-col items-center text-center mb-6">
              <img
                src="/Simba Logo 2025.pdf.png"
                alt="Simba Preschool"
                className="w-44 h-14 object-contain mb-2"
              />
              <span
                className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-2 ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && (
                <p className={`text-base font-medium mt-1.5 max-w-xs leading-snug ${meta.subtitleClass}`}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </AuthPageShell>
  );
}

export type AuthSplitHighlight = {
  icon: ReactNode;
  title: string;
  description?: string;
};

interface AuthSplitLayoutProps {
  portal: AuthPortal;
  title: string;
  subtitle?: string;
  highlights?: AuthSplitHighlight[];
  /** Desktop sidebar footer (e.g. fee card) */
  sideFooter?: ReactNode;
  /** Compact mobile banner trailing content (e.g. fee amount) */
  mobileSideFooter?: ReactNode;
  children: ReactNode;
}

/** Single-card two-column auth — branding left, form right, inside one panel. */
export function AuthSplitLayout({
  portal,
  title,
  subtitle,
  highlights = [],
  sideFooter,
  mobileSideFooter,
  children,
}: AuthSplitLayoutProps) {
  const meta = PORTAL_META[portal];

  return (
    <AuthPageShell maxWidth="max-w-[52rem]" portal={portal}>
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-300/25 overflow-hidden flex flex-col lg:flex-row min-h-0 w-full min-w-0 max-w-full">
        {/* Mobile — branding + fee (no highlight cards) */}
        <aside className="lg:hidden relative shrink-0 overflow-hidden bg-gradient-to-b from-[#ffb347] via-[#FF9F1C] to-[#e88f0a] text-white">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-[#c77a00]/20 blur-2xl" />
          </div>
          <div className="relative z-10 px-4 py-5 sm:px-6 sm:py-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-20 h-10 rounded-xl bg-white/95 px-2 flex items-center justify-center shadow-sm shrink-0">
                <img src="/Simba Logo 2025.pdf.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Simba Academy</p>
                <p className="text-sm font-bold text-white">{meta.label}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold leading-snug tracking-tight">
                Join Simba Academy
              </h1>
              {subtitle ? (
                <p className="text-sm text-white/85 font-medium leading-relaxed">{subtitle}</p>
              ) : null}
            </div>

            {mobileSideFooter ? <div>{mobileSideFooter}</div> : null}
          </div>
        </aside>

        {/* Desktop — full branding sidebar */}
        <aside className="hidden lg:flex relative lg:w-[38%] shrink-0 overflow-hidden bg-gradient-to-b from-[#ffb347] via-[#FF9F1C] to-[#e88f0a] text-white flex-col">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full bg-[#c77a00]/20 blur-3xl" />
          </div>

          <div className="relative z-10 p-7 sm:p-8 lg:p-9 flex flex-col gap-6 lg:min-h-full lg:justify-center w-full">
            <div className="flex items-center gap-3">
              <div className="w-24 h-12 rounded-xl bg-white/95 px-2 flex items-center justify-center shadow-sm shrink-0">
                <img src="/Simba Logo 2025.pdf.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Simba Academy</p>
                <p className="text-sm font-bold text-white">{meta.label}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl font-extrabold leading-snug tracking-tight">
                Join Simba Academy
              </h1>
              {subtitle ? (
                <p className="text-sm text-white/85 font-medium leading-relaxed">{subtitle}</p>
              ) : null}
            </div>

            {highlights.length > 0 ? (
              <ul className="space-y-2.5">
                {highlights.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{item.title}</p>
                      {item.description ? (
                        <p className="text-[11px] text-white/75 font-medium mt-0.5 leading-snug">{item.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {sideFooter ? <div className="mt-auto pt-1">{sideFooter}</div> : null}
          </div>
        </aside>

        {/* Form */}
        <main className="flex-1 min-w-0 overflow-y-auto lg:border-l border-slate-100 bg-gradient-to-b from-white to-slate-50/80">
          <div className="p-4 sm:p-7 lg:p-9 lg:flex lg:flex-col lg:justify-center min-h-full">
            <div className="mb-4 lg:mb-6 pb-4 lg:pb-5 border-b border-slate-100 hidden lg:block">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Enter your details below. Fields marked with your class help personalize story books.
              </p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </AuthPageShell>
  );
}

interface AuthAlertProps {
  variant: "error" | "success" | "info";
  message: string;
  onDismiss?: () => void;
  portal?: AuthPortal;
}

export function AuthAlert({ variant, message, onDismiss, portal = "student" }: AuthAlertProps) {
  const theme = PORTAL_META[portal];
  const styles =
    variant === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : variant === "success"
        ? theme.successAlert
        : theme.infoAlert;

  const Icon = variant === "success" ? Check : AlertCircle;

  return (
    <div
      className={`mb-5 p-3 rounded-xl border flex gap-2.5 text-sm font-medium max-w-full ${styles}`}
      role="alert"
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="flex-1 min-w-0 leading-snug break-words line-clamp-3">{message}</p>
      {onDismiss && variant === "error" && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-bold opacity-70 hover:opacity-100 shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

interface AuthFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: ReactNode;
  portal?: AuthPortal;
  /** Softer sentence-case labels (signup split card) */
  softLabel?: boolean;
}

export function AuthField({
  label,
  error,
  children,
  hint,
  portal = "student",
  softLabel = false,
}: AuthFieldProps) {
  const labelColor = error ? "text-red-600" : PORTAL_META[portal].labelClass;
  const labelClass = softLabel
    ? `block text-xs font-semibold mb-1.5 ${error ? "text-red-600" : "text-slate-700"}`
    : `block font-bold uppercase tracking-wide text-sm mb-2 ${labelColor}`;

  return (
    <div className="w-full">
      <label className={labelClass}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
      {!error && hint}
    </div>
  );
}

interface AuthSubmitButtonProps {
  portal: AuthPortal;
  loading?: boolean;
  loadingText?: string;
  /** When false, keep button label visible while disabled — no spinner or text swap */
  showLoadingState?: boolean;
  compact?: boolean;
  children: ReactNode;
}

export function AuthSubmitButton({
  portal,
  loading,
  loadingText = "Please wait…",
  showLoadingState = true,
  compact = false,
  children,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`${portalButtonClass(portal, compact)} flex items-center justify-center gap-2 ${compact ? "min-h-[44px]" : "min-h-[48px]"}`}
    >
      {loading && showLoadingState ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText ? <span>{loadingText}</span> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** @deprecated Use AuthInlineLink — kept for gradual migration */
export function AuthFooterLink({
  children,
  to,
  className,
  portal = "student",
}: {
  children: ReactNode;
  to: string;
  className?: string;
  portal?: AuthPortal;
}) {
  return (
    <Link to={to} className={className ?? portalLinkClass(portal)}>
      {children}
    </Link>
  );
}
