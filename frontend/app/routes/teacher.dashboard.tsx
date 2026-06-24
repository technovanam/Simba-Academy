import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/teacher.dashboard";
import {
  api,
  ApiError,
  type AuthUser,
  type Task,
  type StoryBook,
  type LessonPlan,
  type TaskAudit,
} from "../lib/api";
import { clearSession, getToken, getUser, saveSession } from "../lib/auth";
import { resolveStorageUrl } from "../lib/storage";
import { isActionBusy } from "../lib/actionGuard";
import { TEACHER_TAB_PATHS } from "../lib/teacherRoutes";
import { PortalToasts } from "../components/Toast";
import { PortalSidebarLayout } from "../components/PortalSidebarLayout";
import { DriveLibraryPanel } from "../components/DriveLibraryPanel";
import { LessonPlanViewerModal } from "../components/LessonPlanViewerModal";
import { ModalCloseButton } from "../components/ModalCloseButton";
import { TeacherSettingsPanel } from "../components/TeacherSettingsPanel";
import { TeacherNotificationBell } from "../components/teacher/TeacherNotificationBell";
import { TeacherNotificationsPage } from "../components/teacher/pages/TeacherNotificationsPage";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../components/AdminPageShell";
import {
  portalDashboardBodyClass,
  portalDashboardLowerGridClass,
} from "../components/PortalPageShell";
import { DashboardSkeleton, FullPortalSkeleton } from "../components/DashboardSkeleton";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  PillSelect,
  adminListContainerClass,
  adminListRowClass,
  useAdminPagination,
} from "../components/AdminListUi";
import {
  LogOut,
  Calendar,
  Book,
  Compass,
  Check,
  Loader2,
  Layers,
  ExternalLink,
  Eye,
  Clock,
  TrendingUp,
  ChevronRight,
  Upload,
  Settings,
  Bell,
  Users,
  Mail,
  RefreshCw,
  Plus,
  AlertCircle,
  History as HistoryIcon,
} from "lucide-react";

const NOTIFICATION_POLL_MS = 12_000;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Teacher Dashboard | Simba Academy" }];
}

type TabType = "overview" | "tasks" | "library" | "planner" | "notifications" | "settings" | "students";

const TEACHER_TAB_META: Record<TabType, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard", subtitle: "Your instructor workspace overview" },
  tasks: { title: "Assigned Tasks", subtitle: "Review and submit task proof" },
  library: { title: "Story Library", subtitle: "View and print storybooks" },
  planner: { title: "Lesson Planner", subtitle: "View lesson plans from admin" },
  notifications: { title: "Notifications", subtitle: "Tasks, story books, and lesson plan alerts" },
  settings: { title: "Account Settings", subtitle: "Profile and security preferences" },
  students: { title: "Students", subtitle: "Students registered in your class" },
};

