import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/teacher.dashboard";
import {
  api,
  ApiError,
  type AuthUser,
  type Course,
  type Material,
  type Task,
  type StoryBook,
} from "../lib/api";
import { clearSession, getToken, getUser } from "../lib/auth";
import { StoryBookActions } from "../components/StoryBookActions";
import { PortalSelect } from "../components/PortalSelect";
import { ModalCloseButton } from "../components/ModalCloseButton";
import {
  BookOpen,
  LogOut,
  Plus,
  Trash2,
  Calendar,
  Book,
  Compass,
  Search,
  Filter,
  Check,
  Loader2,
  Layers,
  FileCheck2,
  ExternalLink,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Activity,
  Upload,
  FileText,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Teacher Dashboard | Simba Academy" }];
}

type TabType = "overview" | "tasks" | "materials" | "library" | "planner";

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setToken(getToken());
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Core Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [books, setBooks] = useState<StoryBook[]>([]);

  // Loading & Feedback States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorClosing, setErrorClosing] = useState(false);
  const [messageClosing, setMessageClosing] = useState(false);

  const triggerErrorClose = () => {
    setErrorClosing(true);
    setTimeout(() => {
      setError("");
      setErrorClosing(false);
    }, 300);
  };

  const triggerMessageClose = () => {
    setMessageClosing(true);
    setTimeout(() => {
      setMessage("");
      setMessageClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (error || message) {
      const dismissTimer = setTimeout(() => {
        if (error) triggerErrorClose();
        if (message) triggerMessageClose();
      }, 3000);

      const handleGlobalClick = () => {
        if (error) triggerErrorClose();
        if (message) triggerMessageClose();
      };
      
      const registerTimer = setTimeout(() => {
        window.addEventListener("click", handleGlobalClick);
      }, 100);

      return () => {
        clearTimeout(dismissTimer);
        clearTimeout(registerTimer);
        window.removeEventListener("click", handleGlobalClick);
      };
    }
  }, [error, message]);

  // Search/Filter States
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialCourseFilter, setMaterialCourseFilter] = useState("ALL");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("ALL");

  // Modal / Form States
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofForm, setProofForm] = useState({ description: "" });
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);

  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({ title: "", description: "", type: "PDF" as "PDF" | "PPT", courseId: "" });
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);

  // Fetch data specifically for the active tab
  useEffect(() => {
    if (!mounted) return;

    if (!token || user?.role !== "TEACHER") {
      navigate("/teacher/login");
      return;
    }

    if (user.mustChangePassword) {
      navigate("/teacher/change-password");
      return;
    }

    loadTabData(activeTab);
  }, [mounted, token, user, navigate, activeTab]);

  async function loadTabData(tab: TabType) {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      // Always load courses for dropdown selection
      const allCourses = await api.getCourses();
      setCourses(allCourses);

      if (tab === "overview") {
        const [allTasks, allMaterials] = await Promise.all([
          api.getTeacherTasks(token),
          api.getTeacherMaterials(token),
        ]);
        setTasks(allTasks);
        setMaterials(allMaterials);
      } else if (tab === "tasks") {
        const allTasks = await api.getTeacherTasks(token);
        setTasks(allTasks);
      } else if (tab === "materials") {
        const allMaterials = await api.getTeacherMaterials(token);
        setMaterials(allMaterials);
      } else if (tab === "library") {
        const allBooks = await api.getTeacherStoryBooks(token);
        setBooks(allBooks);
      } else if (tab === "planner") {
        const [allTasks, allMaterials] = await Promise.all([
          api.getTeacherTasks(token),
          api.getTeacherMaterials(token),
        ]);
        setTasks(allTasks);
        setMaterials(allMaterials);
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

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // ── TASK PROOF SUBMISSION ─────────────────────────────────────────────
  async function handleProofSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedTask) return;
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
      // 1. Upload the proof file to WebDAV
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

  // ── MATERIAL UPLOAD ───────────────────────────────────────────────────
  async function handleMaterialUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setActionLoading("material-save");
    setError("");
    setMessage("");

    if (!materialForm.title.trim()) {
      setError("Please enter the material title.");
      setActionLoading(null);
      return;
    }
    if (!materialForm.courseId) {
      setError("Please select a course to link.");
      setActionLoading(null);
      return;
    }
    if (!selectedMaterialFile) {
      setError("Please select a PDF/PPT file to upload.");
      setActionLoading(null);
      return;
    }

    try {
      const created = await api.uploadMaterial(token, selectedMaterialFile, {
        title: materialForm.title,
        description: materialForm.description || undefined,
        type: materialForm.type,
        courseId: materialForm.courseId,
      });

      setMaterials((prev) => [created, ...prev]);
      setMessage(`Learning material "${created.title}" successfully uploaded and sent to admin for approval!`);

      setMaterialForm({ title: "", description: "", type: "PDF", courseId: courses[0]?.id ?? "" });
      setSelectedMaterialFile(null);
      setShowMaterialForm(false);
    } catch (err) {
      console.error("Material upload failed:", err);
      setError(err instanceof ApiError ? err.message : "Failed to upload course material. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── FILTERED DATA ARRAYS ──────────────────────────────────────────────
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          (t.description ?? "").toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatusFilter === "ALL" || t.status === taskStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
                          (m.description ?? "").toLowerCase().includes(materialSearch.toLowerCase());
    const matchesCourse = materialCourseFilter === "ALL" || m.courseId === materialCourseFilter;
    return matchesSearch && matchesCourse;
  });

  // Calculate task counts
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const approvedTasksCount = tasks.filter((t) => t.status === "APPROVED").length;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] font-sans text-[#3E2723] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
        <p className="font-bold text-[#8C6D58]">Initializing Simba Teacher Portal...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans text-sm text-slate-900 flex flex-col lg:flex-row overflow-hidden">
      
      {/* ── LEFT INTEGRATED SIDEBAR ── */}
      <aside className="w-full lg:w-72 lg:h-screen lg:sticky lg:top-0 bg-[#F1F5F9] border-r border-slate-200 py-6 px-5 flex flex-col shrink-0 select-none overflow-y-auto justify-between z-30 shadow-2xl">
        <div className="space-y-6">
          {/* User Profile Block (Squared profile) */}
          <div className="flex items-center gap-3.5 bg-slate-100 p-3 rounded-xl border border-slate-100">
            <img
              src="/favicon.png"
              alt="Simba Preschool"
              className="w-10 h-10 shrink-0 object-contain"
            />
            <div className="flex flex-col min-w-0">
              <h3 className="text-xs font-bold text-slate-800 truncate">{user?.name ?? "Simba Teacher"}</h3>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Academic Instructor</p>
            </div>
          </div>

          {/* Menu Navigation System */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-3 mb-2">WORKSPACE</span>
            {[
              { id: "overview", label: "Dashboard", icon: Layers },
              { id: "tasks", label: "Assigned Tasks", icon: Calendar },
              { id: "materials", label: "Course Materials", icon: BookOpen },
              { id: "library", label: "Story Library", icon: Book },
              { id: "planner", label: "Lesson Planner", icon: Compass },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 relative group/btn ${
                    isActive
                      ? "bg-[#8AC926] text-white shadow-md shadow-[#8AC926]/10 translate-x-1"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center gap-3 py-1">
                    <Icon className={`w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 ${isActive ? "text-white" : "text-[#8AC926]"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom utility */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-4">
          <div className="text-[10px] text-slate-500 font-bold px-3">
            <p>Simba Academy Portal</p>
            <p className="text-[9px] text-[#8AC926] mt-0.5">Role: {user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-bold text-xs tracking-wider text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN WORKSPACE ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Floating Notification Alerts */}
        {error && (
          <div className={`fixed top-6 right-6 z-50 max-w-sm w-full bg-white/90 backdrop-blur-lg border border-red-100 rounded-2xl shadow-xl overflow-hidden flex text-left ${errorClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="w-2 bg-red-500 flex-shrink-0" />
            <div className="p-4 flex gap-3.5 items-start w-full">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 leading-tight">Error</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
              </div>
              <ModalCloseButton size="sm" className="shrink-0" onClick={triggerErrorClose} />
            </div>
          </div>
        )}

        {message && (
          <div className={`fixed top-6 right-6 z-50 max-w-sm w-full bg-white/90 backdrop-blur-lg border border-emerald-100 rounded-2xl shadow-xl overflow-hidden flex text-left ${messageClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="w-2 bg-emerald-500 flex-shrink-0" />
            <div className="p-4 flex gap-3.5 items-start w-full">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 leading-tight">Success</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{message}</p>
              </div>
              <ModalCloseButton size="sm" className="shrink-0" onClick={triggerMessageClose} />
            </div>
          </div>
        )}

        {/* Global Toolbar Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-lg uppercase tracking-wider text-slate-900">Simba Academy</span>
            <span className="hidden md:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase border border-slate-200">
              Teacher Space
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-xs text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-500">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#8AC926]/10 flex items-center justify-center font-bold text-[#8AC926] text-xs uppercase border border-[#8AC926]/20">
              {user?.name ? user.name.substring(0, 2) : "TE"}
            </div>
          </div>
        </header>

        {/* Tab view area */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 focus:outline-none">
          
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
              <p className="font-bold text-slate-600">Loading your academic workspace...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* ────────────────── OVERVIEW DASHBOARD ────────────────── */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Dynamic greeting header */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#8AC926]/90 to-[#78B020] p-6 text-white shadow-lg border border-[#8AC926]/30">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900/70">Instructor Dashboard</span>
                      </div>
                      <h2 className="font-sans text-2xl font-extrabold tracking-tight">Good day, Teacher {user?.name}!</h2>
                      <p className="text-xs font-semibold text-white/95 max-w-xl">
                        Welcome to your integrated Simba workspace. Review your daily task queue, upload lesson resources directly, and track proof approvals.
                      </p>
                    </div>
                    {/* Decorative Background Blob */}
                    <div className="absolute right-0 bottom-0 top-0 w-80 bg-radial-gradient from-white/20 to-transparent blur-2xl pointer-events-none rounded-full translate-x-12 translate-y-12"></div>
                  </div>

                  {/* Core KPI metrics row */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Assigned Tasks", val: totalTasksCount, bg: "bg-slate-100 border-slate-200/60", text: "text-slate-800" },
                      { label: "Pending Proof", val: pendingTasksCount, bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600" },
                      { label: "Submitted Proof", val: completedTasksCount, bg: "bg-sky-500/10 border-sky-500/20", text: "text-sky-600" },
                      { label: "Approved Tasks", val: approvedTasksCount, bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600" },
                      { label: "Total Materials", val: materials.length, bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-600" },
                    ].map((stat, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border ${stat.bg} shadow-xs flex flex-col justify-between`}>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        <span className={`text-2xl font-black ${stat.text} mt-2`}>{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main split grid: Tasks & Material previews */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Recent Tasks (2/3 width) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#8AC926]" />
                          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Your Task Backlog</h3>
                        </div>
                        <button onClick={() => setActiveTab("tasks")} className="text-2xs font-bold text-[#8AC926] hover:underline inline-arrow">
                          View All <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {tasks.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 font-semibold text-xs">
                            No tasks have been assigned to you yet. Good job!
                          </div>
                        ) : (
                          tasks.slice(0, 4).map((t) => (
                            <div key={t.id} className="p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 text-xs">{t.title}</h4>
                                {t.dueDate && (
                                  <div className="flex items-center gap-1 text-2xs text-slate-600 font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 self-end sm:self-center">
                                <span className={`px-2.5 py-0.5 rounded-lg text-3xs font-extrabold uppercase border ${
                                  t.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                  t.status === "COMPLETED" ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                                  t.status === "REJECTED" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                  "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                }`}>
                                  {t.status}
                                </span>
                                {(t.status === "PENDING" || t.status === "REJECTED") && (
                                  <button
                                    onClick={() => {
                                      setSelectedTask(t);
                                      setProofForm({ description: "" });
                                      setSelectedProofFile(null);
                                      setShowProofModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#8AC926] text-white font-bold text-2xs hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10"
                                  >
                                    Submit Proof
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right Column: Analytics summary (1/3 width) */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                        <h4 className="font-bold text-[10px] uppercase text-slate-800 tracking-wider">Lesson Library</h4>
                        <BookOpen className="w-3.5 h-3.5 text-[#8AC926]" />
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-center">
                          <span className="text-md font-bold text-[#8AC926] leading-none block">
                            {materials.filter(m => m.isApproved).length}
                          </span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1.5 block">
                            Approved Lessons
                          </span>
                        </div>

                        <div className="space-y-3.5 pt-2">
                          <div className="flex items-center justify-between text-3xs font-bold">
                            <span className="text-slate-600 uppercase tracking-wider">Needs Admin Approval</span>
                            <span className="text-[#FF9F1C]">{materials.filter(m => !m.isApproved).length} items</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#FF9F1C] to-amber-500 rounded-full" 
                              style={{ width: materials.length ? `${(materials.filter(m => !m.isApproved).length / materials.length) * 100}%` : "0%" }}
                            ></div>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (courses.length > 0) {
                              setMaterialForm({ title: "", description: "", type: "PDF", courseId: courses[0]?.id ?? "" });
                              setSelectedMaterialFile(null);
                              setShowMaterialForm(true);
                            }
                          }}
                          className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-[#8AC926] text-[#8AC926] hover:bg-[#8AC926]/5 font-bold text-2xs tracking-wider transition flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Upload New Material
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── ASSIGNED TASKS Tab ────────────────── */}
              {activeTab === "tasks" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h2 className="font-sans text-xl font-extrabold text-slate-900">Your Assigned Tasks</h2>
                      <p className="text-xs text-slate-600 font-semibold">View and fulfill academic task queues assigned to you by administrators.</p>
                    </div>
                  </div>

                  {/* Search and filter toolbar */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        placeholder="Search tasks..."
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#8AC926] focus:bg-white transition"
                      />
                    </div>
                    <div className="flex gap-2">
                      <PortalSelect
                        size="sm"
                        value={taskStatusFilter}
                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                        className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#8AC926] focus:bg-white transition"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Approval</option>
                        <option value="COMPLETED">Submitted for Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </PortalSelect>
                    </div>
                  </div>

                  {/* Tasks Table */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold">
                            <th className="pb-3">Task Details</th>
                            <th className="pb-3">Due Date</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Proof Information</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 font-semibold text-slate-600">
                                No assigned tasks found matching your filters.
                              </td>
                            </tr>
                          ) : (
                            filteredTasks.map((t) => {
                              const isOverdue = t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status === "PENDING";
                              return (
                                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition">
                                  <td className="py-4 pr-3 max-w-xs">
                                    <p className="font-bold text-slate-900">{t.title}</p>
                                    {t.description && <p className="text-2xs text-slate-600 mt-1">{t.description}</p>}
                                  </td>
                                  <td className="py-4">
                                    {t.dueDate ? (
                                      <span className={`font-semibold text-2xs ${isOverdue ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                                        {new Date(t.dueDate).toLocaleDateString("en-IN", {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                        {isOverdue && " (Overdue)"}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">No Limit</span>
                                    )}
                                  </td>
                                  <td className="py-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-3xs font-extrabold uppercase border ${
                                      t.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                      t.status === "COMPLETED" ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                                      t.status === "REJECTED" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                      "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    }`}>
                                      {t.status === "COMPLETED" ? "Submitted" : t.status}
                                    </span>
                                  </td>
                                  <td className="py-4 max-w-xs pr-3">
                                    {t.proofUrl ? (
                                      <div className="space-y-1">
                                        <a href={t.proofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#8AC926] hover:underline flex items-center gap-1 cursor-pointer">
                                          View File Attachment <ExternalLink className="w-3 h-3 text-slate-500" />
                                        </a>
                                        {t.proofDesc && <p className="text-3xs text-slate-500 font-semibold italic">"{t.proofDesc}"</p>}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 italic text-2xs">No proof submitted yet</span>
                                    )}
                                  </td>
                                  <td className="py-4 text-right">
                                    {(t.status === "PENDING" || t.status === "REJECTED") ? (
                                      <button
                                        onClick={() => {
                                          setSelectedTask(t);
                                          setProofForm({ description: "" });
                                          setSelectedProofFile(null);
                                          setShowProofModal(true);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-2xs hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10"
                                      >
                                        Submit Proof
                                      </button>
                                    ) : (
                                      <button disabled className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-sans font-bold text-2xs cursor-not-allowed">
                                        Locked
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── LEARNING MATERIALS Tab ────────────────── */}
              {activeTab === "materials" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h2 className="font-sans text-xl font-extrabold text-slate-900">Learning Materials & Resources</h2>
                      <p className="text-xs text-slate-600 font-semibold">Upload educational resource files like PPT slide decks or PDFs to link with courses.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (courses.length === 0) {
                          alert("Ensure courses exist before uploading learning materials.");
                          return;
                        }
                        setMaterialForm({ title: "", description: "", type: "PDF", courseId: courses[0]?.id ?? "" });
                        setSelectedMaterialFile(null);
                        setShowMaterialForm(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10"
                    >
                      <Plus className="w-4 h-4" /> Upload Material
                    </button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        placeholder="Search materials..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#8AC926] focus:bg-white transition"
                      />
                    </div>
                    <div className="flex gap-2">
                      <PortalSelect
                        size="sm"
                        value={materialCourseFilter}
                        onChange={(e) => setMaterialCourseFilter(e.target.value)}
                        className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#8AC926] focus:bg-white transition"
                      >
                        <option value="ALL">All Courses</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </PortalSelect>
                    </div>
                  </div>

                  {/* Materials list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMaterials.length === 0 ? (
                      <div className="col-span-full bg-white text-center py-12 rounded-2xl border border-slate-200 shadow-xs font-semibold text-slate-600">
                        No learning resources found matching your queries.
                      </div>
                    ) : (
                      filteredMaterials.map((m) => (
                        <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition p-5 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <span className={`px-2.5 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${
                                m.type === "PDF" ? "bg-rose-50 text-rose-500 border-rose-200/40" : "bg-amber-50 text-amber-500 border-amber-200/40"
                              }`}>
                                {m.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg text-4xs font-extrabold uppercase border ${
                                m.isApproved ? "bg-emerald-50 text-emerald-500 border-emerald-200/40" : "bg-amber-50 text-amber-500 border-amber-200/40 animate-pulse"
                              }`}>
                                {m.isApproved ? "Approved" : "Pending Review"}
                              </span>
                            </div>
                            <h3 className="font-sans font-extrabold text-sm text-slate-900 line-clamp-1">{m.title}</h3>
                            <p className="text-2xs text-slate-600 line-clamp-2">{m.description || "No description provided."}</p>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <div className="text-[10px] font-bold text-slate-500">
                              <p className="text-slate-600 uppercase tracking-wide truncate max-w-[130px]">{m.course?.title}</p>
                              <p className="text-slate-400 font-semibold">{new Date(m.createdAt).toLocaleDateString()}</p>
                            </div>
                            <a 
                              href={m.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#8AC926] hover:bg-[#8AC926]/5 text-slate-700 hover:text-[#8AC926] font-bold text-2xs transition flex items-center gap-1 cursor-pointer"
                            >
                              Open file <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────── STORY LIBRARY Tab ────────────────── */}
              {activeTab === "library" && token && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-sans text-xl font-extrabold text-slate-900">Story Library</h2>
                    <p className="text-xs text-slate-600 font-semibold">
                      Books shared for teachers. View and print only — downloads are reserved for administrators.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        placeholder="Search story books…"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs w-full outline-none focus:border-[#8AC926]"
                      />
                    </div>
                    <PortalSelect
                      size="sm"
                      value={libraryCategory}
                      onChange={(e) => setLibraryCategory(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold bg-white"
                    >
                      <option value="ALL">All categories</option>
                      {Array.from(new Set(books.map((b) => b.category))).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </PortalSelect>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books
                      .filter((b) => {
                        const q = librarySearch.toLowerCase();
                        const matchesSearch =
                          !q ||
                          b.title.toLowerCase().includes(q) ||
                          (b.author ?? "").toLowerCase().includes(q);
                        const matchesCat = libraryCategory === "ALL" || b.category === libraryCategory;
                        return matchesSearch && matchesCat;
                      })
                      .map((b) => (
                        <div
                          key={b.id}
                          className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col gap-4"
                        >
                          <div>
                            <span className="px-2 py-0.5 rounded-lg text-4xs font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                              {b.category}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 mt-2">{b.title}</h3>
                            {b.author && (
                              <p className="text-2xs text-slate-600 font-semibold">Author: {b.author}</p>
                            )}
                          </div>
                          <StoryBookActions bookId={b.id} token={token} role="TEACHER" title={b.title} variant="teacher" />
                        </div>
                      ))}
                    {books.length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-600 font-semibold bg-white rounded-2xl border border-slate-200">
                        No story books assigned to the teacher library yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────── LESSON & DAILY PLANNER Tab ────────────────── */}
              {activeTab === "planner" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-sans text-xl font-extrabold text-slate-900">Lesson & Daily Planner</h2>
                    <p className="text-xs text-slate-600 font-semibold">Organize files, course schedules, and upcoming tasks in an integrated layout.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Courses / Level List */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md lg:col-span-1 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Academic Divisions</h3>
                      <div className="space-y-2">
                        {courses.length === 0 ? (
                          <p className="text-xs text-slate-500 font-semibold">No active courses registered.</p>
                        ) : (
                          courses.map((c) => {
                            const courseMaterialsCount = materials.filter(m => m.courseId === c.id && m.isApproved).length;
                            return (
                              <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{c.title}</p>
                                  <p className="text-[10px] text-slate-500 font-semibold">{c.level}</p>
                                </div>
                                <span className="bg-[#8AC926]/10 text-[#8AC926] border border-[#8AC926]/20 font-bold px-2 py-0.5 rounded-lg text-2xs">
                                  {courseMaterialsCount} Lessons
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Today's Planner Timeline */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md lg:col-span-2 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Weekly Task & Activity Planner</h3>
                      
                      <div className="space-y-4">
                        {tasks.filter(t => t.status === "PENDING").length === 0 ? (
                          <div className="text-center py-12 text-slate-500 font-semibold text-xs flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            <p>All clear! There are no pending task assignments in your schedule.</p>
                          </div>
                        ) : (
                          tasks.filter(t => t.status === "PENDING").map((t) => {
                            const daysLeft = t.dueDate ? Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24)) : null;
                            return (
                              <div key={t.id} className="flex gap-4 items-start relative group pl-3">
                                {/* Left Line element */}
                                <div className="absolute left-0 top-1 bottom-1 w-1 bg-amber-400 rounded-full"></div>
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#8AC926] transition">{t.title}</h4>
                                    {daysLeft !== null && (
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                                        daysLeft <= 0 ? "bg-rose-50 text-rose-500 border-rose-200" : "bg-amber-50 text-amber-500 border-amber-200"
                                      }`}>
                                        {daysLeft === 0 ? "Due today" : daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)}d` : `${daysLeft} days left`}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-2xs text-slate-600 leading-relaxed">{t.description || "No additional guidelines provided."}</p>
                                  <div className="flex items-center justify-between pt-1 text-3xs font-semibold text-slate-500">
                                    <span>Due Date: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No Limit"}</span>
                                    <button
                                      onClick={() => {
                                        setSelectedTask(t);
                                        setProofForm({ description: "" });
                                        setSelectedProofFile(null);
                                        setShowProofModal(true);
                                      }}
                                      className="text-[#8AC926] hover:underline font-extrabold"
                                    >
                                      Submit Proof
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ────────────────── PROOF SUBMISSION MODAL ────────────────── */}
      {showProofModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative">
            <ModalCloseButton
              onClick={() => {
                setShowProofModal(false);
                setSelectedTask(null);
                setSelectedProofFile(null);
              }}
              className="absolute top-4 right-4"
            />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">Submit Task Completion Proof</h3>

            <form onSubmit={handleProofSubmit} noValidate className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
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
                      <p className="text-xs text-slate-500 font-bold">
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

              <button 
                type="submit" 
                disabled={actionLoading === "proof-submit"}
                className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 flex items-center justify-center gap-1.5"
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

      {/* ────────────────── MATERIAL UPLOAD MODAL ────────────────── */}
      {showMaterialForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative">
            <ModalCloseButton
              onClick={() => {
                setShowMaterialForm(false);
                setSelectedMaterialFile(null);
              }}
              className="absolute top-4 right-4"
            />
            <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">Upload Learning Resource</h3>

            <form onSubmit={handleMaterialUploadSubmit} noValidate className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Material Title</label>
                <input
                  required
                  placeholder="e.g. Playgroup Alphabet Cards"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of the educational file..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Resource Type</label>
                  <PortalSelect
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                    className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                  >
                    <option value="PDF">PDF E-Book</option>
                    <option value="PPT">PPT Slide Deck</option>
                  </PortalSelect>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Select Course</label>
                  <PortalSelect
                    required
                    value={materialForm.courseId}
                    onChange={(e) => setMaterialForm({ ...materialForm, courseId: e.target.value })}
                    className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </PortalSelect>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Resource File (PDF or PPT)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-[#8AC926] transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-bold">
                        {selectedMaterialFile ? selectedMaterialFile.name : "Select or drag file here"}
                      </p>
                      <p className="text-3xs text-slate-400 mt-0.5">PDF or PPT up to 50MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      required
                      accept=".pdf,.ppt,.pptx"
                      onChange={(e) => setSelectedMaterialFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={actionLoading === "material-save"}
                className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 flex items-center justify-center gap-1.5"
              >
                {actionLoading === "material-save" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                  </>
                ) : (
                  "Upload & Send for Approval"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
