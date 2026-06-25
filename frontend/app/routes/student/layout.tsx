import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import type { Route } from "../+types/student.layout";
import {
  STUDENT_TAB_PATHS,
  studentTabFromSection,
  studentTabTitle,
  type StudentTab,
} from "../../lib/studentRoutes";
import { api, type AuthUser, type DriveItem } from "../../lib/api";
import { clearSession, getToken, getUser } from "../../lib/auth";
import { PortalToasts } from "../../components/Toast";
import { PortalSidebarLayout } from "../../components/PortalSidebarLayout";
import { StudentOutletProvider } from "../../components/student/StudentOutletContext";
import { FullPortalSkeleton } from "../../components/DashboardSkeleton";
import { Bell, Book, Compass, Loader2, LogOut, Settings, FolderOpen } from "lucide-react";

const NOTIFICATION_POLL_MS = 12_000;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Student Portal | Simba Academy" }];
}

const NAV_ITEMS: { id: StudentTab; label: string; icon: typeof Compass }[] = [
  { id: "overview", label: "Dashboard", icon: Compass },
  { id: "library", label: "Story Books", icon: Book },
  
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

function sectionFromPathname(pathname: string): string {
  const match = pathname.match(/^\/student\/([^/]+)/);
  return match?.[1] ?? "dashboard";
}

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const section = sectionFromPathname(location.pathname);
  const activeTab = studentTabFromSection(section);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationsInitializedRef = useRef(false);

  const [driveBooks, setDriveBooks] = useState<DriveItem[]>([]);
  const [driveBooksLoading, setDriveBooksLoading] = useState(false);
  const driveBooksFetchedRef = useRef(false);

  const loadDriveBooks = useCallback(async (authToken: string) => {
    if (driveBooksFetchedRef.current || driveBooksLoading) return;
    setDriveBooksLoading(true);
    try {
      const fetchAllFilesRecursively = async (folderId: string | null = null): Promise<DriveItem[]> => {
        const items = await api.browseDocuments(authToken, folderId);
        const files = items.filter(
          (item) => item.mimeType !== "application/vnd.google-apps.folder"
        );
        const folders = items.filter(
          (item) => item.mimeType === "application/vnd.google-apps.folder"
        );

        const subPromises = folders.map((folder) => fetchAllFilesRecursively(folder.id));
        const subResults = await Promise.all(subPromises);
        return [...files, ...subResults.flat()];
      };

      const fetched = await fetchAllFilesRecursively(null);
      setDriveBooks(fetched);
      driveBooksFetchedRef.current = true;
    } catch (err) {
      console.error("Failed to load drive books recursively:", err);
    } finally {
      setDriveBooksLoading(false);
    }
  }, [driveBooksLoading]);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const [countResult, listResult] = await Promise.allSettled([
        api.getStudentNotificationUnreadCount(token),
        api.getStudentNotifications(token),
      ]);

      if (countResult.status === "fulfilled") {
        setUnreadNotificationCount(countResult.value.count);
      }

      if (listResult.status === "fulfilled") {
        const unread = listResult.value.filter((n) => !n.isRead);

        if (notificationsInitializedRef.current) {
          for (const notification of unread) {
            if (!knownNotificationIdsRef.current.has(notification.id)) {
              setMessage(notification.message);
              knownNotificationIdsRef.current.add(notification.id);
            }
          }
        } else {
          unread.forEach((notification) => knownNotificationIdsRef.current.add(notification.id));
          notificationsInitializedRef.current = true;
        }
      }
    } catch {
      // Polling is best-effort; avoid spamming errors on transient failures.
    }
  }, [token]);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token || user?.role !== "STUDENT") {
      navigate("/login");
    }
  }, [mounted, token, user, navigate]);

  useEffect(() => {
    document.title = `${studentTabTitle(activeTab)} | Simba Academy`;
  }, [activeTab]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  useEffect(() => {
    if (!token || user?.role !== "STUDENT") return;

    void refreshNotifications();
    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, NOTIFICATION_POLL_MS);

    const onFocus = () => {
      void refreshNotifications();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, user?.role, refreshNotifications]);

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  if (!mounted) {
    return <FullPortalSkeleton />;
  }

  if (!token || user?.role !== "STUDENT") {
    return null;
  }

  const sidebar = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-2 -mx-2 py-1">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 bg-slate-100/80 p-2 rounded-xl border border-slate-200/80">
          <img loading="lazy" decoding="async" src="/Simba Logo 2025.pdf.png" alt="Simba Academy" className="w-15 h-8 shrink-0 object-contain" />
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{user?.name}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Student Portal
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-3 mb-2">
            MENU
          </span>
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const to = STUDENT_TAB_PATHS[tab.id];
            return (
              <Link
                key={tab.id}
                to={to}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 relative group/btn border ${
                  isActive
                    ? "bg-white text-slate-900 border-slate-200/80 shadow-sm lg:translate-x-1"
                    : "text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900 lg:hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-3 py-1">
                  <Icon
                    className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 text-[#FF9F1C]"
                  />
                  <span>{tab.label}</span>
                </div>
                {tab.id === "notifications" && unreadNotificationCount > 0 ? (
                  <span
                    className={`min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center ${
                      isActive ? "bg-white text-[#FF9F1C]" : "bg-[#FF9F1C] text-white"
                    }`}
                  >
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <PortalSidebarLayout sidebar={sidebar} mobileTitle={user?.name ?? "Student Portal"}>
      <PortalToasts
        error={error}
        message={message}
        onDismissError={() => setError("")}
        onDismissSuccess={() => setMessage("")}
      />

      <main className={`flex-1 min-h-0 w-full min-w-0 max-w-7xl mx-auto flex flex-col ${
        activeTab === "library" || activeTab === "notifications"
          ? "h-full overflow-hidden p-3 sm:p-4 lg:p-6"
          : "portal-main-scroll overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 pb-6 lg:pb-8 modern-scrollbar"
      }`}>
        <StudentOutletProvider
          value={{
            token,
            user,
            setMessage,
            setError,
            unreadNotificationCount,
            refreshNotifications,
            driveBooks,
            driveBooksLoading,
            loadDriveBooks,
          }}
        >
          <Outlet />
        </StudentOutletProvider>
      </main>
    </PortalSidebarLayout>
  );
}
