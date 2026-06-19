import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Book, ChevronRight, GraduationCap, Shield, TrendingUp } from "lucide-react";
import { api, ApiError, type AuthUser, type Payment, type StoryBook } from "../../../lib/api";
import { clearSession, saveSession } from "../../../lib/auth";
import { PAYMENTS_ENABLED } from "../../../lib/constants";
import { STUDENT_TAB_PATHS } from "../../../lib/studentRoutes";
import { portalDashboardBodyClass, portalDashboardLowerGridClass } from "../../PortalPageShell";
import { RecentPaymentCard, sortPaymentsNewestFirst } from "../../RecentPaymentCard";
import { useStudentOutlet } from "../StudentOutletContext";
import { StudentNotificationBell } from "../StudentNotificationBell";
import { StudentTabLoader } from "../StudentTabLoader";

export function StudentOverviewPage() {
  const navigate = useNavigate();
  const { token, user, setError } = useStudentOutlet();

  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [profileResult, booksResult, paymentsResult] = await Promise.allSettled([
          api.profile(token),
          api.getPublicStoryBooks(token),
          api.getStudentPayments(token),
        ]);

        if (cancelled) return;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
          saveSession(token, profileResult.value);
        }

        if (booksResult.status === "fulfilled") {
          setBooks(booksResult.value);
        } else {
          throw booksResult.reason;
        }

        if (paymentsResult.status === "fulfilled") {
          setPayments(paymentsResult.value);
          if (PAYMENTS_ENABLED) {
            const successful = paymentsResult.value.filter((p) => p.status === "SUCCESS");
            if (successful.length === 0) {
              navigate("/student/checkout");
              return;
            }
          }
        }
      } catch (err) {
        console.error("Student dashboard load error:", err);
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          navigate("/login");
        } else {
          setError("Failed to load dashboard. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, setError]);

  const studentClass = profile?.studentClass ?? null;
  const displayName = profile?.name ?? user?.name ?? "Student";

  const classBooks = useMemo(
    () => books.filter((b) => !studentClass || b.category === studentClass),
    [books, studentClass]
  );

  const successfulPayments = useMemo(
    () => payments.filter((p) => p.status === "SUCCESS"),
    [payments]
  );

  const recentPaymentsTop = useMemo(
    () => sortPaymentsNewestFirst(successfulPayments).slice(0, 2),
    [successfulPayments]
  );

  const recentBooks = useMemo(
    () =>
      [...classBooks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [classBooks]
  );

  if (loading) return <StudentTabLoader />;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3 mb-5 shrink-0 select-none">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
            Simba Academy Student Portal
          </h2>
          <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase">
            Welcome back, {displayName}
          </p>
        </div>
        <StudentNotificationBell />
      </div>

      <div className={portalDashboardBodyClass}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch shrink-0">
          {/* Story books — orange panel */}
          <div className="bg-[#FFF7ED] border border-orange-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[190px] h-full shrink-0">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold tracking-wider text-[10px] uppercase text-[#c77a00]">
                  Story Library
                </span>
                <div className="p-1.5 bg-orange-100 rounded-xl border border-orange-200">
                  <Book className="w-3.5 h-3.5 text-[#FF9F1C]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#c77a00]/80 tracking-widest block uppercase">
                    Available for your class
                  </span>
                  <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                    {classBooks.length} Book{classBooks.length === 1 ? "" : "s"}
                  </h3>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-orange-100 flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white bg-[#FF9F1C]/15 flex items-center justify-center"
                      >
                        <Book className="w-3 h-3 text-[#FF9F1C]" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 leading-none uppercase tracking-wider">
                    {studentClass ?? "Class not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-orange-100 pt-2 mt-2">
              <Link
                to={STUDENT_TAB_PATHS.library}
                className="text-[9px] font-extrabold uppercase tracking-widest text-[#c77a00] hover:underline inline-flex items-center gap-0.5"
              >
                Browse Library <ChevronRight className="w-2.5 h-2.5" />
              </Link>
              <span className="text-[9px] font-extrabold text-slate-500">View &amp; print</span>
            </div>
          </div>

          {/* My class — violet panel */}
          <div className="bg-[#F5F3FF] border border-violet-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[190px] h-full shrink-0">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold tracking-wider text-[10px] uppercase text-violet-800">
                  My Class
                </span>
                <div className="p-1.5 bg-violet-100 rounded-xl border border-violet-200">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-violet-600/80 tracking-widest block uppercase">
                    Enrolled level
                  </span>
                  <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                    {studentClass ?? "—"}
                  </h3>
                </div>

                <div className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs">
                  <p className="font-bold text-slate-800 text-2xs truncate">{profile?.email ?? user?.email}</p>
                  <p className="text-[9px] text-slate-600 font-semibold mt-1">
                    Story books are filtered to your signup class.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-violet-100 pt-2 mt-2">
              <Link
                to={STUDENT_TAB_PATHS.settings}
                className="text-[9px] font-extrabold uppercase tracking-widest text-violet-700 hover:underline inline-flex items-center gap-0.5"
              >
                Edit profile <ChevronRight className="w-2.5 h-2.5" />
              </Link>
              <span className="text-[9px] font-extrabold text-slate-500">Student</span>
            </div>
          </div>
        </div>

        {/* Split workspace — matches admin layout, fills remaining viewport */}
        <div className={portalDashboardLowerGridClass}>
          <div className="lg:col-span-2 flex flex-col flex-1">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Recent Story Books
                  </h3>
                  <p className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase mt-0.5">
                    Latest books for {studentClass ?? "your class"}
                  </p>
                </div>
                <Link
                  to={STUDENT_TAB_PATHS.library}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-[#c77a00] hover:underline inline-flex items-center gap-0.5"
                >
                  View all <ChevronRight className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="space-y-1.5 flex-1">
                {recentBooks.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-xs text-center text-slate-600 font-semibold">
                    No story books for your class yet.
                  </div>
                ) : (
                  recentBooks.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-slate-800 text-2xs truncate max-w-[200px]">
                          {b.title}
                        </span>
                        <span className="px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase shrink-0 bg-[#FF9F1C]/10 text-[#c77a00] border border-[#FF9F1C]/20">
                          {b.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold">
                        <span className="truncate">Story book</span>
                        <span>
                          {new Date(b.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-[10px] uppercase text-slate-800 tracking-wider">
                    Learning Overview
                  </h4>
                  <TrendingUp className="w-4 h-4 text-[#FF9F1C]" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                      Story Books
                    </span>
                    <span className="text-lg font-bold text-[#FF9F1C] leading-none">{classBooks.length}</span>
                  </div>
                  <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                      Your Class
                    </span>
                    <span className="text-sm font-bold text-violet-600 leading-none truncate max-w-[100px]">
                      {studentClass ?? "—"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                      Account Status
                    </span>
                    <span className="text-sm font-bold text-emerald-600 leading-none">
                      {successfulPayments.length > 0 || !PAYMENTS_ENABLED ? "Active" : "Pending"}
                    </span>
                  </div>
                  <Link
                    to={STUDENT_TAB_PATHS.library}
                    className="p-2.5 bg-[#EEF4FF] border border-blue-100 rounded-xl flex items-center justify-between hover:bg-blue-50 transition"
                  >
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                      Open Story Books
                    </span>
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
