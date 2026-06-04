import type { ReactNode } from "react";

export function AdminPageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
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
    <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-3 pb-3">
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-xl font-extrabold text-slate-900">{title}</h2>
        {description ? (
          <p className="text-xs text-slate-600 font-semibold mt-1.5">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 ml-auto">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminPageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-3 pt-1 space-y-5 ${className}`.trim()}>{children}</div>;
}
