import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { AlertCircle, Check, LayoutGrid, Loader2 } from "lucide-react";

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
      className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-md transition-colors"
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
}

/** Full-viewport auth wrapper — no document scroll */
export function AuthPageShell({
  children,
  maxWidth = "max-w-md",
  portal = "student",
}: AuthPageShellProps) {
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  const theme = PORTAL_META[portal];

  return (
    <div className="h-screen overflow-hidden bg-slate-100 font-sans relative">
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${theme.shellTop}`}
      />
      <div
        className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${theme.shellBottom}`}
      />
      <AuthBackButton portal={portal} />
      <div className="h-full flex items-center justify-center p-4 sm:p-6 min-h-0">
        <div className={`w-full ${maxWidth} max-h-full min-h-0`}>{children}</div>
      </div>
    </div>
  );
}

export function authInputClass(hasError: boolean, portal: AuthPortal = "student") {
  const focus = PORTAL_META[portal].focusRing;
  return `w-full rounded-xl border px-4 py-3.5 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 ${
    hasError
      ? "border-red-400 bg-red-50/50 focus:border-red-500 pr-10"
      : `border-slate-200 bg-white ${focus}`
  }`;
}

export function portalLinkClass(portal: AuthPortal) {
  return `${PORTAL_META[portal].linkClass} text-sm font-bold hover:underline`;
}

export function portalButtonClass(portal: AuthPortal) {
  return `w-full py-3.5 rounded-xl text-white font-bold text-base tracking-wide transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${PORTAL_META[portal].buttonClass}`;
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
}

export function AuthLayout({ portal, title, subtitle, children, wide }: AuthLayoutProps) {
  const meta = PORTAL_META[portal];

  return (
    <AuthPageShell maxWidth={wide ? "max-w-lg" : "max-w-md"} portal={portal}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-h-full flex flex-col min-h-0">
        <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1">
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/favicon.png"
              alt="Simba Preschool"
              className="w-12 h-12 object-contain mb-2"
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

          {children}
        </div>
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
      className={`mb-5 p-3.5 rounded-xl border flex gap-2.5 text-base font-medium ${styles}`}
      role="alert"
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="flex-1 leading-snug">{message}</p>
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
}

export function AuthField({ label, error, children, hint, portal = "student" }: AuthFieldProps) {
  const labelColor = error ? "text-red-600" : PORTAL_META[portal].labelClass;

  return (
    <div>
      <label className={`block text-sm font-bold uppercase tracking-wide mb-2 ${labelColor}`}>
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
  children: ReactNode;
}

export function AuthSubmitButton({
  portal,
  loading,
  loadingText = "Please wait…",
  children,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`${portalButtonClass(portal)} flex items-center justify-center gap-2 min-h-[48px]`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
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
