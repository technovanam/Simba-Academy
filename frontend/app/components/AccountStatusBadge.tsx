import type { AccountStatus } from "../lib/api";

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const active = status === "ACTIVE";
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs font-bold text-slate-700">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          active ? "bg-green-500 shadow-sm shadow-green-500/50" : "bg-red-500"
        }`}
        aria-hidden
      />
      {active ? "Active" : "Deactivated"}
    </span>
  );
}
