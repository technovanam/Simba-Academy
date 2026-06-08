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
import { Toast } from "../../components/Toast";
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
} from "lucide-react";
import { AdminOutletProvider } from "../../components/admin/AdminOutletContext";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Portal | Simba Academy" }];
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof Layers }[] = [
  { id: "overview", label: "Dashboard", icon: Layers },
  { id: "users", label: "Registered Users", icon: Users },
  { id: "teachers", label: "Teacher Management", icon: UserPlus },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "materials", label: "Approve Uploads", icon: FileCheck2 },
  { id: "tasks", label: "Assign Tasks", icon: Calendar },
  { id: "planner", label: "Lesson Planner", icon: Compass },
  { id: "books", label: "Story Library", icon: Book },
  { id: "inquiries", label: "General Enquiry", icon: Mail },
  { id: "reviews", label: "Parent Reviews", icon: Award },
  { id: "gallery", label: "Media Gallery", icon: Image },
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
    return (
      <div className="min-h-screen bg-[#F8FAF6] font-sans text-[#3E2723] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
        <p className="font-bold text-[#8C6D58]">Initializing Simba Admin Portal...</p>
      </div>
    );
  }

  if (!token || user?.role !== "ADMIN") {
    return null;
  }

  const sidebar = (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3.5 bg-slate-100/80 p-3 rounded-xl border border-slate-200/80">
          <img
            src="/favicon.png"
            alt="Simba Preschool"
            className="w-11 h-11 shrink-0 object-contain"
          />
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
              Simba Preschool
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Academy Director
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 relative group/btn ${
                  isActive
                    ? "bg-[#8AC926] text-white shadow-md shadow-[#8AC926]/10 lg:translate-x-1"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 lg:hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-3 py-1">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 ${isActive ? "text-white" : "text-[#8AC926]"}`}
                  />
                  <span>{tab.label}</span>
                </div>
                {isActive && (
                  <div className="w-0.5 h-3 bg-white rounded-lg absolute left-0 top-1/2 -translate-y-1/2" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs tracking-wider uppercase hover:bg-rose-100 hover:text-rose-800 transition-all duration-300"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <PortalSidebarLayout sidebar={sidebar} mobileTitle="Academy Director">
      <Toast message={error} variant="error" onDismiss={() => setError("")} />
      <Toast message={message} variant="success" onDismiss={() => setMessage("")} />

      <main className="flex-1 min-h-0 w-full min-w-0 max-w-7xl mx-auto flex flex-col portal-main-scroll overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 pb-6 lg:pb-8">
        <AdminOutletProvider value={{ token, user, setMessage, setError }}>
          <Outlet />
        </AdminOutletProvider>
      </main>
    </PortalSidebarLayout>
  );
}
