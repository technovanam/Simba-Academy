import { Link } from "react-router";
import { Bell } from "lucide-react";
import { STUDENT_TAB_PATHS } from "../../lib/studentRoutes";
import { useStudentOutlet } from "./StudentOutletContext";

export function StudentNotificationBell({ showLabel = true }: { showLabel?: boolean }) {
  const { unreadNotificationCount } = useStudentOutlet();

  return (
    <Link
      to={STUDENT_TAB_PATHS.notifications}
      className="relative px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-[#FF9F1C]/10 hover:border-[#FF9F1C]/40 transition-all duration-300"
      aria-label={
        unreadNotificationCount > 0
          ? `Notifications, ${unreadNotificationCount} unread`
          : "Notifications"
      }
    >
      <span className="relative shrink-0">
        <Bell className="w-3.5 h-3.5 text-[#FF9F1C]" />
        {unreadNotificationCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 min-w-[0.875rem] h-[0.875rem] px-0.5 rounded-full text-[8px] font-extrabold flex items-center justify-center bg-rose-500 text-white border border-white">
            {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
          </span>
        ) : null}
      </span>
      {showLabel ? <span className="hidden sm:inline">Notifications</span> : null}
    </Link>
  );
}