export default function TeacherDashboardPage({ initialTab }: { initialTab?: TabType }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    api.profile(token)
      .then((fresh) => {
        setUser(fresh);
        saveSession(token, fresh);
      })
      .catch(console.error);
  }, [token]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>(initialTab ?? "overview");
  const showWorkspaceHeader = false;
  const useRoutedTabs = Boolean(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  function goToTab(tab: TabType) {
    if (useRoutedTabs) {
      navigate(TEACHER_TAB_PATHS[tab]);
      return;
    }
    setActiveTab(tab);
  }

  // Core Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [profile, setProfile] = useState<AuthUser[] | AuthUser | null>(null);
  const [classStudents, setClassStudents] = useState<AuthUser[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  // Loading & Feedback States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Search/Filter States
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [plannerSearch, setPlannerSearch] = useState("");
  const [lessonPlanViewer, setLessonPlanViewer] = useState<LessonPlan | null>(null);

  // Modal / Form States
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsModal, setTaskDetailsModal] = useState<Task | null>(null);
  const [auditHistoryTaskId, setAuditHistoryTaskId] = useState<string | null>(null);
  const [taskAuditHistory, setTaskAuditHistory] = useState<TaskAudit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [proofForm, setProofForm] = useState({ description: "" });
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [selectedStudentForBooks, setSelectedStudentForBooks] = useState<AuthUser | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationsInitializedRef = useRef(false);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const [countResult, listResult] = await Promise.allSettled([
        api.getTeacherNotificationUnreadCount(token),
        api.getTeacherNotifications(token),
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
      // Polling is best-effort.
    }
  }, [token]);

  // Auth guard (do not re-fetch tabs when profile/user object updates)
  useEffect(() => {
    if (!mounted) return;

    if (!token || user?.role !== "TEACHER") {
      navigate("/teacher/login");
      return;
    }

    if (user.mustChangePassword) {
      navigate("/teacher/change-password");
    }
  }, [mounted, token, user?.role, user?.mustChangePassword, navigate]);

  // Fetch data when the active tab changes
  useEffect(() => {
    if (!mounted || !token || user?.role !== "TEACHER" || user?.mustChangePassword) return;
    loadTabData(activeTab);
  }, [mounted, token, user?.role, user?.mustChangePassword, activeTab]);

  useEffect(() => {
    if (!token || user?.role !== "TEACHER") return;

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

  async function loadTabData(tab: TabType) {
    if (!token) return;
    if (tab === "notifications") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (tab === "overview") {
        const [allTasks, allPlans] = await Promise.all([
          api.getTeacherTasks(token),
          api.getTeacherLessonPlans(token),
        ]);
        setTasks(allTasks);
        setLessonPlans(allPlans);
      } else if (tab === "tasks") {
        const allTasks = await api.getTeacherTasks(token);
        setTasks(allTasks);
      } else if (tab === "library") {
        const allBooks = await api.getTeacherStoryBooks(token);
        setBooks(allBooks);
      } else if (tab === "planner") {
        const allPlans = await api.getTeacherLessonPlans(token);
        setLessonPlans(allPlans);
        setLessonPlanViewer(null);
      } else if (tab === "students") {
        const students = await api.getTeacherStudents(token);
        setClassStudents(students);
      } else if (tab === "settings") {
        const freshProfile = await api.profile(token);
        setProfile(freshProfile);
        saveSession(token, freshProfile);
      }
    } catch (err) {
      console.error(`Teacher dashboard data load error for tab "${tab}":`, err);
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate("/teacher/login");
      } else {
        setError(`Failed to load data for tab "${tab}". Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  const [refreshingStudentBooks, setRefreshingStudentBooks] = useState(false);
  const [activeBookTab, setActiveBookTab] = useState<"COMPLETED" | "READING" | "UNREAD">("COMPLETED");

  const handleOpenStudentProgress = async (student: AuthUser) => {
    setSelectedStudentForBooks(student);
    setActiveBookTab("COMPLETED");
    if (!token) return;
    setRefreshingStudentBooks(true);
    try {
      const students = await api.getTeacherStudents(token);
      setClassStudents(students);
      const freshStudent = students.find(s => s.id === student.id);
      if (freshStudent) {
        setSelectedStudentForBooks(freshStudent);
      }
    } catch (err) {
      console.error("Failed to refresh student progress:", err);
    } finally {
      setRefreshingStudentBooks(false);
    }
  };

  // ÔöÇÔöÇ TASK PROOF SUBMISSION ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  async function handleProofSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedTask || isActionBusy(actionLoading)) return;
    setActionLoading("proof-submit");
    setError("");
    setMessage("");

    if (!proofForm.description.trim() || proofForm.description.length < 5) {
      setError("Please provide a description of the proof (at least 5 characters).");
      setActionLoading(null);
      return;
    }
    if (!selectedProofFile) {
      setError("Please select a file/photo to upload as completion proof.");
      setActionLoading(null);
      return;
    }

    try {
      // 1. Upload the proof file to backend/uploads
      const uploadResponse = await api.uploadRaw(token, selectedProofFile);
      const proofUrl = uploadResponse.url;

      // 2. Submit the proof
      const updated = await api.submitTaskProof(token, selectedTask.id, {
        proofUrl,
        proofDesc: proofForm.description,
      });

      // Update state
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updated : t)));
      setMessage(`Task "${updated.title}" status marked as completed and sent for review!`);

      // Reset
      setProofForm({ description: "" });
      setSelectedProofFile(null);
      setShowProofModal(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Proof submission failed:", err);
      setError(err instanceof ApiError ? err.message : "Failed to submit task proof. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const [taskOccurrenceHistory, setTaskOccurrenceHistory] = useState<Task[]>([]);

  async function handleViewHistory(t: Task) {
    if (!token) return;
    setAuditHistoryTaskId(t.id);
    setLoadingAudit(true);
    setTaskAuditHistory([]);
    setTaskOccurrenceHistory([]);
    try {
      if (t.recurringTaskId) {
        const [occHistory, auditHistory] = await Promise.all([
          api.getRecurringTaskOccurrences(token, t.recurringTaskId),
          api.getTeacherTaskAuditHistory(token, t.id)
        ]);
        setTaskOccurrenceHistory(occHistory);
        setTaskAuditHistory(auditHistory);
      } else {
        const history = await api.getTeacherTaskAuditHistory(token, t.id);
        setTaskAuditHistory(history);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load history.");
    } finally {
      setLoadingAudit(false);
    }
  }

  // ÔöÇÔöÇ FILTERED DATA ARRAYS ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const groupedTasks = useMemo(() => {
    const map = new Map<string, Task>();
    const standalone: Task[] = [];
    for (const t of tasks) {
      if (t.recurringTaskId) {
        const existing = map.get(t.recurringTaskId);
        if (!existing || new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
          map.set(t.recurringTaskId, t);
        }
      } else {
        standalone.push(t);
      }
    }
    return [...Array.from(map.values()), ...standalone].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tasks]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const isToday = (dateStr: string | Date) => {
    const d = new Date(dateStr).getTime();
    return d >= todayStart.getTime() && d <= todayEnd.getTime();
  };

  const filteredGroupedTasks = groupedTasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          (t.description ?? "").toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatusFilter === "ALL" || t.status === taskStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayTasks = filteredGroupedTasks.filter(t => isToday(t.createdAt) || (t.dueDate && isToday(t.dueDate)));
  const oldTasks = filteredGroupedTasks.filter(t => !(isToday(t.createdAt) || (t.dueDate && isToday(t.dueDate))));

  const taskStatusOptions = [
    { id: "ALL" as const, label: "All Statuses" },
    { id: "PENDING" as const, label: "Pending" },
    { id: "COMPLETED" as const, label: "Submitted" },
    { id: "APPROVED" as const, label: "Approved" },
    { id: "REJECTED" as const, label: "Rejected" },
  ];

  const filteredLessonPlans = lessonPlans.filter((p) => {
    const q = plannerSearch.toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.course?.title ?? "").toLowerCase().includes(q)
    );
  });

  const plannerPagination = useAdminPagination(filteredLessonPlans, [plannerSearch]);

  const recentLessonPlans = [...lessonPlans]
    .sort((a, b) => {
      const aDate = a.planDate ? new Date(a.planDate).getTime() : new Date(a.createdAt).getTime();
      const bDate = b.planDate ? new Date(b.planDate).getTime() : new Date(b.createdAt).getTime();
      return bDate - aDate;
    })
    .slice(0, 2);

  // Calculate task counts
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const approvedTasksCount = tasks.filter((t) => t.status === "APPROVED").length;
  const rejectedTasksCount = tasks.filter((t) => t.status === "REJECTED").length;
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
  const upcomingTasks = [...tasks]
    .filter((t) => t.dueDate && (t.status === "PENDING" || t.status === "REJECTED"))
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 2);

  if (!mounted) {
    return <FullPortalSkeleton />;
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
            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">Simba Preschool</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Teacher Portal
            </p>
            {user?.name && (
              <p className="text-[9px] font-medium text-slate-400 truncate mt-0.5">{user.name}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-3 mb-2">MENU</span>
          {[
            { id: "overview", label: "Dashboard", icon: Layers },
            { id: "tasks", label: "Assigned Tasks", icon: Calendar },
            { id: "library", label: "Story Library", icon: Book },
            { id: "planner", label: "Lesson Planner", icon: Compass },
            { id: "students", label: "Students", icon: Users },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 relative group/btn border ${
                    isActive
                       ? "bg-white text-slate-900 border-slate-200/80 shadow-sm lg:translate-x-1"
                       : "text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900 lg:hover:translate-x-1"
                  }`}
              >
                <div className="flex items-center gap-3 py-1">
                  <Icon className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 text-[#8AC926]" />
                  <span>{tab.label}</span>
                </div>
                {tab.id === "notifications" && unreadNotificationCount > 0 ? (
                  <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center bg-rose-500 text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <PortalSidebarLayout sidebar={sidebar} mobileTitle="Teacher Portal">
      <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        
        <PortalToasts
          error={error}
          message={message}
          onDismissError={() => setError("")}
          onDismissSuccess={() => setMessage("")}
        />

        {/* Workspace header */}
        {showWorkspaceHeader ? (
          <header className="h-[4.25rem] border-b border-slate-100 bg-white px-4 lg:px-6 flex items-center justify-between shrink-0 z-20">
            <div className="min-w-0">
              <h1 className="text-sm lg:text-base font-bold text-slate-900 tracking-wide uppercase truncate">
                {TEACHER_TAB_META[activeTab].title}
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider mt-0.5 uppercase truncate">
                {TEACHER_TAB_META[activeTab].subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => goToTab("settings")}
                className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-xl border transition-all duration-200 bg-white border-slate-200 hover:border-[#8AC926]/40 hover:bg-slate-50"
                aria-label="Open account settings"
              >
                <div className="text-right hidden sm:block min-w-0">
                  <p className="font-bold text-xs text-slate-800 leading-tight truncate max-w-[140px]">
                    {user?.name ?? "Teacher"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Account settings</p>
                </div>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8AC926] to-[#78B020] p-0.5 shadow-sm">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[#8AC926] text-[10px] uppercase">
                      {user?.name ? user.name.substring(0, 2) : "TE"}
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            </div>
          </header>
        ) : null}

        <div className={`flex-1 min-h-0 bg-[#F8FAFC] focus:outline-none portal-main-scroll p-4 lg:p-6 pb-6 lg:pb-8 ${
          activeTab !== "settings" ? "h-full flex flex-col overflow-visible" : "overflow-y-auto modern-scrollbar"
        }`}>
          
          {loading && activeTab !== "settings" && activeTab !== "notifications" ? (
            <DashboardSkeleton />
          ) : activeTab === "overview" ? (
            <div className={portalDashboardBodyClass}>
              {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ OVERVIEW DASHBOARD ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
                  <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 tracking-wide uppercase truncate">
                        Simba Academy Teacher Portal
                      </h2>
                      <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase truncate">
                        Welcome back, {user?.name ?? "Teacher"}
                      </p>
                    </div>
                    <TeacherNotificationBell unreadCount={unreadNotificationCount} />
                  </div>

                  {/* Three summary panels (matches admin dashboard style) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch shrink-0">
                    {/* Assigned tasks ÔÇö light green */}
                    <div className="bg-[#F3FAEB] border border-green-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px]">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold tracking-wider text-[10px] uppercase text-green-800">Assigned Tasks</span>
                          <div className="p-1.5 bg-green-100 rounded-xl border border-green-200">
                            <Calendar className="w-3.5 h-3.5 text-[#6B9E1A]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-green-600/80 tracking-widest block uppercase">Awaiting proof</span>
                            <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                              {pendingTasksCount + rejectedTasksCount} Active
                            </h3>
                          </div>
                          <div className="space-y-1.5">
                            {recentTasks.length === 0 ? (
                              <div className="bg-white rounded-xl p-2.5 border border-green-100 text-xs text-center text-slate-600 font-semibold">
                                No tasks assigned yet.
                              </div>
                            ) : (
                              recentTasks.map((task) => (
                                <div key={task.id} className="bg-white rounded-xl p-2.5 border border-green-100 text-xs flex flex-col gap-1">
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="font-bold text-slate-800 text-2xs truncate max-w-[140px]">{task.title}</span>
                                    <span className={`px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase shrink-0 ${
                                      task.status === "APPROVED" || task.status === "COMPLETED"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : task.status === "PENDING"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  {task.dueDate && (
                                    <span className="text-[9px] text-slate-600 font-semibold">
                                      Due: {new Date(task.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-green-100 pt-2 mt-2">
                        <button
                          type="button"
                          onClick={() => goToTab("tasks")}
                          className="text-[9px] font-extrabold uppercase tracking-widest text-green-700 hover:underline inline-flex items-center gap-0.5"
                        >
                          View tasks <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] font-extrabold text-slate-500">Total: {totalTasksCount}</span>
                      </div>
                    </div>

                    {/* Lesson plans ÔÇö light blue */}
                    <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 text-slate-800 flex flex-col justify-between min-h-[190px]">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold tracking-wider text-[10px] uppercase text-blue-800">Lesson Planner</span>
                          <div className="p-1.5 bg-blue-100 rounded-xl border border-blue-200">
                            <Compass className="w-3.5 h-3.5 text-[#1364F1]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-blue-600/80 tracking-widest block uppercase">Published plans</span>
                            <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                              {lessonPlans.length} Plans
                            </h3>
                          </div>
                          <div className="space-y-1.5">
                            {recentLessonPlans.length === 0 ? (
                              <div className="bg-white rounded-xl p-2.5 border border-blue-100 text-xs text-center text-slate-600 font-semibold">
                                No lesson plans published yet.
                              </div>
                            ) : (
                              recentLessonPlans.map((plan) => (
                                <div key={plan.id} className="bg-white rounded-xl p-2.5 border border-blue-100 text-xs flex flex-col gap-1">
                                  <span className="font-bold text-slate-800 text-2xs truncate">{plan.title}</span>
                                  {plan.course?.title && (
                                    <span className="text-[9px] text-slate-600 font-semibold">{plan.course.title}</span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-blue-100 pt-2 mt-2 gap-2">
                        <button
                          type="button"
                          onClick={() => goToTab("planner")}
                          className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700 hover:underline inline-flex items-center gap-0.5 shrink-0"
                        >
                          View planner <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] font-extrabold text-slate-500 text-right">
                          From admin
                        </span>
                      </div>
                    </div>

                    {/* Upcoming deadlines ÔÇö light violet */}
                    <div className={`bg-[#F5F3FF] border border-violet-100 rounded-2xl p-5 text-slate-800 flex flex-col md:col-span-2 lg:col-span-1 ${
                      upcomingTasks.length === 0 ? "justify-between gap-2 self-start w-full min-h-[190px]" : "justify-between min-h-[190px]"
                    }`}>
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold tracking-wider text-[10px] uppercase text-violet-800">Upcoming Deadlines</span>
                          <div className="p-1.5 bg-violet-100 rounded-xl border border-violet-200">
                            <Compass className="w-3.5 h-3.5 text-violet-600" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-violet-600/80 tracking-widest block uppercase">Needs attention</span>
                            <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                              {upcomingTasks.length} Due soon
                            </h3>
                          </div>
                          <div className="space-y-1.5">
                            {upcomingTasks.length === 0 ? (
                              <div className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs text-center text-slate-600 font-semibold">
                                No upcoming deadlines.
                              </div>
                            ) : (
                              upcomingTasks.map((task) => (
                                <div key={task.id} className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs flex flex-col gap-1">
                                  <span className="font-bold text-slate-800 text-2xs truncate">{task.title}</span>
                                  <span className="text-[9px] text-slate-600 font-semibold">
                                    Due: {new Date(task.dueDate!).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-violet-100 pt-2 mt-2">
                        <button
                          type="button"
                          onClick={() => goToTab("planner")}
                          className="text-[9px] font-extrabold uppercase tracking-widest text-violet-700 hover:underline inline-flex items-center gap-0.5"
                        >
                          Open planner <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] font-extrabold text-slate-500">
                          {approvedTasksCount} approved
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Split workspace */}
                  <div className={portalDashboardLowerGridClass}>
                    <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1">
                      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Tasks</h3>
                          <p className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase mt-0.5">
                            Latest assignments in your queue
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => goToTab("tasks")}
                          className="text-[9px] font-extrabold uppercase tracking-widest text-green-700 hover:underline inline-flex items-center gap-0.5"
                        >
                          View all <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {tasks.length === 0 ? (
                          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-xs text-center text-slate-600 font-semibold">
                            No tasks assigned yet. Check back when admin assigns work.
                          </div>
                        ) : (
                          tasks.slice(0, 3).map((t) => (
                            <div
                              key={t.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0 space-y-1">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{t.title}</h4>
                                {t.dueDate && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Due {new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase border ${
                                  t.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  t.status === "COMPLETED" ? "bg-sky-50 text-sky-700 border-sky-200" :
                                  t.status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                  "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {t.status}
                                </span>
                                {(t.status === "PENDING" || t.status === "REJECTED") && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTask(t);
                                      setProofForm({ description: "" });
                                      setSelectedProofFile(null);
                                      setShowProofModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#8AC926] text-white font-bold text-[10px] hover:bg-[#78B020] transition"
                                  >
                                    Submit proof
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col flex-1">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
                        <h4 className="font-bold text-[10px] uppercase text-slate-800 tracking-wider">Workspace Summary</h4>
                        <TrendingUp className="w-4 h-4 text-[#8AC926]" />
                      </div>

                      <div className="grid grid-cols-1 gap-2 flex-1">
                        {[
                          { label: "Pending proof", value: pendingTasksCount, tone: "amber" },
                          { label: "Submitted", value: completedTasksCount, tone: "sky" },
                          { label: "Approved tasks", value: approvedTasksCount, tone: "emerald" },
                          { label: "Lesson plans", value: lessonPlans.length, tone: "green" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              item.tone === "amber" ? "bg-amber-50 border-amber-100" :
                              item.tone === "sky" ? "bg-sky-50 border-sky-100" :
                              item.tone === "emerald" ? "bg-emerald-50 border-emerald-100" :
                              item.tone === "green" ? "bg-[#8AC926]/5 border-[#8AC926]/15" :
                              "bg-[#FF9F1C]/5 border-[#FF9F1C]/15"
                            }`}
                          >
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">{item.label}</span>
                            <span className="text-lg font-bold text-slate-800 leading-none">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
              </div>
          ) : (
            <div className={`animate-fade-in ${
              activeTab !== "settings"
                ? "h-full flex flex-col min-h-0 overflow-visible"
                : "space-y-6"
            }`}>
              {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ ASSIGNED TASKS Tab ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
              {activeTab === "tasks" && (
                <AdminPageShell className="h-full flex flex-col min-h-0 overflow-visible">
                  <AdminPageHeader
                    title="Assigned Tasks"
                    description="View assigned tasks and upload completion proof for admin review."
                    actions={
                      <>
                        <AdminSearchInput
                          value={taskSearch}
                          onChange={setTaskSearch}
                          placeholder="Search tasks..."
                          ariaLabel="Search tasks"
                        />
                        <PillSelect
                          value={taskStatusFilter as (typeof taskStatusOptions)[number]["id"]}
                          options={taskStatusOptions}
                          onChange={setTaskStatusFilter}
                          ariaLabel="Filter by status"
                        />
                      </>
                    }
                  />
                  <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {filteredGroupedTasks.length === 0 ? (
                      <AdminListEmpty message="No assigned tasks matched your search or filters." />
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
                        <div className="flex-1 min-h-0 overflow-y-auto modern-scrollbar flex flex-col">
                          {/* Desktop/Tablet Table view */}
                          <div className="hidden md:block overflow-x-auto flex-1 min-h-0">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 font-semibold w-[45%]">Task Details</th>
                                  <th className="px-4 py-3 font-semibold w-[20%]">Status</th>
                                  <th className="px-4 py-3 font-semibold w-[20%]">Due Date</th>
                                  <th className="px-4 py-3 font-semibold text-right w-[15%]">Actions</th>
                                </tr>
                              </thead>
                              {[ 
                                { title: "Today's Tasks", items: todayTasks },
                                { title: "Previous Tasks", items: oldTasks }
                              ].map(group => group.items.length > 0 && (
                                <tbody key={group.title} className="divide-y divide-slate-100">
                                  <tr className="bg-slate-50/80">
                                    <td colSpan={4} className="px-4 py-2 text-xs font-black text-slate-600 uppercase tracking-widest border-b border-slate-200">{group.title}</td>
                                  </tr>
                                  {group.items.map((t) => {
                                  const isOverdue =
                                    t.dueDate &&
                                    new Date(t.dueDate).getTime() < Date.now() &&
                                    (t.status === "PENDING" || t.status === "REJECTED" || t.status === "SUBMITTED" || t.status === "RESUBMITTED");
                                  return (
                                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="px-4 py-3 align-middle w-[45%] min-w-0">
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-bold text-sm text-slate-800">{t.title}</span>
                                          {t.description && (
                                            <span className="text-3xs text-slate-400 font-medium shrink-0 mt-0.5 line-clamp-1 truncate max-w-[450px] whitespace-normal">{t.description}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 align-middle w-[20%]">
                                        <div className="flex flex-col gap-1.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                              className={`px-2 py-0.5 rounded text-4xs font-extrabold uppercase border shrink-0 ${
                                                t.status === "APPROVED"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  : t.status === "REJECTED"
                                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                                  : t.status === "RESUBMITTED"
                                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                                  : t.status === "UNDER_REVIEW"
                                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                                  : t.status === "SUBMITTED" || t.status === "COMPLETED"
                                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                                  : "bg-amber-50 text-amber-700 border-amber-200"
                                              }`}
                                            >
                                              {t.status === "COMPLETED" ? "Submitted" :
                                               t.status === "SUBMITTED" ? "Submitted" :
                                               t.status === "UNDER_REVIEW" ? "Under Review" :
                                               t.status === "RESUBMITTED" ? "Resubmitted" :
                                               t.status}
                                            </span>
                                            {t.proofUrl && (
                                              <a
                                                href={resolveStorageUrl(t.proofUrl)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition flex items-center justify-center shrink-0"
                                                title="View proof"
                                              >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                              </a>
                                            )}
                                          </div>
                                          {t.status === "REJECTED" && t.rejectionReason && (
                                            <div className="flex items-start gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1.5 max-w-[200px]">
                                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                                              <p className="text-[9px] font-semibold text-rose-700 leading-snug line-clamp-2">{t.rejectionReason}</p>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 align-middle w-[20%] text-xs font-semibold text-slate-700">
                                        {t.dueDate ? (
                                          <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-rose-600" : "text-slate-600"}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(t.dueDate).toLocaleDateString("en-IN", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                            {isOverdue && <span className="text-[9px] font-bold">(Overdue)</span>}
                                          </span>
                                        ) : (
                                          <span className="text-slate-450">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right align-middle w-[15%]">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setTaskDetailsModal(t)}
                                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
                                            title="View Task Details"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleViewHistory(t)}
                                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
                                            title="View Task History"
                                          >
                                            <HistoryIcon className="w-4 h-4 text-indigo-500" />
                                          </button>
                                          {(t.status === "PENDING" || t.status === "REJECTED" || t.status === "COMPLETED" || t.status === "SUBMITTED" || t.status === "RESUBMITTED") ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedTask(t);
                                                setProofForm({ description: t.proofDesc || "" });
                                                setSelectedProofFile(null);
                                                setShowProofModal(true);
                                              }}
                                              className={`w-28 h-[30px] flex items-center justify-center rounded-xl text-white font-sans font-bold text-2xs transition shadow-md whitespace-nowrap ${
                                                t.status === "REJECTED"
                                                  ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                                  : "bg-[#8AC926] hover:bg-[#78B020] shadow-[#8AC926]/10"
                                              }`}
                                            >
                                              {t.status === "REJECTED" ? "Re-submit" :
                                               t.status === "COMPLETED" || t.status === "SUBMITTED" || t.status === "RESUBMITTED" ? "Edit proof" :
                                               "Submit proof"}
                                            </button>
                                          ) : t.status === "APPROVED" ? (
                                            <span className="w-28 h-[30px] flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-2xs inline-flex items-center gap-1 select-none">
                                              ✓ Approved
                                            </span>
                                          ) : (
                                            <span className="w-28 h-[30px] flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-2xs select-none">
                                              Submitted
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                  })}
                                </tbody>
                              ))}
                            </table>
                          </div>

                          {/* Mobile Cards list view */}
                          <div className="md:hidden flex-1 overflow-y-auto modern-scrollbar">
                            {[ 
                              { title: "Today's Tasks", items: todayTasks },
                              { title: "Previous Tasks", items: oldTasks }
                            ].map(group => group.items.length > 0 && (
                              <div key={group.title} className="mb-2">
                                <div className="px-4 py-2 bg-slate-50/80 text-xs font-black text-slate-600 uppercase tracking-widest border-y border-slate-200">
                                  {group.title}
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {group.items.map((t) => {
                              const isOverdue =
                                t.dueDate &&
                                new Date(t.dueDate).getTime() < Date.now() &&
                                (t.status === "PENDING" || t.status === "REJECTED" || t.status === "SUBMITTED" || t.status === "RESUBMITTED");
                              return (
                                <div key={t.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/80 transition-colors">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-sm text-slate-800">{t.title}</span>
                                    {t.description && (
                                      <p className="text-xs text-slate-500 font-medium whitespace-pre-wrap">{t.description}</p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/60 pt-2.5">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                            t.status === "APPROVED"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : t.status === "REJECTED"
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : t.status === "RESUBMITTED"
                                              ? "bg-purple-50 text-purple-700 border-purple-200"
                                              : t.status === "UNDER_REVIEW"
                                              ? "bg-sky-50 text-sky-700 border-sky-200"
                                              : t.status === "SUBMITTED" || t.status === "COMPLETED"
                                              ? "bg-blue-50 text-blue-700 border-blue-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200"
                                          }`}
                                        >
                                          {t.status === "COMPLETED" ? "Submitted" :
                                           t.status === "SUBMITTED" ? "Submitted" :
                                           t.status === "UNDER_REVIEW" ? "Under Review" :
                                           t.status === "RESUBMITTED" ? "Resubmitted" :
                                           t.status}
                                        </span>
                                        {t.proofUrl && (
                                          <a
                                            href={resolveStorageUrl(t.proofUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition flex items-center justify-center shrink-0"
                                            title="View proof"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                      {t.status === "REJECTED" && t.rejectionReason && (
                                        <div className="flex items-start gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1 mt-1 max-w-[240px]">
                                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                                          <p className="text-[10px] font-semibold text-rose-700 leading-snug">{t.rejectionReason}</p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</span>
                                      {t.dueDate ? (
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isOverdue ? "text-rose-600" : "text-slate-600"}`}>
                                          <Calendar className="w-3.5 h-3.5" />
                                          {new Date(t.dueDate).toLocaleDateString("en-IN", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </span>
                                      ) : (
                                        <span className="text-slate-450">—</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-2 border-t border-slate-100/60 pt-2.5">
                                    <button
                                      type="button"
                                      onClick={() => setTaskDetailsModal(t)}
                                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm flex items-center justify-center"
                                      title="View Task Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleViewHistory(t)}
                                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm flex items-center justify-center"
                                      title="View Task History"
                                    >
                                      <HistoryIcon className="w-4 h-4 text-indigo-500" />
                                    </button>
                                    {(t.status === "PENDING" || t.status === "REJECTED" || t.status === "COMPLETED" || t.status === "SUBMITTED" || t.status === "RESUBMITTED") ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedTask(t);
                                          setProofForm({ description: t.proofDesc || "" });
                                          setSelectedProofFile(null);
                                          setShowProofModal(true);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-white font-sans font-bold text-xs transition shadow-md whitespace-nowrap ${
                                          t.status === "REJECTED"
                                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                            : "bg-[#8AC926] hover:bg-[#78B020] shadow-[#8AC926]/10"
                                        }`}
                                      >
                                        {t.status === "REJECTED" ? "Re-submit" :
                                         t.status === "COMPLETED" || t.status === "SUBMITTED" || t.status === "RESUBMITTED" ? "Edit proof" :
                                         "Submit proof"}
                                      </button>
                                    ) : t.status === "APPROVED" ? (
                                      <span className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                                        ✓ Approved
                                      </span>
                                    ) : (
                                      <span className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs select-none">
                                        Submitted
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </AdminPageBody>
                </AdminPageShell>
              )}

              {/* ────────────────── DRIVE LIBRARY Tab ────────────────── */}
              {activeTab === "library" && token && (
                <DriveLibraryPanel token={token} role="TEACHER" />
              )}

              {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ LESSON PLANNER Tab (view only) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
              {activeTab === "planner" && (
                <AdminPageShell className="h-full flex flex-col min-h-0 overflow-visible">
                  <AdminPageHeader
                    title="Lesson Planner"
                    description="View and print lesson plans published by administrators."
                    actions={
                      <AdminSearchInput
                        value={plannerSearch}
                        onChange={setPlannerSearch}
                        placeholder="Search lesson plans..."
                        ariaLabel="Search lesson plans"
                      />
                    }
                  />
                  <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {filteredLessonPlans.length === 0 ? (
                      <AdminListEmpty message="No published lesson plans matched your search." />
                    ) : (
                      <div className={`${adminListContainerClass} flex-1 min-h-0 flex flex-col justify-between`}>
                        <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto modern-scrollbar">
                          {plannerPagination.paginatedItems.map((plan) => (
                            <div key={plan.id} className={adminListRowClass}>
                              <div className="flex-1 min-w-[180px]">
                                <p className="font-bold text-sm text-slate-800 truncate max-w-md">{plan.title}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setLessonPlanViewer(plan)}
                                  className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <AdminListPagination
                          rangeStart={plannerPagination.rangeStart}
                          rangeEnd={plannerPagination.rangeEnd}
                          total={filteredLessonPlans.length}
                          safePage={plannerPagination.safePage}
                          totalPages={plannerPagination.totalPages}
                          pageNumbers={plannerPagination.pageNumbers}
                          onPageChange={plannerPagination.setCurrentPage}
                          itemLabel="plans"
                        />
                      </div>
                    )}
                  </AdminPageBody>

                  {lessonPlanViewer && (
                    <LessonPlanViewerModal
                      plan={lessonPlanViewer}
                      onClose={() => setLessonPlanViewer(null)}
                    />
                  )}
                </AdminPageShell>
              )}

              {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ NOTIFICATIONS Tab ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
              {activeTab === "notifications" && token && (
                <TeacherNotificationsPage
                  token={token}
                  onError={setError}
                  onRefresh={refreshNotifications}
                />
              )}

              {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ ACCOUNT SETTINGS Tab ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
              {activeTab === "settings" && token && (
                <TeacherSettingsPanel
                  token={token}
                  user={user}
                  profile={profile as AuthUser}
                  profileLoading={loading}
                  onNotify={setMessage}
                  onError={setError}
                  onProfileUpdated={(updated) => {
                    setUser(updated);
                    setProfile(updated);
                  }}
                />
              )}

              {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ STUDENTS Tab ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
              {activeTab === "students" && (
                <AdminPageShell className="h-full flex flex-col min-h-0 overflow-visible">
                  <AdminPageHeader
                    title={user?.studentClass ? `${user.studentClass} Students` : "Students"}
                    description={user?.studentClass ? `View students registered in the ${user.studentClass} class.` : "View your class students."}
                    actions={
                      <AdminSearchInput
                        value={studentSearch}
                        onChange={setStudentSearch}
                        placeholder="Search students"
                        ariaLabel="Search students"
                      />
                    }
                  />
                  <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {!user?.studentClass ? (
                      <AdminListEmpty message="You are not currently assigned to a class. Please contact the administrator to assign a class to your account." />
                    ) : classStudents.filter(s => 
                      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                      s.email.toLowerCase().includes(studentSearch.toLowerCase())
                    ).length === 0 ? (
                      <AdminListEmpty message={`No ${user?.studentClass} students found matching your search.`} />
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs flex-1 min-h-0 flex flex-col">
                        {/* Header Row */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                          <div className="col-span-5">Name</div>
                          <div className="col-span-4">Email</div>
                          <div className="col-span-3 text-right">Books</div>
                        </div>

                        {/* List container */}
                        <div className="divide-y divide-slate-100 flex-1 min-h-0 overflow-y-auto modern-scrollbar">
                          {classStudents
                            .filter(s => 
                              s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                              s.email.toLowerCase().includes(studentSearch.toLowerCase())
                            )
                            .map((student) => {
                              const totalBooks = student.books?.length || 0;
                              const readBooks = student.books?.filter(b => b.isRead || b.readingStatus === "READ").length || 0;
                              const readingBooks = student.books?.filter(b => b.readingStatus === "READING").length || 0;
                              
                              return (
                                <div 
                                  key={student.id} 
                                  onClick={() => handleOpenStudentProgress(student)}
                                  className="px-6 py-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4 hover:bg-slate-50/80 transition duration-200 cursor-pointer"
                                >
                                  {/* Name column (Col span 5) */}
                                  <div className="col-span-5 min-w-0">
                                    <p className="font-bold text-sm text-slate-800 truncate">{student.name}</p>
                                  </div>

                                  {/* Email column (Col span 4) */}
                                  <div className="col-span-4 min-w-0">
                                    <p className="text-2xs text-slate-600 font-semibold truncate">{student.email}</p>
                                    {student.phone && <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{student.phone}</p>}
                                  </div>

                                  {/* Books column (Col span 3) */}
                                  <div className="col-span-3 flex items-center justify-between md:justify-end shrink-0">
                                    <span className="md:hidden text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Books:</span>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-2xs font-bold border border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                                      <span>{totalBooks} Books</span>
                                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                      <span className="text-emerald-600">{readBooks} Read</span>
                                      {readingBooks > 0 && (
                                        <>
                                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                          <span className="text-amber-600">{readingBooks} Reading</span>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </AdminPageBody>
                </AdminPageShell>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ PROOF SUBMISSION MODAL ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
      {showProofModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative max-h-[90vh] flex flex-col">
            <ModalCloseButton
              onClick={() => {
                setShowProofModal(false);
                setSelectedTask(null);
                setSelectedProofFile(null);
              }}
              className="absolute top-4 right-4"
            />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10 shrink-0">Submit Task Completion Proof</h3>

            <form onSubmit={handleProofSubmit} noValidate className="space-y-4 text-xs flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto flex-1 pr-1 space-y-4 min-h-0">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                  <p className="font-bold text-slate-900 text-2xs">Active Task:</p>
                  <p className="font-bold text-[#8AC926] text-xs mt-0.5">{selectedTask.title}</p>
                  {selectedTask.description && <p className="text-3xs text-slate-600 mt-1 line-clamp-2">{selectedTask.description}</p>}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Proof Description / Comments</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your completion results (e.g. Completed worksheets uploaded, lesson photos attached...)"
                    value={proofForm.description}
                    onChange={(e) => setProofForm({ ...proofForm, description: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Attach File/Photo (Completion proof)</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-[#8AC926] transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 font-bold px-2 text-center break-all">
                          {selectedProofFile ? selectedProofFile.name : "Select or drag file here"}
                        </p>
                        <p className="text-3xs text-slate-400 mt-0.5">PDF, Word, or image up to 50MB</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        required
                        onChange={(e) => setSelectedProofFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={actionLoading === "proof-submit"}
                className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 flex items-center justify-center gap-1.5 shrink-0"
              >
                {actionLoading === "proof-submit" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Proof"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {selectedStudentForBooks && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative flex flex-col max-h-[85vh]">
            <ModalCloseButton
              onClick={() => setSelectedStudentForBooks(null)}
              className="absolute top-4 right-4"
            />
            
            <div className="mb-4 pr-10 flex justify-between items-start">
              <div>
                <h3 className="font-sans text-lg font-extrabold text-slate-900">
                  {selectedStudentForBooks.name}'s Reading Progress
                </h3>
                <p className="text-2xs font-semibold text-slate-500 mt-0.5">
                  {selectedStudentForBooks.email} {selectedStudentForBooks.phone ? `• ${selectedStudentForBooks.phone}` : ""} • {user?.studentClass} Class
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenStudentProgress(selectedStudentForBooks)}
                disabled={refreshingStudentBooks}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition disabled:opacity-50 shrink-0 mt-0.5"
                title="Refresh reading progress"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingStudentBooks ? "animate-spin text-[#8AC926]" : ""}`} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Summary Stats / Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBookTab("COMPLETED")}
                  className={`p-2.5 rounded-xl border-2 flex flex-col text-left transition-all duration-200 ${
                    activeBookTab === "COMPLETED"
                      ? "bg-emerald-50/80 border-emerald-500 shadow-sm"
                      : "bg-transparent border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="text-3xs font-extrabold text-emerald-800 uppercase tracking-wider">Completed (Read)</span>
                  <span className="text-base font-black text-emerald-700 mt-1">
                    {selectedStudentForBooks.books?.filter(b => b.isRead || b.readingStatus === "READ").length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBookTab("READING")}
                  className={`p-2.5 rounded-xl border-2 flex flex-col text-left transition-all duration-200 ${
                    activeBookTab === "READING"
                      ? "bg-amber-50/80 border-amber-500 shadow-sm"
                      : "bg-transparent border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="text-3xs font-extrabold text-amber-800 uppercase tracking-wider">Reading Now</span>
                  <span className="text-base font-black text-amber-700 mt-1">
                    {selectedStudentForBooks.books?.filter(b => b.readingStatus === "READING").length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBookTab("UNREAD")}
                  className={`p-2.5 rounded-xl border-2 flex flex-col text-left transition-all duration-200 ${
                    activeBookTab === "UNREAD"
                      ? "bg-slate-50 border-slate-400 shadow-sm"
                      : "bg-transparent border-slate-100 hover:border-slate-300 hover:bg-slate-50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="text-3xs font-extrabold text-slate-600 uppercase tracking-wider">Unread</span>
                  <span className="text-base font-black text-slate-700 mt-1">
                    {selectedStudentForBooks.books?.filter(b => b.readingStatus === "UNREAD" && !b.isRead).length || 0}
                  </span>
                </button>
              </div>

              {/* Books List */}
              {(!selectedStudentForBooks.books || selectedStudentForBooks.books.length === 0) ? (
                <div className="text-center py-8 text-slate-400 font-semibold text-xs">
                  No books assigned to this student.
                </div>
              ) : (() => {
                const readingNow = selectedStudentForBooks.books.filter(b => b.readingStatus === "READING");
                const completed = selectedStudentForBooks.books.filter(b => b.isRead || b.readingStatus === "READ");
                const unread = selectedStudentForBooks.books.filter(b => !b.isRead && b.readingStatus !== "READ" && b.readingStatus !== "READING");

                return (
                  <div className="space-y-4">
                    {/* 1. Currently Reading */}
                    {activeBookTab === "READING" && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          Currently Reading (Reading Now)
                        </h4>
                        {readingNow.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold text-xs bg-slate-50/5">
                            No books currently being read.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 border border-amber-200/80 rounded-xl overflow-hidden bg-amber-50/10">
                            {readingNow.map((b) => (
                              <div key={b.id} className="p-3 flex items-center justify-between gap-3 hover:bg-amber-50/20 transition">
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-800 truncate">{b.title}</p>
                                  {b.author && <p className="text-3xs text-slate-500 font-semibold truncate">by {b.author}</p>}
                                </div>
                                <span className="shrink-0 px-2 py-0.5 rounded-full text-4xs font-black uppercase border flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                                  <Clock className="w-2.5 h-2.5" /> Reading Now
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Completed Books */}
                    {activeBookTab === "COMPLETED" && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Completed Books</h4>
                        {completed.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold text-xs bg-slate-50/5">
                            No completed books yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                            {completed.map((b) => (
                              <div key={b.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-800 truncate">{b.title}</p>
                                  {b.author && <p className="text-3xs text-slate-500 font-semibold truncate">by {b.author}</p>}
                                </div>
                                <span className="shrink-0 px-2 py-0.5 rounded-full text-4xs font-black uppercase border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <Check className="w-2.5 h-2.5" /> Completed
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Not Completed */}
                    {activeBookTab === "UNREAD" && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Not Completed</h4>
                        {unread.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold text-xs bg-slate-50/5">
                            All assigned books are completed or in progress!
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                            {unread.map((b) => (
                              <div key={b.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-800 truncate">{b.title}</p>
                                  {b.author && <p className="text-3xs text-slate-500 font-semibold truncate">by {b.author}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForBooks(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {taskDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative max-h-[90vh] overflow-hidden flex flex-col">
            <ModalCloseButton
              onClick={() => setTaskDetailsModal(null)}
              className="absolute top-4 right-4"
            />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10 shrink-0">Task Details</h3>

            <div className="space-y-6 overflow-y-auto modern-scrollbar pr-2 flex-1">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 text-xs mb-1">Active Task</p>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-bold text-[#8AC926] text-sm">{taskDetailsModal.title}</span>
                  <span className={`px-2 py-0.5 rounded text-4xs font-extrabold uppercase border ${
                    taskDetailsModal.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : taskDetailsModal.status === "REJECTED"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : taskDetailsModal.status === "RESUBMITTED"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : taskDetailsModal.status === "UNDER_REVIEW"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : (taskDetailsModal.status === "COMPLETED" || taskDetailsModal.status === "SUBMITTED")
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {taskDetailsModal.status === "COMPLETED" || taskDetailsModal.status === "SUBMITTED" ? "Submitted" :
                     taskDetailsModal.status === "UNDER_REVIEW" ? "Under Review" :
                     taskDetailsModal.status === "RESUBMITTED" ? "Resubmitted" :
                     taskDetailsModal.status}
                  </span>
                </div>
                {taskDetailsModal.description && (
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{taskDetailsModal.description}</p>
                )}
                
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200/60">
                  {taskDetailsModal.dueDate && (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {new Date(taskDetailsModal.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {taskDetailsModal.proofSubmittedAt && (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted: {new Date(taskDetailsModal.proofSubmittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {taskDetailsModal.status === "REJECTED" && taskDetailsModal.rejectionReason && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-800 mb-1">Rejection Reason from Admin</p>
                    <p className="text-xs text-rose-700 whitespace-pre-wrap leading-relaxed">{taskDetailsModal.rejectionReason}</p>
                  </div>
                </div>
              )}
              
              {(taskDetailsModal.proofDesc || taskDetailsModal.proofUrl) && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Submission / Proof</h4>
                  {taskDetailsModal.proofDesc && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3">
                      <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap">{taskDetailsModal.proofDesc}</p>
                    </div>
                  )}
                  {taskDetailsModal.proofUrl && (
                    <a
                      href={resolveStorageUrl(taskDetailsModal.proofUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      View Uploaded Proof
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setTaskDetailsModal(null)}
                className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {auditHistoryTaskId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative max-h-[90vh] flex flex-col">
            <ModalCloseButton
              onClick={() => {
                setAuditHistoryTaskId(null);
                setTaskAuditHistory([]);
              }}
              className="absolute top-4 right-4"
            />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-indigo-500" /> Task Status History
            </h3>

            <div className="flex-1 overflow-y-auto modern-scrollbar pr-2 min-h-[200px]">
              {loadingAudit ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-500">Loading history...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {taskOccurrenceHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Task Occurrences</h4>
                      <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6 pb-4">
                        {taskOccurrenceHistory.map((occ) => (
                          <div key={occ.id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-300 shadow-sm" />
                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2 gap-4">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    Task Occurrence
                                  </p>
                                  <p className="text-2xs text-slate-500 font-medium mt-0.5">
                                    Assigned: {new Date(occ.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    occ.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    occ.status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    occ.status === "RESUBMITTED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                    occ.status === "UNDER_REVIEW" ? "bg-sky-50 text-sky-700 border-sky-200" :
                                    "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    {occ.status}
                                  </span>
                                </div>
                              </div>
                              {occ.status === "REJECTED" && occ.rejectionReason && (
                                <div className="mt-3 pt-3 border-t border-rose-100 bg-rose-50 rounded p-2">
                                  <p className="text-[10px] font-bold text-rose-800 mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Rejection Reason
                                  </p>
                                  <p className="text-xs text-rose-700 whitespace-pre-wrap">{occ.rejectionReason}</p>
                                </div>
                              )}
                              {occ.proofDesc && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{occ.proofDesc}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3">
                      {taskOccurrenceHistory.length > 0 ? "Audit History (Latest Occurrence)" : "Audit History"}
                    </h4>
                    {taskAuditHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm font-semibold text-slate-500">No history found for this task.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6 pb-4">
                  {taskAuditHistory.map((audit) => (
                    <div key={audit.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-300 shadow-sm" />
                      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {audit.action === "CREATED" ? "Task Assigned" : "Status Changed"}
                            </p>
                            <p className="text-2xs text-slate-500 font-medium mt-0.5">
                              {new Date(audit.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              {audit.changedByName ? `By ${audit.changedByName}` : "System / Admin"}
                            </p>
                            <div className="flex items-center gap-1.5 justify-end">
                              {audit.statusFrom && (
                                <>
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                    {audit.statusFrom}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                </>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                audit.statusTo === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                audit.statusTo === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                audit.statusTo === "RESUBMITTED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                audit.statusTo === "UNDER_REVIEW" ? "bg-sky-50 text-sky-700 border-sky-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {audit.statusTo}
                              </span>
                            </div>
                          </div>
                        </div>
                        {audit.comments && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{audit.comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAuditHistoryTaskId(null);
                  setTaskAuditHistory([]);
                }}
                className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </PortalSidebarLayout>
  );
}
