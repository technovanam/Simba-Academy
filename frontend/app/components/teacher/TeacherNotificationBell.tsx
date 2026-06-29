import { Link } from "react-router";
import { Bell } from "lucide-react";
import { TEACHER_TAB_PATHS } from "../../lib/teacherRoutes";

export function TeacherNotificationBell({
  unreadCount,
  showLabel = true,
}: {
  unreadCount: number;
  showLabel?: boolean;
}) {
  return (
    <Link
      to={TEACHER_TAB_PATHS.notifications}
      className="relative px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
    >
      <span className="relative shrink-0">
        <Bell className="w-3.5 h-3.5 text-blue-600" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 min-w-[0.875rem] h-[0.875rem] px-0.5 rounded-full text-[8px] font-extrabold flex items-center justify-center bg-rose-500 text-white border border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </span>
      {showLabel ? <span className="hidden sm:inline">Notifications</span> : null}
    </Link>
  );
}
