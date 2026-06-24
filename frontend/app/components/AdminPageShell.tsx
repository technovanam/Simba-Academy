import type { ReactNode } from "react";

export function AdminPageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  const hasSpaceY = className.includes("space-y-");
  const spacing = hasSpaceY ? "" : "space-y-5";
  const defaultOverflow = className.includes("overflow-") ? "" : "overflow-x-hidden";
  return <div className={`w-full min-w-0 max-w-full ${spacing} ${defaultOverflow} ${className}`.trim()}>{children}</div>;
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:justify-between xl:items-center gap-x-4 gap-y-3 pb-3 w-full min-w-0">
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-lg sm:text-xl font-extrabold text-slate-900 break-words">{title}</h2>
        {description ? (
          <p className="text-xs text-slate-600 font-semibold mt-1.5 break-words">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:max-w-full xl:ml-auto min-w-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  const hasSpaceY = className.includes("space-y-");
  const spacing = hasSpaceY ? "" : "space-y-5";
  return <div className={`mt-3 pt-1 w-full min-w-0 max-w-full ${spacing} ${className}`.trim()}>{children}</div>;
}

/** Shared width for toolbar search fields — full width on phones, fixed on sm+ */
export const adminToolbarSearchClass = "relative w-full min-w-0 sm:w-[260px] max-w-full shrink-0";
