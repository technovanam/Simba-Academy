import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Bell, Book, Calendar, CheckCheck, Compass, Loader2 } from "lucide-react";
import { api, formatApiError, type TeacherNotification } from "../../../lib/api";
import { TEACHER_TAB_PATHS } from "../../../lib/teacherRoutes";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../../AdminPageShell";
import { AdminListEmpty, AdminRecordList, adminListRowClass } from "../../AdminListUi";
import { portalDashboardBodyClass } from "../../PortalPageShell";

interface TeacherNotificationsPageProps {
  token: string;
  onError: (message: string) => void;
  onRefresh: () => Promise<void>;
}

export function TeacherNotificationsPage({ token, onError, onRefresh }: TeacherNotificationsPageProps) {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const items = await api.getTeacherNotifications(token);
      setNotifications(items);
      await onRefresh();
    } catch (err) {
      onError(formatApiError(err, "Failed to load notifications. Restart the backend after running db:migrate-schema."));
    } finally {
      setLoading(false);
    }
  }, [token, onError, onRefresh]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markRead(notification: TeacherNotification) {
    if (!token || notification.isRead) return;
    setActionLoading(notification.id);
    try {
      const updated = await api.markTeacherNotificationRead(token, notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      await onRefresh();
    } catch {
      onError("Could not mark notification as read.");
    } finally {
      setActionLoading(null);
    }
  }

  async function markAllRead() {
    if (!token) return;
    setActionLoading("all");
    try {
      await api.markAllTeacherNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await onRefresh();
    } catch {
      onError("Could not mark all notifications as read.");
    } finally {
      setActionLoading(null);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
        <p className="font-bold text-slate-600">Loading notifications…</p>
      </div>
    );
  }

  return (
    <div className={portalDashboardBodyClass}>
      <AdminPageShell>
        <AdminPageHeader
          title="Notifications"
          description="Alerts for new tasks, story books, lesson plans, and task reviews."
          actions={
            unreadCount > 0 ? (
              <button
                type="button"
                disabled={actionLoading === "all"}
                onClick={markAllRead}
                className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap disabled:opacity-60"
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
        <AdminPageBody>
          {notifications.length === 0 ? (
            <AdminListEmpty message="No notifications yet. You'll be alerted here when admins add tasks, story books, or lesson plans." />
          ) : (
            <AdminRecordList>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${adminListRowClass} ${!n.isRead ? "bg-[#8AC926]/5 border-[#8AC926]/20" : ""}`}
                >
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                          n.isRead
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : "bg-[#8AC926]/15 text-[#5a8f18] border-[#8AC926]/30"
                        }`}
                      >
                        {n.isRead ? "Read" : "New"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-4xs font-extrabold uppercase border border-slate-200 shrink-0">
                        {n.type.replace(/_/g, " ")}
                      </span>
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
                        to={TEACHER_TAB_PATHS.library}
                        onClick={() => {
                          if (!n.isRead) void markRead(n);
                        }}
                        className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-[#8AC926]/10 border-[#8AC926]/30 text-[#5a8f18] hover:bg-[#8AC926]/20"
                      >
                        <Book className="w-3.5 h-3.5" />
                        Story library
                      </Link>
                    ) : null}
                    {n.taskId ? (
                      <Link
                        to={TEACHER_TAB_PATHS.tasks}
                        onClick={() => {
                          if (!n.isRead) void markRead(n);
                        }}
                        className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Tasks
                      </Link>
                    ) : null}
                    {n.lessonPlanId ? (
                      <Link
                        to={TEACHER_TAB_PATHS.planner}
                        onClick={() => {
                          if (!n.isRead) void markRead(n);
                        }}
                        className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        Lesson planner
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
            </AdminRecordList>
          )}
        </AdminPageBody>
      </AdminPageShell>
    </div>
  );
}
