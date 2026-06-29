import type { ReactNode } from "react";
import { Loader2, LogOut } from "lucide-react";
import { portalDashboardBodyClass } from "./PortalPageShell";

/** Settings page grid — two equal-height columns + full-width session bar. */
export const portalSettingsGridClass =
  "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch w-full min-w-0 max-w-full flex-1 min-h-0";

export function PortalSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${portalDashboardBodyClass} h-full overflow-hidden !pb-0`}>
      {children}
    </div>
  );
}

export function PortalSettingsPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-100 pb-3">
      <div className="min-w-0">
        <h2 className="text-sm lg:text-base font-bold text-slate-900 tracking-wide uppercase truncate">
          {title}
        </h2>
        <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase truncate">
          {description}
        </p>
      </div>
    </div>
  );
}

export function PortalSettingsCard({
  icon,
  iconWrapClassName,
  title,
  subtitle,
  trailing,
  children,
}: {
  icon: ReactNode;
  iconWrapClassName: string;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full min-h-0 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50 shrink-0">
        <div className={`p-2 rounded-xl shrink-0 ${iconWrapClassName}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
          <p className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase mt-0.5">
            {subtitle}
          </p>
        </div>
        {trailing}
      </div>
      <div className="p-5 flex flex-col flex-1 min-h-0">{children}</div>
    </div>
  );
}

export function PortalSettingsSessionBar({
  description,
  onLogout,
}: {
  description: string;
  onLogout: () => void;
}) {
  return (
    <div className="lg:col-span-2 bg-rose-50/40 rounded-2xl border border-rose-100 overflow-hidden shrink-0">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Active Session</h3>
          <p className="text-[10px] text-rose-700/90 font-semibold">{description}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white font-sans font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-rose-700 active:scale-98 transition-all duration-200 shadow-sm shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </div>
  );
}

export function PortalSettingsLoading({ spinnerClassName }: { spinnerClassName: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16 gap-3 min-h-[12rem]">
      <Loader2 className={`w-8 h-8 animate-spin ${spinnerClassName}`} />
      <p className="font-bold text-slate-600 text-sm">Loading profile…</p>
    </div>
  );
}

/** Shared field label — matches dashboard metric label style. */
export const portalSettingsLabelClass =
  "block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5";

export const portalSettingsInputClass =
  "w-full min-w-0 rounded-xl bg-slate-50/50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-800 font-semibold shadow-xs outline-none transition-all break-all sm:break-normal sm:truncate";

export const portalSettingsPasswordClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 bg-slate-50/50 text-sm font-semibold outline-none transition-all shadow-xs";
