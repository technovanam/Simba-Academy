import type { ReactNode } from "react";

/** Scrollable portal main column (sidebar layouts use 100dvh). */
export function PortalPageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col min-h-0 flex-1 w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export const portalDashboardBodyClass =
  "space-y-5 animate-fade-in flex flex-col flex-1 min-h-0 w-full min-w-0 max-w-full pb-6 lg:pb-8";

/** Overview dashboards: scroll on small screens, fixed height panels on lg+. */
export const portalDashboardOverviewClass =
  "space-y-5 animate-fade-in flex flex-col flex-1 min-h-0 w-full min-w-0 max-w-full h-full overflow-y-auto modern-scrollbar lg:overflow-hidden !pb-0";

export const portalDashboardLowerGridClass =
  "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full min-w-0 max-w-full flex-1";

export const portalDashboardLowerGridShellClass =
  `${portalDashboardLowerGridClass} flex-1 min-h-0 overflow-visible lg:overflow-hidden`;

/** Large headline count on dashboard summary cards. */
export const portalHeroMetricClass =
  "text-2xl font-bold text-slate-800 leading-snug tracking-tight tabular-nums";

/** Right-hand analytics panel — compact rows, stretches to match main column height. */
export const portalAnalyticsPanelClass =
  "bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden lg:col-span-1 h-full";

export const portalAnalyticsHeaderClass =
  "flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2.5 shrink-0";

export const portalAnalyticsTitleClass =
  "font-bold text-[10px] uppercase text-slate-800 tracking-wider";

export const portalAnalyticsListClass =
  "flex flex-col flex-1 min-h-0 gap-1.5 justify-between";

export const portalAnalyticsRowClass =
  "flex-1 min-h-9 px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2";

export const portalAnalyticsLabelClass =
  "text-[9px] font-bold text-slate-600 uppercase tracking-wide leading-tight min-w-0";

export const portalAnalyticsValueClass =
  "text-base font-bold text-slate-800 tabular-nums shrink-0 leading-tight tracking-tight text-right";

/** Main (left) dashboard column beside analytics panel. */
export const portalDashboardMainPanelClass =
  "lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden h-full";
