import type { ReactNode } from "react";

export function AdminPageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-5 w-full min-w-0 max-w-full overflow-x-hidden">{children}</div>;
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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-x-4 gap-y-3 pb-3 w-full min-w-0">
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-lg sm:text-xl font-extrabold text-slate-900 break-words">{title}</h2>
        {description ? (
          <p className="text-xs text-slate-600 font-semibold mt-1.5 break-words">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:max-w-full sm:ml-auto min-w-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-3 pt-1 space-y-5 w-full min-w-0 max-w-full ${className}`.trim()}>{children}</div>;
}

/** Shared width for toolbar search fields — full width on phones, fixed on sm+ */
export const adminToolbarSearchClass = "relative w-full min-w-0 sm:w-[260px] max-w-full shrink-0";
