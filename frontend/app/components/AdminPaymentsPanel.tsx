import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Payment } from "../lib/api";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import {
  AdminListEmpty,
  AdminSearchInput,
  PillSelect,
} from "./AdminListUi";
import { CreditCard, Eye, IndianRupee, Loader2, Receipt } from "lucide-react";
import { ModalCloseButton } from "./ModalCloseButton";
import { sortPaymentsNewestFirst } from "./RecentPaymentCard";

type PaymentStatusFilter = "ALL" | "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

const STATUS_FILTERS: { id: PaymentStatusFilter; label: string }[] = [
  { id: "ALL", label: "All payments" },
  { id: "SUCCESS", label: "Successful" },
  { id: "PENDING", label: "Pending" },
  { id: "FAILED", label: "Failed" },
  { id: "REFUNDED", label: "Refunded" },
];

function statusBadgeClass(status: string): string {
  if (status === "SUCCESS") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "REFUNDED") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

interface AdminPaymentsPanelProps {
  token: string;
  onError: (message: string) => void;
}

export function AdminPaymentsPanel({ token, onError }: AdminPaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPayments(token);
      setPayments(data);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [token, onError]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const getPaymentClass = (p: Payment) => p.course?.level || p.user?.studentClass;

  const classOptions = [
    { id: "ALL", label: "All classes" },
    { id: "Playgroup", label: "Playgroup" },
    { id: "Pre-KG", label: "Pre-KG" },
    { id: "LKG", label: "LKG" },
    { id: "UKG", label: "UKG" },
    ...Array.from(
      new Set(
        payments
          .map(getPaymentClass)
          .filter(Boolean)
          .filter((c) => !["Playgroup", "Pre-KG", "LKG", "UKG"].includes(c!))
      )
    ).map((level) => ({
      id: level!,
      label: level!,
    })),
  ];

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const pClass = getPaymentClass(p) || "";
    const matchesSearch =
      (p.user?.name ?? "").toLowerCase().includes(q) ||
      (p.user?.email ?? "").toLowerCase().includes(q) ||
      (p.gatewayPaymentId ?? "").toLowerCase().includes(q) ||
      (p.paymentSessionId ?? "").toLowerCase().includes(q) ||
      (p.course?.title ?? "").toLowerCase().includes(q) ||
      pClass.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesClass = classFilter === "ALL" || pClass === classFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  const sorted = sortPaymentsNewestFirst(filtered);

  const successTotal = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
      <AdminPageHeader
        title="Payments & Enrollments"
        description="Zoho payment records for student registrations and course purchases."
        actions={
          <>
            <AdminSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search payer, email, transaction ID…"
              ariaLabel="Search payments"
            />
            <PillSelect
              value={statusFilter}
              options={STATUS_FILTERS}
              onChange={setStatusFilter}
              ariaLabel="Payment status filter"
            />
            <PillSelect
              value={classFilter}
              options={classOptions}
              onChange={setClassFilter}
              ariaLabel="Class filter"
              align="right"
            />
          </>
        }
      />

      <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-lg border border-blue-100 shrink-0">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider leading-none">Total records</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5 leading-tight">{payments.length}</p>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-lg border border-emerald-100 shrink-0">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider leading-none">Successful revenue</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-0.5 leading-tight">
                ₹{successTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
            <p className="text-xs font-semibold text-slate-600">Loading payments…</p>
          </div>
        ) : sorted.length === 0 ? (
          <AdminListEmpty
            message={
              payments.length === 0
                ? "No payment records yet."
                : "No payments match your search or filter."
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">

            {/* Desktop Table — md and above */}
            <div className="hidden md:block overflow-x-auto flex-1 min-h-0 overflow-y-auto modern-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Payer</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Class</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800">{p.user?.name ?? "Unknown payer"}</span>
                          <span className="text-2xs text-slate-500 font-medium">{p.user?.email ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs font-semibold whitespace-nowrap">
                        {(() => {
                          const cls = p.course?.level || p.user?.studentClass;
                          return cls ? (
                            <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-extrabold text-[10px] uppercase">
                              {cls}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 align-middle text-sm font-extrabold text-emerald-700 whitespace-nowrap">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${statusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-500 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2 text-right align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewPayment(p)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-2xs font-bold flex items-center gap-1 ml-auto transition"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout — below md */}
            <div className="md:hidden divide-y divide-slate-200/50 flex-1 overflow-y-auto modern-scrollbar bg-slate-50/50">
              {sorted.map((p) => {
                const cls = p.course?.level || p.user?.studentClass;
                return (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2.5">
                    {/* Name + email + action */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-slate-800 leading-tight">{p.user?.name ?? "Unknown payer"}</p>
                        <p className="text-2xs text-slate-500 font-semibold mt-0.5 truncate">{p.user?.email ?? "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewPayment(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-2xs font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/30 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Amount</span>
                        <span className="text-emerald-700 font-extrabold text-sm">₹{p.amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Status</span>
                        <span className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border inline-block ${statusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Class</span>
                        {cls ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-extrabold text-[10px] uppercase inline-block">{cls}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-0.5">Date</span>
                        <span className="text-slate-600 font-medium">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </AdminPageBody>

      {viewPayment && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewPayment(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalCloseButton onClick={() => setViewPayment(null)} className="absolute top-4 right-4" />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-8">
              Payment details
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-2xs font-bold text-slate-500 uppercase">Payer</dt>
                <dd className="font-semibold text-slate-800">{viewPayment.user?.name ?? "—"}</dd>
                <dd className="text-2xs text-slate-600">{viewPayment.user?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold text-slate-500 uppercase">Amount</dt>
                <dd className="text-lg font-extrabold text-emerald-700">
                  ₹{viewPayment.amount.toLocaleString("en-IN")} {viewPayment.currency}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-bold text-slate-500 uppercase">Status</dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${statusBadgeClass(viewPayment.status)}`}
                  >
                    {viewPayment.status}
                  </span>
                </dd>
              </div>
              {viewPayment.course?.title && (
                <div>
                  <dt className="text-2xs font-bold text-slate-500 uppercase">Course</dt>
                  <dd className="font-semibold text-slate-800">{viewPayment.course.title}</dd>
                </div>
              )}
              {(() => {
                const cls = viewPayment.course?.level || viewPayment.user?.studentClass;
                return cls ? (
                  <div>
                    <dt className="text-2xs font-bold text-slate-500 uppercase">Class</dt>
                    <dd className="font-semibold text-slate-850 uppercase">{cls}</dd>
                  </div>
                ) : null;
              })()}
              <div>
                <dt className="text-2xs font-bold text-slate-500 uppercase">Payment session ID</dt>
                <dd className="text-2xs font-mono text-slate-700 break-all">
                  {viewPayment.paymentSessionId ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-bold text-slate-500 uppercase">Gateway payment ID</dt>
                <dd className="text-2xs font-mono text-slate-700 break-all">
                  {viewPayment.gatewayPaymentId ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-bold text-slate-500 uppercase">Date</dt>
                <dd className="font-semibold text-slate-800">
                  {new Date(viewPayment.createdAt).toLocaleString("en-IN", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setViewPayment(null)}
              className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
