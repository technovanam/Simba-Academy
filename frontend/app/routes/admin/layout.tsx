import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import type { Route } from "../+types/admin.layout";
import {
  ADMIN_LEGACY_SECTION_REDIRECTS,
  ADMIN_TAB_PATHS,
  adminTabFromSection,
  adminTabTitle,
  type AdminTab,
} from "../../lib/adminRoutes";
import { type AuthUser } from "../../lib/api";
import { clearSession, getToken, getUser } from "../../lib/auth";
import { PortalToasts } from "../../components/Toast";
import { PortalSidebarLayout } from "../../components/PortalSidebarLayout";
import {
  Award,
  Book,
  Calendar,
  Compass,
  CreditCard,
  FileCheck2,
  Image,
  Layers,
  Loader2,
  LogOut,
  Mail,
  UserPlus,
  Users,
  Settings,
  FolderOpen,
  Bell,
} from "lucide-react";
import { AdminOutletProvider } from "../../components/admin/AdminOutletContext";
import { FullPortalSkeleton } from "../../components/DashboardSkeleton";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Portal | Simba Academy" }];
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof Layers }[] = [
  { id: "overview", label: "Dashboard", icon: Layers },
  { id: "users", label: "Student Management", icon: Users },
  { id: "teachers", label: "Teacher Management", icon: UserPlus },
  { id: "books", label: "Story Library", icon: Book },
  { id: "planner", label: "Lesson Planner", icon: Compass },
  { id: "tasks", label: "Assign Tasks", icon: Calendar },  
  { id: "materials", label: "Approve Uploads", icon: FileCheck2 },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "inquiries", label: "General Enquiry", icon: Mail },
  { id: "reviews", label: "Parent Reviews", icon: Award },
  { id: "gallery", label: "Media Gallery", icon: Image },
  { id: "settings", label: "Settings", icon: Settings },
];

function sectionFromPathname(pathname: string): string {
  const match = pathname.match(/^\/admin\/([^/]+)/);
  return match?.[1] ?? "dashboard";
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const section = sectionFromPathname(location.pathname);
  const activeTab = adminTabFromSection(section);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token || user?.role !== "ADMIN") {
      navigate("/admin/login");
    }
  }, [mounted, token, user, navigate]);

  useEffect(() => {
    if (section in ADMIN_LEGACY_SECTION_REDIRECTS) {
      navigate(ADMIN_LEGACY_SECTION_REDIRECTS[section], { replace: true });
    }
  }, [section, navigate]);

  useEffect(() => {
    document.title = `${adminTabTitle(activeTab)} | Simba Academy`;
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

  function handleLogout() {
    clearSession();
    navigate("/admin/login");
  }

  if (!mounted) {
    return <FullPortalSkeleton />;
  }

  if (!token || user?.role !== "ADMIN") {
    return null;
  }

  const sidebar = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-2 -mx-2 py-1">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 bg-slate-100/80 p-2 rounded-xl border border-slate-200/80">
          <img
            src="/Simba Logo 2025.pdf.png"
            alt="Simba Preschool"
            className="w-15 h-8 shrink-0 object-contain"
          />
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
              Simba Preschool
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Admin
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
            const to = ADMIN_TAB_PATHS[tab.id];
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
                    className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 text-[#8AC926]"
                  />
                  <span>{tab.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <PortalSidebarLayout sidebar={sidebar} mobileTitle="Admin">
      <PortalToasts
        error={error}
        message={message}
        onDismissError={() => setError("")}
        onDismissSuccess={() => setMessage("")}
      />

      <main className={`flex-1 min-h-0 w-full min-w-0 max-w-7xl mx-auto flex flex-col ${
        activeTab === "overview" || activeTab === "users" || activeTab === "teachers" || activeTab === "books" || activeTab === "planner" || activeTab === "tasks" || activeTab === "gallery" || activeTab === "payments" || activeTab === "materials" || activeTab === "inquiries" || activeTab === "documents" || activeTab === "settings" || activeTab === "notifications" ? "h-full overflow-hidden pb-4 lg:pb-4" : "portal-main-scroll overflow-y-auto overflow-x-hidden pb-6 lg:pb-8"
      } p-3 sm:p-4 lg:p-6`}>
        <AdminOutletProvider value={{ token, user, setUser, setMessage, setError }}>
          <Outlet />
        </AdminOutletProvider>
      </main>
    </PortalSidebarLayout>
  );
}
