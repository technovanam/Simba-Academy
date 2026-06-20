import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, Book, CheckCheck, Loader2 } from "lucide-react";
import { api, ApiError, formatApiError, type StudentNotification } from "../../../lib/api";
import { clearSession } from "../../../lib/auth";
import { STUDENT_TAB_PATHS } from "../../../lib/studentRoutes";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../../AdminPageShell";
import { AdminListEmpty, AdminRecordList, adminListRowStackClass } from "../../AdminListUi";
import { portalDashboardBodyClass } from "../../PortalPageShell";
import { useStudentOutlet } from "../StudentOutletContext";
import { StudentTabLoader } from "../StudentTabLoader";

export function StudentNotificationsPage() {
  const navigate = useNavigate();
  const { token, setError, refreshNotifications } = useStudentOutlet();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const items = await api.getStudentNotifications(token);
      setNotifications(items);
      await refreshNotifications();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate("/login");
      } else {
        setError(formatApiError(err, "Failed to load notifications. Restart the backend after running db:migrate-schema."));
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, setError, refreshNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markRead(notification: StudentNotification) {
    if (!token || notification.isRead) return;
    setActionLoading(notification.id);
    try {
      const updated = await api.markStudentNotificationRead(token, notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      await refreshNotifications();
    } catch {
      setError("Could not mark notification as read.");
    } finally {
      setActionLoading(null);
    }
  }

  async function markAllRead() {
    if (!token) return;
    setActionLoading("all");
    try {
      await api.markAllStudentNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshNotifications();
    } catch {
      setError("Could not mark all notifications as read.");
    } finally {
      setActionLoading(null);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <StudentTabLoader />;

  return (
    <div className={`${portalDashboardBodyClass} h-full overflow-visible`}>
      <AdminPageShell className="h-full flex flex-col min-h-0 overflow-visible">
        <AdminPageHeader
          title="Notifications"
          description="Alerts when new story books are added for your class."
          actions={
            unreadCount > 0 ? (
              <button
                type="button"
                disabled={actionLoading === "all"}
                onClick={markAllRead}
                className="px-4 py-2 rounded-xl bg-[#FF9F1C] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#e88f0a] transition shadow-md shadow-[#FF9F1C]/10 whitespace-nowrap disabled:opacity-60"
              >
                {actionLoading === "all" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark all read
              </button>
            ) : null
          }
        />
        <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {notifications.length === 0 ? (
            <AdminListEmpty message="No notifications yet. You'll be alerted here when new story books are published for your class." />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
              <div className="overflow-y-auto modern-scrollbar flex-1 min-h-0 px-2 sm:px-3 py-2.5 sm:py-3 space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`${adminListRowStackClass} ${!n.isRead ? "bg-[#FF9F1C]/5 border-[#FF9F1C]/20" : ""}`}
                  >
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                            n.isRead
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-[#FF9F1C]/15 text-[#c77a00] border-[#FF9F1C]/30"
                          }`}
                        >
                          {n.isRead ? "Read" : "New"}
                        </span>
                        {n.storyBook?.category ? (
                          <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200 shrink-0">
                            {n.storyBook.category}
                          </span>
                        ) : null}
                      </div>
                      <p className="font-bold text-sm text-slate-800">{n.title}</p>
                      <p className="text-2xs text-slate-600 font-medium">{n.message}</p>
                      <p className="text-[9px] text-slate-500 font-semibold">
                        {new Date(n.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {n.storyBookId ? (
                        <Link
                          to={STUDENT_TAB_PATHS.library}
                          onClick={() => {
                            if (!n.isRead) void markRead(n);
                          }}
                          className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-[#FF9F1C]/10 border-[#FF9F1C]/30 text-[#c77a00] hover:bg-[#FF9F1C]/20"
                        >
                          <Book className="w-3.5 h-3.5" />
                          Open library
                        </Link>
                      ) : null}
                      {!n.isRead ? (
                        <button
                          type="button"
                          disabled={actionLoading === n.id}
                          onClick={() => markRead(n)}
                          className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {actionLoading === n.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AdminPageBody>
      </AdminPageShell>
    </div>
  );
}
