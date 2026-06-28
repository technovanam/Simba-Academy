import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronRight, CreditCard, ExternalLink, TrendingUp, Users, Bell } from "lucide-react";
import {
  api,
  ApiError,
  type DashboardStats,
  type FranchiseInquiry,
  type Inquiry,
  type Payment,
  type Task,
} from "../../../lib/api";
import { ADMIN_TAB_PATHS, type AdminTab } from "../../../lib/adminRoutes";
import { useAdminOutlet } from "../AdminOutletContext";
import { AdminTabLoader } from "../AdminTabLoader";

import { RecentPaymentCard, sortPaymentsNewestFirst } from "../../RecentPaymentCard";
import {
  portalDashboardBodyClass,
  portalDashboardLowerGridClass,
} from "../../PortalPageShell";

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const { token, setError } = useAdminOutlet();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [franchiseInquiries, setFranchiseInquiries] = useState<FranchiseInquiry[]>([]);

  const [loading, setLoading] = useState(true);

  function goToTab(tab: AdminTab) {
    navigate(ADMIN_TAB_PATHS[tab]);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboardStats, paymentsResult, inquiriesResult, tasksResult, franchisesResult] =
          await Promise.allSettled([
            api.getDashboard(token),
            api.getPayments(token),
            api.getInquiries(token),
            api.getTasks(token),
            api.getFranchiseInquiries(token),
          ]);

        if (cancelled) return;

        if (dashboardStats.status !== "fulfilled") {
          throw dashboardStats.reason;
        }
        setStats(dashboardStats.value);

        if (paymentsResult.status === "fulfilled") {
          setPayments(paymentsResult.value);
        } else {
          console.error("Failed to load payments:", paymentsResult.reason);
          setError(
            paymentsResult.reason instanceof ApiError
              ? paymentsResult.reason.message
              : "Failed to load payment records."
          );
        }

        if (inquiriesResult.status === "fulfilled") {
          setInquiries(inquiriesResult.value);
        }
        if (tasksResult.status === "fulfilled") {
          setTasks(tasksResult.value);
        }
        if (franchisesResult.status === "fulfilled") {
          setFranchiseInquiries(franchisesResult.value);
        }
      } catch (err) {
        console.error(`Dashboard data load error for tab "overview":`, err);
        setError(`Failed to load data for tab "overview". Please try again.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, setError]);

  const recentPaymentsTop = useMemo(
    () => sortPaymentsNewestFirst(payments).slice(0, 2),
    [payments]
  );
  const recentPaymentsList = useMemo(
    () => sortPaymentsNewestFirst(payments).slice(0, 3),
    [payments]
  );

  if (loading) return <AdminTabLoader />;

  return (
    <div className={`${portalDashboardBodyClass} h-full overflow-hidden !pb-0`}>
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm lg:text-base font-bold text-slate-900 tracking-wide uppercase truncate">
            Simba Academy Workspace
          </h2>
          <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase truncate">
            Admin dashboard overview
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => goToTab("notifications")}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-xs hover:bg-slate-50 transition-all duration-300 relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-[#8AC926]/10 hover:border-[#8AC926]/40 transition-all duration-300"
          >
            <ExternalLink className="w-3 h-3 text-[#8AC926]" />
            View Live Site
          </a>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full min-w-0 max-w-full">
        {/* Three Main Metric Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch shrink-0">
              {/* Members overview — light green panel */}
              <div className="bg-[#F3FAEB] border border-green-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px]">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold tracking-wider text-[10px] uppercase text-green-800">
                      Registered Members
                    </span>
                    <div className="p-1.5 bg-green-100 rounded-xl border border-green-200">
                      <Users className="w-3.5 h-3.5 text-[#6B9E1A]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-green-600/80 tracking-widest block uppercase">
                        Active accounts
                      </span>
                      <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                        {stats.users} Active
                      </h3>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 border border-green-100 flex items-center -space-x-2">
                      {[
                        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=100&h=100&q=80",
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
                        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
                      ].map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`User Avatar ${idx + 1}`}
                          className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 object-cover"
                        />
                      ))}
                      <span className="text-[9px] font-bold text-slate-600 pl-3 leading-none uppercase tracking-wider">
                        Teachers &amp; Students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-green-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => goToTab("users")}
                    className="text-[9px] font-extrabold uppercase tracking-widest text-green-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    Manage Users <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[9px] font-extrabold text-slate-500">
                    Total: {stats.users}
                  </span>
                </div>
              </div>

              {/* Revenue / payments overview — light blue panel */}
              <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px]">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold tracking-wider text-[10px] uppercase text-blue-800">
                      Zoho Payments Revenue
                    </span>
                    <div className="p-1.5 bg-blue-100 rounded-xl border border-blue-200">
                      <CreditCard className="w-3.5 h-3.5 text-[#1364F1]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-blue-600/80 tracking-widest block uppercase">
                        Recent Payments
                      </span>
                      <h4 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                        Enrollment Payments
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      {recentPaymentsTop.length === 0 ? (
                        <div className="bg-white rounded-xl p-2.5 border border-blue-100 text-xs text-center text-slate-600 font-semibold">
                          No payments yet.
                        </div>
                      ) : (
                        recentPaymentsTop.map((p) => (
                          <RecentPaymentCard key={p.id} payment={p} theme="blue" compact />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-blue-100 pt-2 mt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => goToTab("payments")}
                    className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700 hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    Manage Payments <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[9px] font-extrabold text-slate-500 text-right leading-tight">
                    <span className="text-emerald-700">
                      ₹{stats.revenue.toLocaleString("en-IN")}
                    </span>
                    {" · "}
                    {payments.length} total record{payments.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Today's Schedule — light purple panel */}
              <div className="bg-[#F5F3FF] border border-violet-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px] md:col-span-2 lg:col-span-1">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold tracking-wider text-[10px] uppercase text-violet-800">
                      Today's Schedule
                    </span>
                    <div className="p-1.5 bg-violet-100 rounded-xl border border-violet-200">
                      <Calendar className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-violet-600/80 tracking-widest block uppercase">
                        Recent Tasks
                      </span>
                      <h4 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                        Teacher Assignments
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      {tasks.length === 0 ? (
                        <div className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs text-center text-slate-600 font-semibold">
                          No recent tasks assigned.
                        </div>
                      ) : (
                        [...tasks]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          )
                          .slice(0, 2)
                          .map((task) => (
                            <div
                              key={task.id}
                              className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold text-slate-800 text-2xs truncate max-w-[120px]">
                                  {task.title}
                                </span>
                                <span
                                  className={`px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase shrink-0 ${
                                    task.status === "APPROVED" || task.status === "COMPLETED"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : task.status === "PENDING"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {task.status}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold">
                                <span>To: {task.teacher?.name ?? "Staff"}</span>
                                {task.dueDate && (
                                  <span>
                                    Due:{" "}
                                    {new Date(task.dueDate).toLocaleDateString("en-IN", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-violet-100 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => goToTab("tasks")}
                    className="text-[9px] font-extrabold uppercase tracking-widest text-violet-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    Manage Tasks <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[9px] font-extrabold text-slate-500">
                    Total: {tasks.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Split workspace */}
          <div className={`${portalDashboardLowerGridClass} flex-1 min-h-0 overflow-hidden`}>
            <div
              id="recent-transactions"
              className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Recent Payments
                  </h3>
                  <p className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase mt-0.5">
                    Latest enrollment transactions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToTab("payments")}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  View all <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-0.5">
                {recentPaymentsList.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-xs text-center text-slate-600 font-semibold">
                    No payments recorded yet.
                  </div>
                ) : (
                  recentPaymentsList.map((p) => (
                    <RecentPaymentCard key={p.id} payment={p} theme="slate" />
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4 shrink-0">
                <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                  Academy Analytics
                </h4>
                <TrendingUp className="w-5 h-5 text-[#8AC926]" />
              </div>

              <div className="grid grid-cols-1 gap-2.5 flex-1">
                <div className="p-3 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Total Materials
                  </span>
                  <span className="text-xl font-bold text-slate-800 leading-none">
                    {stats?.materials ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Pending Review
                  </span>
                  <span className="text-xl font-bold text-slate-800 leading-none">
                    {stats?.pendingApprovals ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Unread Leads
                  </span>
                  <span className="text-xl font-bold text-slate-800 leading-none">
                    {stats?.unreadInquiries ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-[#8AC926]/5 border border-[#8AC926]/15 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Total General Enquiries
                  </span>
                  <span className="text-xl font-bold text-slate-800 leading-none">
                    {inquiries.length}
                  </span>
                </div>
                <div className="p-3 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Total Franchise Enquiries
                  </span>
                  <span className="text-xl font-bold text-slate-800 leading-none">
                    {franchiseInquiries.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    // </div>
  );
}
