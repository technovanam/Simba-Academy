import type { Payment } from "../lib/api";

function statusBadgeClass(status: string): string {
  if (status === "SUCCESS") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (status === "REFUNDED") return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-rose-50 text-rose-700 border border-rose-200";
}

type RecentPaymentCardTheme = "blue" | "slate";

const borderByTheme: Record<RecentPaymentCardTheme, string> = {
  blue: "border-blue-100",
  slate: "border-slate-200",
};

export function RecentPaymentCard({
  payment,
  theme = "blue",
  compact = false,
}: {
  payment: Payment;
  theme?: RecentPaymentCardTheme;
  /** Fits dashboard metric cards without extra height */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={`bg-white rounded-xl p-2 border ${borderByTheme[theme]} text-xs flex flex-col gap-0.5`}
      >
        <div className="flex justify-between items-start gap-1">
          <span className="font-bold text-slate-800 text-2xs truncate max-w-[120px]">
            {payment.user?.name ?? "Payer"}
          </span>
          <span
            className={`px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase shrink-0 ${statusBadgeClass(payment.status)}`}
          >
            {payment.status}
          </span>
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold">
          <span className="font-bold text-emerald-700">₹{payment.amount.toLocaleString("en-IN")}</span>
          <span>
            {new Date(payment.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl p-2.5 border ${borderByTheme[theme]} text-xs flex flex-col gap-1`}
    >
      <div className="flex justify-between items-start gap-1">
        <span className="font-bold text-slate-800 text-2xs truncate max-w-[140px]">
          {payment.user?.name ?? "Payer"}
        </span>
        <span
          className={`px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase shrink-0 ${statusBadgeClass(payment.status)}`}
        >
          {payment.status}
        </span>
      </div>
      <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold gap-2">
        <span className="truncate min-w-0">
          {payment.user?.email ?? "—"}
        </span>
        <span className="font-bold text-emerald-700 shrink-0">
          ₹{payment.amount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold">
        <span className="truncate">
          {payment.course?.title ? payment.course.title : "Registration"}
        </span>
        <span className="shrink-0">
          {new Date(payment.createdAt).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

export function sortPaymentsNewestFirst(payments: Payment[]): Payment[] {
  return [...payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
