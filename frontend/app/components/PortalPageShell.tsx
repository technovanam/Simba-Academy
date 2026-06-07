import type { ReactNode } from "react";

/** Fills the portal main column height (100vh minus sidebar). */
export function PortalPageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col h-full min-h-0 flex-1 overflow-hidden ${className}`.trim()}>
      {children}
    </div>
  );
}

export const portalDashboardBodyClass =
  "space-y-5 animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden";

export const portalDashboardLowerGridClass =
  "grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch flex-1 min-h-[min(420px,calc(100vh-22rem))]";
