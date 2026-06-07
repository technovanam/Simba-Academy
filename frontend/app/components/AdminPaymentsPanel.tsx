import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Payment } from "../lib/api";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  PillSelect,
  adminListRowClass,
  useAdminPagination,
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

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.user?.name ?? "").toLowerCase().includes(q) ||
      (p.user?.email ?? "").toLowerCase().includes(q) ||
      (p.gatewayPaymentId ?? "").toLowerCase().includes(q) ||
      (p.paymentSessionId ?? "").toLowerCase().includes(q) ||
      (p.course?.title ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = sortPaymentsNewestFirst(filtered);

  const pagination = useAdminPagination(sorted, [search, statusFilter, payments.length]);

  const successTotal = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminPageShell>
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
          </>
        }
      />

      <AdminPageBody>
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
          <AdminRecordList>
            {pagination.paginatedItems.map((p) => (
              <div
                key={p.id}
                className={`${adminListRowClass} cursor-pointer hover:border-blue-200 hover:bg-blue-50/40 transition`}
                onClick={() => setViewPayment(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewPayment(p);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-bold text-sm text-slate-800">{p.user?.name ?? "Unknown payer"}</p>
                  <p className="text-2xs text-slate-600 font-medium">{p.user?.email ?? "—"}</p>
                  {p.course?.title && (
                    <p className="text-2xs text-slate-500 mt-0.5">Course: {p.course.title}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-extrabold text-emerald-700">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${statusBadgeClass(p.status)}`}
                  >
                    {p.status}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewPayment(p);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-2xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Eye className="w-3 h-3" /> View
                </button>
              </div>
            ))}
            <AdminListPagination
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={sorted.length}
              safePage={pagination.safePage}
              totalPages={pagination.totalPages}
              pageNumbers={pagination.pageNumbers}
              onPageChange={pagination.setCurrentPage}
              itemLabel="payments"
            />
          </AdminRecordList>
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
