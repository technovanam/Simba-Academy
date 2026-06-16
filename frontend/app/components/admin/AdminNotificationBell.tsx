import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Check, Loader2 } from "lucide-react";
import { api, type AdminNotification } from "../../lib/api";

const NOTIFICATION_POLL_MS = 12_000;

export function AdminNotificationBell({ token }: { token: string }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificationData = async () => {
    if (!token) return;
    try {
      const [countRes, listRes] = await Promise.allSettled([
        api.getAdminNotificationUnreadCount(token),
        api.getAdminNotifications(token),
      ]);

      if (countRes.status === "fulfilled") {
        setUnreadCount(countRes.value.count);
      }
      if (listRes.status === "fulfilled") {
        setNotifications(listRes.value);
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotificationData();

    const interval = setInterval(() => {
      fetchNotificationData();
    }, NOTIFICATION_POLL_MS);

    const onFocus = () => {
      fetchNotificationData();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await api.markAdminNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setActionBusy(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (actionBusy || unreadCount === 0) return;
    setActionBusy(true);
    try {
      await api.markAllAdminNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setActionBusy(false);
    }
  };

  const handleNotificationClick = async (n: AdminNotification) => {
    setIsOpen(false);
    if (!n.isRead) {
      try {
        await api.markAdminNotificationRead(token, n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Failed to mark read on click:", err);
      }
    }
    navigate("/admin/notifications");
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-[#8AC926]/10 hover:border-[#8AC926]/40 transition-all duration-300 ${
          isOpen ? "bg-[#8AC926]/10 border-[#8AC926]/40" : ""
        }`}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <span className="relative shrink-0">
          <Bell className="w-3.5 h-3.5 text-[#8AC926]" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-[0.875rem] h-[0.875rem] px-0.5 rounded-full text-[8px] font-extrabold flex items-center justify-center bg-rose-500 text-white border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
        <span className="hidden sm:inline">Notifications</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[450px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200 select-none">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Recent Alerts
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionBusy}
                className="text-[10px] font-extrabold text-[#8AC926] hover:text-[#78B020] uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[350px] scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500">No notifications yet</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Actions in student/teacher panels will show here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const dateText = new Date(n.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 transition-colors duration-200 flex items-start gap-3 relative cursor-pointer hover:bg-slate-50/80 ${
                      n.isRead ? "bg-white" : "bg-[#8AC926]/5"
                    }`}
                  >
                    {/* Unread circle badge */}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#8AC926] shrink-0 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800 text-2xs truncate">
                          {n.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-medium shrink-0">
                          {dateText}
                        </span>
                      </div>
                      <p className="text-slate-600 font-semibold text-[11px] leading-relaxed mt-1 break-words">
                        {n.message}
                      </p>
                    </div>

                    {/* Single read checkmark button */}
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(n.id, e)}
                        disabled={actionBusy}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center select-none shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/admin/notifications");
              }}
              className="w-full text-center text-[10px] font-extrabold text-[#8AC926] hover:text-[#78B020] uppercase tracking-wider transition-colors duration-200 py-1"
            >
              View all alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
