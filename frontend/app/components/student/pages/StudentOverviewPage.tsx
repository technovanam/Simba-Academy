import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Book, ChevronRight, GraduationCap, TrendingUp } from "lucide-react";
import { api, ApiError, type AuthUser, type Payment, type DriveItem } from "../../../lib/api";
import { clearSession, saveSession } from "../../../lib/auth";
import { PAYMENTS_ENABLED } from "../../../lib/constants";
import { STUDENT_TAB_PATHS } from "../../../lib/studentRoutes";
import {
  portalDashboardOverviewClass,
  portalDashboardLowerGridShellClass,
  portalDashboardMainPanelClass,
  portalAnalyticsHeaderClass,
  portalAnalyticsLabelClass,
  portalAnalyticsListClass,
  portalAnalyticsPanelClass,
  portalAnalyticsRowClass,
  portalAnalyticsTitleClass,
  portalAnalyticsValueClass,
  portalHeroMetricClass,
} from "../../PortalPageShell";
import { useStudentOutlet } from "../StudentOutletContext";
import { StudentNotificationBell } from "../StudentNotificationBell";
import { StudentTabLoader } from "../StudentTabLoader";
import { DocumentViewerModal } from "../../DocumentViewerModal";

export function StudentOverviewPage() {
  const navigate = useNavigate();
  const { token, user, setError, driveBooks, driveBooksLoading, loadDriveBooks } = useStudentOutlet();

  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerFile, setViewerFile] = useState<DriveItem | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [profileResult, paymentsResult] = await Promise.allSettled([
          api.profile(token),
          api.getStudentPayments(token),
        ]);

        if (cancelled) return;

        let activeProfile = profile;
        if (profileResult.status === "fulfilled") {
          activeProfile = profileResult.value;
          setProfile(activeProfile);
          saveSession(token, activeProfile);
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

        // Load library preview in the background — do not block the dashboard.
        void loadDriveBooks(token);
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
  }, [token, navigate, setError, loadDriveBooks]);

  const studentClass = profile?.studentClass ?? null;
  const displayName = profile?.name ?? user?.name ?? "Student";
  const classBooks = driveBooks;

  const successfulPayments = useMemo(
    () => payments.filter((p) => p.status === "SUCCESS"),
    [payments]
  );

  const recentBooks = useMemo(
    () =>
      [...driveBooks]
        .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
        .slice(0, 3),
    [driveBooks]
  );

  const accountActive = successfulPayments.length > 0 || !PAYMENTS_ENABLED;

  // Show the dashboard as soon as profile is ready; library fills in asynchronously.
  const isDataLoading = loading && !profile;

  if (isDataLoading) return <StudentTabLoader />;

  return (
    <div className={portalDashboardOverviewClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm lg:text-base font-bold text-slate-900 tracking-wide uppercase truncate">
            Simba Preschool Student Portal
          </h2>
          <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase truncate">
            Welcome back, {displayName}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StudentNotificationBell />
        </div>
      </div>

      {/* Summary panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch shrink-0">
        {/* Story library — orange */}
        <div className="bg-[#FFF7ED] border border-orange-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px]">
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
                <h3 className={portalHeroMetricClass}>
                  {driveBooksLoading && classBooks.length === 0
                    ? "…"
                    : `${classBooks.length}${classBooks.length >= 40 ? "+" : ""} Book${classBooks.length === 1 ? "" : "s"}`}
                </h3>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-orange-100 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(3, classBooks.length) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white bg-[#FF9F1C]/15 flex items-center justify-center"
                    >
                      <Book className="w-3 h-3 text-[#FF9F1C]" />
                    </div>
                  ))}
                  {classBooks.length === 0 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                      <Book className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
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
              Browse library <ChevronRight className="w-2.5 h-2.5" />
            </Link>
            <span className="text-[9px] font-extrabold text-slate-500">
              Total: {classBooks.length}
            </span>
          </div>
        </div>

        {/* My class — violet */}
        <div className="bg-[#F5F3FF] border border-violet-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px]">
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
                <h3 className={portalHeroMetricClass}>{studentClass ?? "—"}</h3>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs">
                <p className="font-bold text-slate-800 text-2xs truncate">
                  {profile?.email ?? user?.email}
                </p>
                <p className="text-[9px] text-slate-600 font-semibold mt-1">
                  Story books are filtered to your signup class.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-violet-100 pt-2 mt-2 gap-2">
            <Link
              to={STUDENT_TAB_PATHS.settings}
              className="text-[9px] font-extrabold uppercase tracking-widest text-violet-700 hover:underline inline-flex items-center gap-0.5 shrink-0"
            >
              Edit profile <ChevronRight className="w-2.5 h-2.5" />
            </Link>
            <span className="text-[9px] font-extrabold text-slate-500 text-right">Student</span>
          </div>
        </div>
      </div>

      {/* Split workspace */}
      <div className={portalDashboardLowerGridShellClass}>
        <div className={portalDashboardMainPanelClass}>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4 shrink-0">
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

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            {driveBooksLoading && recentBooks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[8rem]">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-xs text-center text-slate-600 font-semibold w-full">
                  Loading recent books…
                </div>
              </div>
            ) : recentBooks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[8rem]">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-xs text-center text-slate-600 font-semibold w-full">
                  No story books for your class yet.
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-0.5">
                {recentBooks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setViewerFile(b)}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-left hover:bg-slate-100/80 transition-colors w-full cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 text-xs truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Story book</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={portalAnalyticsPanelClass}>
          <div className={portalAnalyticsHeaderClass}>
            <h4 className={portalAnalyticsTitleClass}>Learning Overview</h4>
            <TrendingUp className="w-4 h-4 text-[#FF9F1C] shrink-0" />
          </div>

          <div className={portalAnalyticsListClass}>
            <div className={`${portalAnalyticsRowClass} bg-[#FF9F1C]/5 border-[#FF9F1C]/15`}>
              <span className={portalAnalyticsLabelClass}>Story Books</span>
              <span className={portalAnalyticsValueClass}>{classBooks.length}</span>
            </div>
            <div className={`${portalAnalyticsRowClass} bg-violet-50 border-violet-100`}>
              <span className={portalAnalyticsLabelClass}>Your Class</span>
              <span className={`${portalAnalyticsValueClass} truncate max-w-[120px]`}>
                {studentClass ?? "—"}
              </span>
            </div>
            <div className={`${portalAnalyticsRowClass} bg-emerald-50 border-emerald-100`}>
              <span className={portalAnalyticsLabelClass}>Account Status</span>
              <span className={portalAnalyticsValueClass}>
                {accountActive ? "Active" : "Pending"}
              </span>
            </div>
            <Link
              to={STUDENT_TAB_PATHS.library}
              className={`${portalAnalyticsRowClass} bg-[#EEF4FF] border-blue-100 hover:bg-blue-50 transition`}
            >
              <span className={portalAnalyticsLabelClass}>Open Story Books</span>
              <ChevronRight className="w-4 h-4 text-[#FF9F1C] shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {viewerFile && token && (
        <DocumentViewerModal
          fileId={viewerFile.id}
          title={viewerFile.name}
          token={token}
          role="STUDENT"
          mimeType={viewerFile.mimeType}
          onClose={() => setViewerFile(null)}
          accent="orange"
        />
      )}
    </div>
  );
}
