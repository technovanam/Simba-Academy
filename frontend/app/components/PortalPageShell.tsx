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

export const portalDashboardLowerGridClass =
  "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full min-w-0 max-w-full flex-1";
