import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { ADMIN_TAB_PATHS, type AdminTab } from "../../../lib/adminRoutes";
import {
  api,
  ApiError,
  type AuthUser,
  type Course,
  type GalleryItem,
  type Inquiry,
  type FranchiseInquiry,
  type Material,
  type Payment,
  type StoryBook,
  type Task,
  type TaskAudit,
  type RecurringTask,
  type TaskFolder,
  type Testimonial,
  type DashboardStats,
  type GoogleLocationSummary,
  type PublicReview,
  type AdminNotification,
  type LibraryFolder,
} from "../../../lib/api";
import { clearSession } from "../../../lib/auth";
import { isActionBusy } from "../../../lib/actionGuard";
import {
  BookOpen,
  CreditCard,
  Users,
  Mail,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Book,
  Image,
  Award,
  Search,
  Bell,
  Check,
  Loader2,
  FileCheck2,
  ExternalLink,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Compass,
  PlusCircle,
  ChevronRight,
  CheckCircle2,
  Activity,
  Eye,
  FileText,
  Download,
  Printer,
  Phone,
  MapPin,
  FolderPlus,
  Folder,
  FolderOpen,
  FolderInput,
  Layers,
  ChevronDown,
  ChevronLeft,
  Home,
  MoreVertical,
  RotateCcw,
  History as HistoryIcon,
  X,
} from "lucide-react";
import { AdminPeoplePanel } from "../../AdminPeoplePanel";
import { AdminPaymentsPanel } from "../../AdminPaymentsPanel";
import { DriveLibraryPanel } from "../../DriveLibraryPanel";
import { AdminLessonPlansPanel } from "../../AdminLessonPlansPanel";
import { ConfirmDialog } from "../../ConfirmDialog";
import { RecentPaymentCard, sortPaymentsNewestFirst } from "../../RecentPaymentCard";
import { StoryBookActions } from "../../StoryBookActions";
import { GalleryItemActions } from "../../GalleryItemActions";
import { ThemeSelect } from "../../ThemeSelect";
import { PortalDateRangePicker } from "../../PortalDateRangePicker";
import { AdminSettingsPanel } from "../../AdminSettingsPanel";
import { LIBRARY_AUDIENCE_OPTIONS, audienceLabel } from "../../../lib/library";
import {
  STUDENT_CLASS_OPTIONS,
  STORY_BOOK_ACCEPT,
  isValidStoryBookFile,
  type StudentClassLevel,
} from "../../../lib/constants";
import type { LibraryAudience } from "../../../lib/library";
import { resolveStorageUrl } from "../../../lib/storage";
import { isDateTodayOrFuture, localDateInputMin } from "../../../lib/dates";
import { ModalCloseButton } from "../../ModalCloseButton";
import { GoogleReviewCard } from "../../GoogleReviewCard";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../../AdminPageShell";
import {
  PortalPageShell,
  portalDashboardBodyClass,
  portalDashboardLowerGridClass,
} from "../../PortalPageShell";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  PillSelect,
  adminListRowClass,
  adminListRowStackClass,
  useAdminPagination,
} from "../../AdminListUi";
import { useAdminOutlet } from "../AdminOutletContext";
import { AdminTabLoader } from "../AdminTabLoader";
import { AdminNotificationBell } from "../AdminNotificationBell";

const TASK_TITLE_MIN = 2;
const TASK_DESCRIPTION_MIN = 10;

type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
};

function validateAssignTaskForm(form: TaskFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.teacherId) {
    errors.teacherId = "Please select a teacher.";
  }

  const title = form.title.trim();
  if (!title) {
    errors.title = "Please enter a task title.";
  } else if (title.length < TASK_TITLE_MIN) {
    errors.title = `Task title must be at least ${TASK_TITLE_MIN} characters.`;
  }

  const description = form.description.trim();
  if (!description) {
    errors.description = "Please enter task instructions.";
  } else if (description.length < TASK_DESCRIPTION_MIN) {
    errors.description = `Task description must be at least ${TASK_DESCRIPTION_MIN} characters.`;
  }

  if (!form.dueDate) {
    errors.dueDate = "Please choose a due date.";
  } else if (!isDateTodayOrFuture(form.dueDate)) {
    errors.dueDate = "Due date must be today or a future date.";
  }

  return errors;
}

function taskFieldClass(hasError: boolean): string {
  return `w-full rounded-xl bg-white border px-4 py-2.5 text-slate-900 outline-none placeholder-slate-400 transition ${
    hasError
      ? "border-rose-400 focus:border-rose-500"
      : "border-slate-200 focus:border-[#8AC926]"
  }`;
}

export function AdminMaterialsPage() {
  const navigate = useNavigate();
  const { token, user, setMessage, setError } = useAdminOutlet();
  const activeTab = "materials" as AdminTab;

  function goToTab(next: AdminTab) {
    if (activeTab !== next) navigate(ADMIN_TAB_PATHS[next]);
  }

  const [inquirySubTab, setInquirySubTab] = useState<"general" | "franchise">("general");
  const [taskSubTab, setTaskSubTab] = useState<"folders" | "general">("folders");

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderAncestors, setFolderAncestors] = useState<Array<{ id: string; name: string; parentId: string | null }>>([]);
  const [allFoldersFlat, setAllFoldersFlat] = useState<Array<{ id: string; name: string; parentId: string | null }>>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [franchiseInquiries, setFranchiseInquiries] = useState<FranchiseInquiry[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [googleReviews, setGoogleReviews] = useState<PublicReview[]>([]);
  const [googleLocations, setGoogleLocations] = useState<GoogleLocationSummary[]>([]);
  const [googleReviewsMeta, setGoogleReviewsMeta] = useState<{
    configured: boolean;
    hint?: string;
    rating?: number;
    totalRatings?: number;
    placeName?: string;
    fetchMode?: "business_profile" | "places" | "oauth_pending" | "none";
  }>({ configured: false });
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [notificationSearch, setNotificationSearch] = useState("");
  const [notificationFilter, setNotificationFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [notificationTypeFilter, setNotificationTypeFilter] = useState<"ALL" | "PAYMENT" | "TASK" | "USER">("ALL");
  const [notificationDateFilter, setNotificationDateFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM">("ALL");
  const [notificationStartDate, setNotificationStartDate] = useState("");
  const [notificationEndDate, setNotificationEndDate] = useState("");

  // Loading & Feedback States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [taskTeacherFilter, setTaskTeacherFilter] = useState("ALL");
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);
  const [viewReasonModal, setViewReasonModal] = useState<{ title: string; message: string } | null>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState<CombinedApprovalItem | null>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [inquirySearch, setInquirySearch] = useState("");
  const [leadView, setLeadView] = useState<{
    kind: "admission" | "franchise";
    item: Inquiry | FranchiseInquiry;
  } | null>(null);

  const [courseForm, setCourseForm] = useState({
    id: "",
    title: "",
    description: "",
    level: "Playgroup",
    price: "" as string | number,
    imageUrl: "",
    isEditing: false,
  });
  const [showCourseForm, setShowCourseForm] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    teacherId: "",
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [taskFolders, setTaskFolders] = useState<TaskFolder[]>([]);
  const [selectedTaskFolder, setSelectedTaskFolder] = useState<TaskFolder | null>(null);
  const [showTaskFolderForm, setShowTaskFolderForm] = useState(false);
  const [taskFolderForm, setTaskFolderForm] = useState({ id: "", name: "", studentClass: "LKG", isEditing: false });
  const [viewTaskDetailsModal, setViewTaskDetailsModal] = useState<RecurringTask | null>(null);
  const [showRecurringTaskForm, setShowRecurringTaskForm] = useState(false);
  const [recurringTaskForm, setRecurringTaskForm] = useState({
    id: "",
    title: "",
    description: "",
    studentClass: "LKG",
    repeatDay: "MONDAY",
    isEditing: false,
  });
  const [viewingHistoryTaskId, setViewingHistoryTaskId] = useState<string | null>(null);
  const [recurringTaskHistory, setRecurringTaskHistory] = useState<Task[]>([]);
  const [selectedApprovalClassFolder, setSelectedApprovalClassFolder] = useState<string | null>(null);
  const [showRejectTaskForm, setShowRejectTaskForm] = useState(false);

  // Approve Uploads filters
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalClassFilter, setApprovalClassFilter] = useState("ALL");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("ALL");
  const [approvalTypeFilter, setApprovalTypeFilter] = useState("ALL");
  const [approvalSort, setApprovalSort] = useState("newest");

  // Assign Tasks (recurring tasks) filters
  const [recurringTaskSearch, setRecurringTaskSearch] = useState("");
  const [recurringTaskClassFilter, setRecurringTaskClassFilter] = useState("ALL");
  const [recurringTaskStatusFilter, setRecurringTaskStatusFilter] = useState("ALL");
  const [recurringTaskSort, setRecurringTaskSort] = useState("newest");
  const [rejectTaskForm, setRejectTaskForm] = useState({ id: "", reason: "" });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const [teacherPickerSearch, setTeacherPickerSearch] = useState("");
  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    categories: ["Playgroup"] as StudentClassLevel[],
    audience: "BOTH" as LibraryAudience,
  });
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Folder form states
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<LibraryFolder | null>(null);
  const [folderForm, setFolderForm] = useState({ name: "", audience: "BOTH" as string, categories: [] as string[] });
  const [showMoveDialog, setShowMoveDialog] = useState<{ type: "book" | "folder"; id: string; name: string } | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [folderActionMenu, setFolderActionMenu] = useState<string | null>(null);

  const [galleryForm, setGalleryForm] = useState({ title: "" });
  const [galleryImageFile, setGalleryImageFile] = useState<File | null>(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [bookAudienceFilter, setBookAudienceFilter] = useState("ALL");
  const [bookClassFilter, setBookClassFilter] = useState("ALL");
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("");
  const [viewerDownloading, setViewerDownloading] = useState(false);

  const [testimonialForm, setTestimonialForm] = useState({ name: "", content: "", rating: 5 });
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  // New Direct File Upload States
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; title?: string; message?: string } | null>(null);

  // --- Audit History State ---
  const [auditHistoryTaskId, setAuditHistoryTaskId] = useState<string | null>(null);
  const [taskAuditHistory, setTaskAuditHistory] = useState<TaskAudit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Fetch data specifically for the active tab
  useEffect(() => {
    if (!token) return;
    setSelectedTaskFolder(null);
    setSelectedApprovalClassFolder(null);
    loadTabData(activeTab);
  }, [token, activeTab]);

  async function refreshGoogleReviewsLive() {
    if (!token) return;
    try {
      const googleStatus = await api.getGoogleReviewsStatus(token);
      setGoogleReviews(googleStatus.reviews ?? []);
      setGoogleLocations(googleStatus.locations ?? []);
      setGoogleReviewsMeta({
        configured: googleStatus.configured,
        hint: googleStatus.hint,
        rating: googleStatus.rating,
        totalRatings: googleStatus.totalRatings,
        placeName: googleStatus.placeName,
        fetchMode: googleStatus.fetchMode,
      });
    } catch {
      /* keep last good data on background refresh */
    }
  }

  // Reload saved reviews from server every 5 min (reads snapshot — does not call Google API)
  useEffect(() => {
    if (!token || activeTab !== "reviews") return;
    const timer = window.setInterval(() => {
      void refreshGoogleReviewsLive();
    }, 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [token, activeTab]);

  async function loadTabData(tab: AdminTab) {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      if (tab === "overview") {
        const [dashboardStats, paymentsResult, inquiriesResult, tasksResult, franchisesResult] =
          await Promise.allSettled([
            api.getDashboard(token),
            api.getPayments(token),
            api.getInquiries(token),
            api.getTasks(token),
            api.getFranchiseInquiries(token),
          ]);

        if (dashboardStats.status !== "fulfilled") {
          throw dashboardStats.reason;
        }
        setStats(dashboardStats.value);

        if (paymentsResult.status === "fulfilled") {
          setPayments(paymentsResult.value);
        } else {
          console.error("Failed to load payments:", paymentsResult.reason);
          setError(
            paymentsResult.reason instanceof ApiError
              ? paymentsResult.reason.message
              : "Failed to load payment records."
          );
        }

        if (inquiriesResult.status === "fulfilled") {
          setInquiries(inquiriesResult.value);
        }
        if (tasksResult.status === "fulfilled") {
          setTasks(tasksResult.value);
        }
        if (franchisesResult.status === "fulfilled") {
          setFranchiseInquiries(franchisesResult.value);
        }
      } else if (tab === "users") {
        setLoading(false);
        const allUsers = await api.getUsers(token);
        setUsers(allUsers);
        return;
      } else if (tab === "payments") {
        setLoading(false);
        return;
      } else if (tab === "planner") {
        setLoading(false);
        return;
      } else if (tab === "teachers") {
        // AdminPeoplePanel loads via GET /api/admin/teachers
        setLoading(false);
        return;
      } else if (tab === "materials") {
        const [allMaterials, allCourses, allTasks] = await Promise.all([
          api.getMaterials(token),
          api.getCourses(),
          api.getTasks(token),
        ]);
        setMaterials(allMaterials);
        setCourses(allCourses);
        setTasks(allTasks);
      } else if (tab === "tasks") {
        const [allRecurringTasks, allFolders, allUsers, allTasks] = await Promise.all([
          api.getRecurringTasks(token),
          api.getTaskFolders(token),
          api.getUsers(token), // To populate the assign-to-teacher select options
          api.getTasks(token),
        ]);
        setRecurringTasks(allRecurringTasks);
        setTaskFolders(allFolders);
        setUsers(allUsers);
        setTasks(allTasks);
      } else if (tab === "books") {
        await loadFolderContents(currentFolderId);
      } else if (tab === "inquiries") {
        const [allInquiries, allFranchises] = await Promise.all([
          api.getInquiries(token),
          api.getFranchiseInquiries(token),
        ]);
        setInquiries(allInquiries);
        setFranchiseInquiries(allFranchises);
      } else if (tab === "reviews") {
        const allTestimonials = await api.getAdminTestimonials(token);
        setTestimonials(allTestimonials);
        try {
          await refreshGoogleReviewsLive();
        } catch {
          setGoogleReviews([]);
          setGoogleLocations([]);
          setGoogleReviewsMeta({
            configured: true,
            fetchMode: "business_profile",
            hint: "Could not reach Google. Check OAuth settings in backend .env.",
          });
        }
      } else if (tab === "gallery") {
        const allGallery = await api.getGallery();
        setGallery(allGallery);
      } else if (tab === "notifications") {
        const allNotifications = await api.getAdminNotifications(token);
        setAdminNotifications(allNotifications);
      }
    } catch (err) {
      console.error(`Dashboard data load error for tab "${tab}":`, err);
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate("/admin/login");
      } else {
        setError(`Failed to load data for tab "${tab}". Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── COURSE MANAGEMENT ACTIONS ────────────────────────────────────────
  async function handleCourseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading("course-save");
    setError("");
    setMessage("");

    if (!courseForm.title.trim()) {
      setError("Please enter the course title.");
      setActionLoading(null);
      return;
    }
    if (
      courseForm.price === "" ||
      courseForm.price === undefined ||
      isNaN(Number(courseForm.price))
    ) {
      setError("Please enter a valid tuition fee.");
      setActionLoading(null);
      return;
    }

    try {
      let finalImageUrl = courseForm.imageUrl;
      if (courseImageFile) {
        // Upload the file first to cPanel
        const uploadResponse = await api.uploadRaw(token, courseImageFile);
        finalImageUrl = uploadResponse.url;
      }

      const body = {
        title: courseForm.title,
        description: courseForm.description,
        level: courseForm.level as any,
        price: Number(courseForm.price) || undefined,
        imageUrl: finalImageUrl || undefined,
      };

      if (courseForm.isEditing) {
        const updated = await api.updateCourse(token, courseForm.id, body);
        setCourses((prev) => prev.map((c) => (c.id === courseForm.id ? updated : c)));
        setMessage("Course updated successfully.");
      } else {
        const created = await api.createCourse(token, body);
        setCourses((prev) => [created, ...prev]);
        setMessage("Course created successfully.");
      }
      setCourseForm({
        id: "",
        title: "",
        description: "",
        level: "Playgroup",
        price: "",
        imageUrl: "",
        isEditing: false,
      });
      setCourseImageFile(null);
      setShowCourseForm(false);
    } catch (err) {
      console.error("Course save failed:", err);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save course. Please verify WebDAV connection."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleCourseActive(courseId: string, currentActive: boolean) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`course-active-${courseId}`);
    try {
      const updated = await api.updateCourse(token, courseId, { isActive: !currentActive });
      setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
      setMessage(`Course status toggled successfully.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to toggle course status.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteCourse(courseId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "course",
      id: courseId,
      title: "Delete Course?",
      message: "Are you sure you want to delete this course? All uploaded materials for this course will be deleted.",
    });
  }

  // ── MATERIAL APPROVAL ACTIONS ────────────────────────────────────────
  async function handleDeleteMaterial(materialId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "material",
      id: materialId,
      title: "Delete Learning Material?",
      message: "Permanently delete this material and its file from storage?",
    });
  }

  async function handleApproveMaterial(materialId: string, approve: boolean) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`material-approve-${materialId}`);
    try {
      const updated = await api.approveMaterial(token, materialId, approve);
      setMaterials((prev) => prev.map((m) => (m.id === materialId ? updated : m)));
      setMessage(
        approve ? "Learning material approved successfully." : "Learning material rejected."
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update material approval.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── TASK ASSIGNMENT ACTIONS ──────────────────────────────────────────
  function clearTaskFieldError(field: string) {
    setTaskFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleAssignTask(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setError("");
    setMessage("");

    const errors = validateAssignTaskForm(taskForm);
    if (Object.keys(errors).length > 0) {
      setTaskFormErrors(errors);
      return;
    }
    setTaskFormErrors({});

    setActionLoading("task-assign");
    try {
      if (editingTask) {
        const updated = await api.updateTask(token, editingTask.id, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          dueDate: new Date(`${taskForm.dueDate}T12:00:00`).toISOString(),
          teacherId: taskForm.teacherId,
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setMessage("Task updated successfully.");
      } else {
        const created = await api.createTask(token, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          dueDate: new Date(`${taskForm.dueDate}T12:00:00`).toISOString(),
          teacherId: taskForm.teacherId,
        });
        setTasks((prev) => [created, ...prev]);
        setMessage("Task assigned successfully.");
      }
      setTaskForm({ title: "", description: "", dueDate: "", teacherId: "" });
      setTaskFormErrors({});
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.errors)) {
          if (messages[0]) mapped[key] = messages[0];
        }
        setTaskFormErrors(mapped);
      } else {
        setError(err instanceof ApiError ? err.message : `Failed to ${editingTask ? "update" : "assign"} task.`);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateRecurringTask(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading("recurring-task-save");
    setError("");
    setMessage("");

    if (!recurringTaskForm.title.trim()) {
      setError("Please enter a task title.");
      setActionLoading(null);
      return;
    }

    if (!recurringTaskForm.studentClass.trim()) {
      setError("Please select at least one class.");
      setActionLoading(null);
      return;
    }

    try {
      if (recurringTaskForm.isEditing && recurringTaskForm.id) {
        const updated = await api.updateRecurringTask(token, recurringTaskForm.id, {
          title: recurringTaskForm.title.trim(),
          description: recurringTaskForm.description.trim() || undefined,
          studentClass: recurringTaskForm.studentClass || "LKG",
          repeatDay: recurringTaskForm.repeatDay,
          isActive: true,
          folderId: selectedTaskFolder?.id || null,
        });
        setRecurringTasks((prev) => prev.map((rt) => (rt.id === updated.id ? updated : rt)));
        setMessage("Recurring task updated successfully.");
      } else {
        const created = await api.createRecurringTask(token, {
          title: recurringTaskForm.title.trim(),
          description: recurringTaskForm.description.trim() || undefined,
          studentClass: recurringTaskForm.studentClass || "LKG",
          repeatDay: recurringTaskForm.repeatDay,
          isActive: true,
          folderId: selectedTaskFolder?.id || null,
        });
        setRecurringTasks((prev) => [created, ...prev]);
        setMessage("Recurring task created successfully.");
      }
      setRecurringTaskForm({ id: "", title: "", description: "", studentClass: "LKG", repeatDay: "MONDAY", isEditing: false });
      setShowRecurringTaskForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save recurring task.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveTaskFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading("task-folder-save");
    setError("");
    setMessage("");

    if (!taskFolderForm.name.trim()) {
      setError("Please enter a folder name.");
      setActionLoading(null);
      return;
    }

    try {
      if (taskFolderForm.isEditing) {
        const updated = await api.updateTaskFolder(token, taskFolderForm.id, {
          name: taskFolderForm.name.trim(),
          studentClass: taskFolderForm.studentClass,
        });
        setTaskFolders((prev) => prev.map((f) => (f.id === taskFolderForm.id ? updated : f)));
        setMessage("Folder updated successfully.");
      } else {
        const created = await api.createTaskFolder(token, {
          name: taskFolderForm.name.trim(),
          studentClass: taskFolderForm.studentClass,
        });
        setTaskFolders((prev) => [...prev, created]);
        setMessage("Folder created successfully.");
      }
      setTaskFolderForm({ id: "", name: "", studentClass: "LKG", isEditing: false });
      setShowTaskFolderForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save task folder.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteTaskFolder(id: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "taskFolder",
      id,
      title: "Delete Folder?",
      message: "Are you sure you want to delete this folder? All recurring tasks inside this folder will be permanently deleted.",
    });
  }

  async function handleToggleRecurringTask(id: string, currentStatus: boolean) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`rt-toggle-${id}`);
    try {
      const updated = await api.updateRecurringTask(token, id, { isActive: !currentStatus });
      setRecurringTasks((prev) => prev.map((rt) => (rt.id === id ? updated : rt)));
      setMessage(`Task automatically repeating ${!currentStatus ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setError("Failed to toggle task status.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteRecurringTask(id: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "recurringTask",
      id,
      title: "Delete Recurring Task?",
      message: "Are you sure? Future assignments will stop immediately. Existing assigned tasks will remain.",
    });
  }

  async function loadRecurringTaskHistory(id: string) {
    if (!token) return;
    setViewingHistoryTaskId(id);
    setRecurringTaskHistory([]);
    try {
      const history = await api.getRecurringTaskHistory(token, id);
      setRecurringTaskHistory(history);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }

  async function handleApproveTaskProof(taskId: string, approve: boolean, rejectReason?: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`task-approve-${taskId}`);
    try {
      const payload: any = {
        status: approve ? "APPROVED" : "REJECTED",
      };
      if (!approve && rejectReason) {
        payload.rejectionReason = rejectReason;
      }

      const updated = await api.approveTask(token, taskId, payload);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setMessage(approve ? "Task proof approved!" : "Task proof rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to review task proof.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevokeTaskProof(taskId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`task-approve-${taskId}`);
    try {
      const updated = await api.approveTask(token, taskId, {
        status: "SUBMITTED",
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setMessage("Task review revoked and set back to submitted status.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke task review.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleViewHistory(taskId: string) {
    if (!token) return;
    setAuditHistoryTaskId(taskId);
    setLoadingAudit(true);
    try {
      const history = await api.getTaskAuditHistory(token, taskId);
      setTaskAuditHistory(history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load history.");
    } finally {
      setLoadingAudit(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "task",
      id: taskId,
      title: "Delete Task?",
      message: "Permanently delete this task and any proof file from storage?",
    });
  }

  // ── STORY BOOKS ACTIONS ──────────────────────────────────────────────
  async function handleAddStoryBook(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setError("");
    setMessage("");

    if (!bookForm.title.trim()) {
      setError("Please enter the story book title.");
      return;
    }
    if (bookForm.categories.length === 0) {
      setError("Please select at least one class.");
      return;
    }
    if (!editingBookId && !bookFile) {
      setError("Please choose a file to upload.");
      return;
    }
    if (bookFile && !isValidStoryBookFile(bookFile)) {
      setError("Selected file must be a PDF, DOC, DOCX, PPT, or PPTX file.");
      return;
    }
    setActionLoading("book-save");

    try {
      let finalFileUrl: string | undefined = undefined;
      let finalFileSize: number | null | undefined = undefined;
      
      if (bookFile) {
        const uploadResponse = await api.uploadRaw(token, bookFile);
        if (!uploadResponse.verified) {
          throw new ApiError("Story book file could not be verified on storage.", 500);
        }
        finalFileUrl = uploadResponse.url;
        finalFileSize = bookFile.size;
      }

      if (editingBookId) {
        const payload: any = {
          title: bookForm.title,
          author: bookForm.author || null,
          category: bookForm.categories.join(","),
          audience: bookForm.audience,
        };
        if (finalFileUrl) {
          payload.fileUrl = finalFileUrl;
          payload.fileSize = finalFileSize;
        }
        const updated = await api.updateStoryBook(token, editingBookId, payload);
        setBooks((prev) => prev.map((b) => (b.id === editingBookId ? updated : b)));
        setMessage("Story book updated successfully.");
      } else {
        const created = await api.createStoryBook(token, {
          title: bookForm.title,
          author: bookForm.author || null,
          category: bookForm.categories.join(","),
          fileUrl: finalFileUrl!,
          fileSize: finalFileSize ?? null,
          audience: bookForm.audience,
          folderId: currentFolderId,
        });
        setBooks((prev) => [created, ...prev]);
        setMessage("Story book saved to backend/uploads and published to selected portals.");
      }

      setBookForm({
        title: "",
        author: "",
        categories: ["Playgroup"],
        audience: "BOTH",
      });
      setBookFile(null);
      setEditingBookId(null);
      setShowBookForm(false);
    } catch (err) {
      console.error("Storybook save failed:", err);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to add story book. Please verify WebDAV connection."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteStoryBook(bookId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "book",
      id: bookId,
      title: "Delete Story Book?",
      message: "Are you sure you want to delete this story book?",
    });
  }

  // ── LIBRARY FOLDER ACTIONS ─────────────────────────────────────────
  const loadFolderContents = useCallback(async (folderId: string | null) => {
    if (!token) return;
    try {
      const [folderList, bookList] = await Promise.all([
        api.getLibraryFolders(token, folderId),
        api.getStoryBooks(token, folderId),
      ]);
      setFolders(folderList);
      setBooks(bookList);

      if (folderId) {
        const ancestors = await api.getLibraryFolderAncestors(token, folderId);
        setFolderAncestors(ancestors);
      } else {
        setFolderAncestors([]);
      }
    } catch (err) {
      console.error("Failed to load folder contents:", err);
      setError(err instanceof ApiError ? err.message : "Failed to load folder contents.");
    }
  }, [token, setError]);

  async function navigateToFolder(folderId: string | null) {
    setCurrentFolderId(folderId);
    setLoading(true);
    await loadFolderContents(folderId);
    setLoading(false);
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setError("");
    setMessage("");
    if (!folderForm.name.trim()) {
      setError("Please enter a folder name.");
      return;
    }
    setActionLoading("folder-save");
    try {
      const categoryString = folderForm.categories.length > 0 ? folderForm.categories.join(",") : null;
      if (editingFolder) {
        const updated = await api.updateLibraryFolder(token, editingFolder.id, {
          name: folderForm.name.trim(),
          audience: folderForm.audience,
          category: categoryString,
        });
        setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        setMessage("Folder updated.");
      } else {
        const created = await api.createLibraryFolder(token, {
          name: folderForm.name.trim(),
          parentId: currentFolderId,
          audience: folderForm.audience,
          category: categoryString,
        });
        setFolders((prev) => [created, ...prev]);
        setMessage("Folder created.");
      }
      setShowFolderForm(false);
      setEditingFolder(null);
      setFolderForm({ name: "", audience: "BOTH", categories: [] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save folder.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "folder",
      id: folderId,
      title: "Delete Folder?",
      message: "Delete this folder? All files inside will be moved to root.",
    });
  }

  async function openMoveDialog(type: "book" | "folder", id: string, name: string) {
    if (!token) return;
    setShowMoveDialog({ type, id, name });
    setMoveTargetId(null);
    try {
      const flat = await api.getAllLibraryFolders(token);
      setAllFoldersFlat(flat);
    } catch {
      setAllFoldersFlat([]);
    }
  }

  async function handleMoveItem() {
    if (!token || !showMoveDialog || isActionBusy(actionLoading)) return;
    setActionLoading("move-item");
    try {
      if (showMoveDialog.type === "book") {
        await api.moveStoryBook(token, showMoveDialog.id, moveTargetId);
      } else {
        await api.moveLibraryFolder(token, showMoveDialog.id, moveTargetId);
      }
      setMessage(`Moved "${showMoveDialog.name}" successfully.`);
      setShowMoveDialog(null);
      await loadFolderContents(currentFolderId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to move item.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── INQUIRIES ACTIONS ────────────────────────────────────────────────
  async function handleMarkInquiryRead(inquiryId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`inquiry-read-${inquiryId}`);
    try {
      await api.markInquiryRead(token, inquiryId);
      setInquiries((prev) => prev.map((i) => (i.id === inquiryId ? { ...i, isRead: true } : i)));
      setLeadView((v) =>
        v?.kind === "admission" && v.item.id === inquiryId
          ? { ...v, item: { ...v.item, isRead: true } }
          : v
      );
      setMessage("Inquiry marked as read.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update inquiry.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkFranchiseRead(franchiseId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`franchise-read-${franchiseId}`);
    try {
      await api.markFranchiseRead(token, franchiseId);
      setFranchiseInquiries((prev) =>
        prev.map((f) => (f.id === franchiseId ? { ...f, isRead: true } : f))
      );
      setLeadView((v) =>
        v?.kind === "franchise" && v.item.id === franchiseId
          ? { ...v, item: { ...v.item, isRead: true } }
          : v
      );
      setMessage("Franchise inquiry marked as read.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update inquiry.");
    } finally {
      setActionLoading(null);
    }
  }

  const handlePrintViewer = (src: string) => {
    const w = window.open(src, "_blank", "noopener,noreferrer");
    w?.addEventListener("load", () => {
      try {
        w?.print();
      } catch {
        /* ignore */
      }
    });
  };

  const handleDownloadViewer = async (src: string, title: string) => {
    setViewerDownloading(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const ext = src.match(/\.(jpe?g|png|webp|gif)/i)?.[1]?.toLowerCase() ?? "jpg";
      const base = title.replace(/[^\w\s.-]/g, "_").trim() || "gallery-photo";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
    } finally {
      setViewerDownloading(false);
    }
  };

  useEffect(() => {
    if (!viewerImage) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerImage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerImage]);

  // ── MARKETING (GALLERY / TESTIMONIALS) ACTIONS ───────────────────────
  function closeGalleryForm() {
    setShowGalleryForm(false);
    setEditingGallery(null);
    setGalleryForm({ title: "" });
    setGalleryImageFile(null);
  }

  function openGalleryUpload() {
    setEditingGallery(null);
    setGalleryForm({ title: "" });
    setGalleryImageFile(null);
    setShowGalleryForm(true);
  }

  function openGalleryEdit(item: GalleryItem) {
    setEditingGallery(item);
    setGalleryForm({ title: item.title ?? "" });
    setGalleryImageFile(null);
    setShowGalleryForm(true);
  }

  async function handleSaveGallery(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading("gallery-save");
    setError("");
    setMessage("");

    if (!editingGallery && !galleryImageFile) {
      setError("Please choose an image to upload.");
      setActionLoading(null);
      return;
    }
    if (galleryImageFile && !galleryImageFile.type.startsWith("image/")) {
      setError("Only image files are allowed (JPEG, PNG, WebP, or GIF).");
      setActionLoading(null);
      return;
    }

    try {
      let imageUrl: string | undefined;
      if (galleryImageFile) {
        const uploadResponse = await api.uploadRaw(token, galleryImageFile);
        if (!uploadResponse.verified) {
          throw new ApiError("File upload could not be verified on storage.", 500);
        }
        imageUrl = uploadResponse.url;
      }

      if (editingGallery) {
        const updated = await api.updateGalleryItem(token, editingGallery.id, {
          title: galleryForm.title.trim() || undefined,
          ...(imageUrl ? { imageUrl } : {}),
        });
        setGallery((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setMessage(imageUrl ? "Gallery photo updated (new image)." : "Gallery title updated.");
      } else {
        const created = await api.createGalleryItem(token, {
          title: galleryForm.title.trim() || undefined,
          imageUrl: imageUrl!,
          type: "IMAGE",
        });
        setGallery((prev) => [created, ...prev]);
        setMessage("Gallery photo published.");
      }
      closeGalleryForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save gallery photo.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteGallery(galleryId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "gallery",
      id: galleryId,
      title: "Delete Gallery Item?",
      message: "Are you sure you want to delete this gallery item?",
    });
  }

  async function handleApproveTestimonial(testimonialId: string, approve: boolean) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`testimonial-approve-${testimonialId}`);
    try {
      await api.approveTestimonial(token, testimonialId, approve);
      setTestimonials((prev) =>
        prev.map((t) => (t.id === testimonialId ? { ...t, isApproved: approve } : t))
      );
      setMessage(approve ? "Testimonial approved & published!" : "Testimonial hidden.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to review testimonial.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteTestimonial(testimonialId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setConfirmDelete({
      type: "testimonial",
      id: testimonialId,
      title: "Delete Testimonial?",
      message: "Are you sure you want to delete this testimonial?",
    });
  }

  async function handleConfirmDelete() {
    if (!confirmDelete || !token) return;
    const { type, id } = confirmDelete;
    setActionLoading(`${type}-delete-${id}`);
    try {
      if (type === "course") {
        await api.deleteCourse(token, id);
        setCourses((prev) => prev.filter((c) => c.id !== id));
        setMessage("Course deleted successfully.");
      } else if (type === "material") {
        await api.deleteMaterial(token, id);
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        setMessage("Learning material permanently deleted.");
      } else if (type === "task") {
        await api.deleteTask(token, id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setMessage("Task deleted successfully.");
      } else if (type === "book") {
        await api.deleteStoryBook(token, id);
        setBooks((prev) => prev.filter((b) => b.id !== id));
        setMessage("Story book deleted.");
      } else if (type === "folder") {
        await api.deleteLibraryFolder(token, id);
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setMessage("Folder deleted. Files moved to root.");
        await loadFolderContents(currentFolderId);
      } else if (type === "gallery") {
        await api.deleteGalleryItem(token, id);
        setGallery((prev) => prev.filter((g) => g.id !== id));
        setMessage("Gallery item deleted.");
      } else if (type === "testimonial") {
        await api.deleteTestimonial(token, id);
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        setMessage("Testimonial deleted.");
      } else if (type === "recurringTask") {
        await api.deleteRecurringTask(token, id);
        setRecurringTasks((prev) => prev.filter((rt) => rt.id !== id));
        setMessage("Recurring task deleted successfully.");
      } else if (type === "taskFolder") {
        await api.deleteTaskFolder(token, id);
        setTaskFolders((prev) => prev.filter((f) => f.id !== id));
        setRecurringTasks((prev) => prev.filter((rt) => rt.folderId !== id));
        setMessage("Folder deleted successfully.");
        if (selectedTaskFolder?.id === id) {
          setSelectedTaskFolder(null);
        }
      }
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to delete ${type}.`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddTestimonial(e: React.FormEvent) {
    e.preventDefault();
    if (!token || isActionBusy(actionLoading)) return;
    setError("");
    setMessage("");

    if (!testimonialForm.name.trim()) {
      setError("Please enter the parent's name.");
      return;
    }
    if (!testimonialForm.content.trim()) {
      setError("Please enter the review content.");
      return;
    }

    setActionLoading("testimonial-save");
    try {
      const created = await api.createTestimonial(token, testimonialForm);
      setTestimonials((prev) => [created, ...prev]);
      setMessage("Testimonial added successfully.");
      setTestimonialForm({ name: "", content: "", rating: 5 });
      setShowTestimonialForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add testimonial.");
    } finally {
      setActionLoading(null);
    }
  }

  const teachersList = users.filter((u) => u.role === "TEACHER");

  const recentPaymentsTop = sortPaymentsNewestFirst(payments).slice(0, 2);
  const recentPaymentsList = sortPaymentsNewestFirst(payments).slice(0, 3);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.teacher?.name ?? "").toLowerCase().includes(taskSearch.toLowerCase());

    const matchesStatus = taskStatusFilter === "ALL" || t.status === taskStatusFilter;
    const matchesTeacher = taskTeacherFilter === "ALL" || t.teacherId === taskTeacherFilter;

    return matchesSearch && matchesStatus && matchesTeacher;
  });

  const sortedFilteredTasks = [...filteredTasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.author ?? "").toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(bookSearch.toLowerCase());
    const matchesAudience = bookAudienceFilter === "ALL" || b.audience === bookAudienceFilter;
    const matchesClass =
      bookClassFilter === "ALL" ||
      b.category.split(",").map((c) => c.trim()).includes(bookClassFilter);
    return matchesSearch && matchesAudience && matchesClass;
  });

  const activeInquiries = inquirySubTab === "general" ? inquiries : franchiseInquiries;
  const filteredInquiries = activeInquiries.filter((item) => {
    const q = inquirySearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      (item.phone ?? "").toLowerCase().includes(q) ||
      (item.message ?? "").toLowerCase().includes(q) ||
      ("location" in item && (item.location ?? "").toLowerCase().includes(q))
    );
  });

  const taskPagination = useAdminPagination(
    sortedFilteredTasks,
    [taskSearch, taskStatusFilter, taskTeacherFilter, tasks.length],
    3
  );
  const filteredGallery = gallery.filter(
    (g) =>
      (g.title ?? "").toLowerCase().includes(gallerySearch.toLowerCase()) ||
      g.type.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  const filteredFolders = folders.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(bookSearch.toLowerCase());
    const matchesAudience = bookAudienceFilter === "ALL" || f.audience === bookAudienceFilter;
    const matchesClass =
      bookClassFilter === "ALL" ||
      (f.category ?? "").split(",").map((c) => c.trim()).includes(bookClassFilter);
    return matchesSearch && matchesAudience && matchesClass;
  });

  const combinedItems = [
    ...filteredFolders.map((f) => ({ ...f, isFolder: true })),
    ...filteredBooks.map((b) => ({ ...b, isFolder: false })),
  ];
  const bookPagination = useAdminPagination(combinedItems, [bookSearch, bookAudienceFilter, bookClassFilter, books.length, folders.length], 10);
  const galleryPagination = useAdminPagination(filteredGallery, [gallerySearch, gallery.length]);
  const inquiryPagination = useAdminPagination(
    filteredInquiries,
    [inquirySearch, inquirySubTab, inquiries.length, franchiseInquiries.length],
    4
  );

  const taskStatusOptions = [
    { id: "ALL", label: "All Statuses" },
    { id: "PENDING", label: "Pending" },
    { id: "SUBMITTED", label: "Submitted" },
    { id: "UNDER_REVIEW", label: "Under Review" },
    { id: "RESUBMITTED", label: "Resubmitted" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
  ];

  const taskTeacherOptions = [
    { id: "ALL", label: "All Teachers" },
    ...teachersList.map((t) => ({ id: t.id, label: t.name })),
  ];

  const inquiryTabOptions = [
    { id: "general", label: `General Enquiry (${inquiries.length})` },
    { id: "franchise", label: `Franchise (${franchiseInquiries.length})` },
  ];

  interface CombinedApprovalItem {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    fileUrl: string;
    course?: { title: string } | null;
    uploadedBy?: { name: string; email: string } | null;
    isApproved: boolean;
    createdAt: string;
    isTask: boolean;
    status?: string;
    originalTask?: Task;
    originalMaterial?: Material;
  }

  function getApprovalClass(item: CombinedApprovalItem): string {
    const title = item.course?.title || "";
    const taskClass = item.originalTask?.teacher?.studentClass || item.originalTask?.recurringTask?.studentClass;
    if (item.isTask && taskClass) {
      return taskClass;
    }
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("playgroup")) return "Playgroup";
    if (lowerTitle.includes("pre-kg") || lowerTitle.includes("pre kg")) return "Pre-KG";
    if (lowerTitle.includes("lkg") || lowerTitle.includes("lower kindergarten")) return "LKG";
    if (lowerTitle.includes("ukg") || lowerTitle.includes("upper kindergarten")) return "UKG";
    return "Playgroup";
  }

  const combinedApprovals: CombinedApprovalItem[] = [
    ...materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      fileUrl: m.fileUrl,
      course: m.course ? { title: m.course.title } : null,
      uploadedBy: m.uploadedBy ? { name: m.uploadedBy.name, email: m.uploadedBy.email } : null,
      isApproved: m.isApproved,
      createdAt: m.createdAt,
      isTask: false,
      originalMaterial: m,
    })),
    ...tasks
      .filter((t) => t.proofUrl)
      .map((t) => ({
        id: t.id,
        title: t.title, // Removed [Task Proof] prefix
        description: t.proofDesc,
        type: "TASK_PROOF",
        fileUrl: t.proofUrl!,
        course: { title: "N/A (Task Assignment)" },
        uploadedBy: t.teacher ? { name: t.teacher.name, email: t.teacher.email } : null,
        isApproved: t.status === "APPROVED",
        createdAt: t.proofSubmittedAt || t.updatedAt || t.createdAt,
        isTask: true,
        status: t.status,
        originalTask: t,
      })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filters and sorting logic for Approve Uploads (constrained by folder)
  const APPROVAL_STATUS_OPTIONS = [
    { id: "ALL", label: "All Statuses" },
    { id: "PENDING", label: "Pending Review" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
  ];

  const APPROVAL_TYPE_OPTIONS = [
    { id: "ALL", label: "All Types" },
    { id: "MATERIAL", label: "Learning Materials" },
    { id: "TASK_PROOF", label: "Task Proofs" },
  ];

  const APPROVAL_SORT_OPTIONS = [
    { id: "newest", label: "Newest First" },
    { id: "oldest", label: "Oldest First" },
    { id: "title", label: "Title A-Z" },
  ];

  const filteredApprovals = combinedApprovals.filter((m) => {
    // Must match selected folder
    if (selectedApprovalClassFolder && !getApprovalClass(m).split(",").map(c => c.trim()).filter(Boolean).includes(selectedApprovalClassFolder)) {
      return false;
    }

    const matchesSearch =
      m.title.toLowerCase().includes(approvalSearch.toLowerCase()) ||
      (m.uploadedBy?.name ?? "").toLowerCase().includes(approvalSearch.toLowerCase()) ||
      (m.uploadedBy?.email ?? "").toLowerCase().includes(approvalSearch.toLowerCase());

    let matchesStatus = true;
    if (approvalStatusFilter !== "ALL") {
      const isApproved = m.isTask ? m.status === "APPROVED" : m.isApproved;
      const isRejected = m.isTask ? m.status === "REJECTED" : false;
      const isPending = m.isTask ? (m.status !== "APPROVED" && m.status !== "REJECTED") : !m.isApproved;

      if (approvalStatusFilter === "APPROVED") matchesStatus = isApproved;
      else if (approvalStatusFilter === "REJECTED") matchesStatus = isRejected;
      else if (approvalStatusFilter === "PENDING") matchesStatus = isPending;
    }

    const matchesType =
      approvalTypeFilter === "ALL" ||
      (approvalTypeFilter === "TASK_PROOF" && m.isTask) ||
      (approvalTypeFilter === "MATERIAL" && !m.isTask);

    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedFilteredApprovals = [...filteredApprovals].sort((a, b) => {
    if (approvalSort === "title") {
      return a.title.localeCompare(b.title);
    }
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return approvalSort === "oldest" ? timeA - timeB : timeB - timeA;
  });

  const approvalPagination = useAdminPagination(
    sortedFilteredApprovals,
    [
      selectedApprovalClassFolder,
      approvalSearch,
      approvalStatusFilter,
      approvalTypeFilter,
      approvalSort,
      materials.length,
      tasks.length,
    ],
    10
  );

  // Filters and sorting logic for Assign Tasks (recurringTasks) - flat list
  const RECURRING_TASK_CLASS_OPTIONS = [
    { id: "ALL", label: "All Classes" },
    { id: "Playgroup", label: "Playgroup" },
    { id: "Pre-KG", label: "Pre-KG" },
    { id: "LKG", label: "LKG" },
    { id: "UKG", label: "UKG" },
  ];

  const RECURRING_TASK_STATUS_OPTIONS = [
    { id: "ALL", label: "All Statuses" },
    { id: "ACTIVE", label: "Active" },
    { id: "INACTIVE", label: "Inactive" },
  ];

  const RECURRING_TASK_SORT_OPTIONS = [
    { id: "newest", label: "Newest First" },
    { id: "oldest", label: "Oldest First" },
    { id: "title", label: "Title A-Z" },
  ];

  const filteredRecurringTasks = recurringTasks.filter((rt) => {
    if (selectedTaskFolder) {
      if (rt.folderId !== selectedTaskFolder.id) return false;
    } else {
      if (rt.folderId !== null && rt.folderId !== undefined) return false;
    }

    const matchesSearch =
      rt.title.toLowerCase().includes(recurringTaskSearch.toLowerCase()) ||
      (rt.description ?? "").toLowerCase().includes(recurringTaskSearch.toLowerCase());

    const matchesClass =
      recurringTaskClassFilter === "ALL" || rt.studentClass === recurringTaskClassFilter;

    const matchesStatus =
      recurringTaskStatusFilter === "ALL" ||
      (recurringTaskStatusFilter === "ACTIVE" && rt.isActive) ||
      (recurringTaskStatusFilter === "INACTIVE" && !rt.isActive);

    return matchesSearch && matchesClass && matchesStatus;
  });

  const sortedFilteredRecurringTasks = [...filteredRecurringTasks].sort((a, b) => {
    if (recurringTaskSort === "title") {
      return a.title.localeCompare(b.title);
    }
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return recurringTaskSort === "oldest" ? timeA - timeB : timeB - timeA;
  });

  const recurringTaskPagination = useAdminPagination(
    sortedFilteredRecurringTasks,
    [
      selectedTaskFolder,
      recurringTaskSearch,
      recurringTaskClassFilter,
      recurringTaskStatusFilter,
      recurringTaskSort,
      recurringTasks.length,
    ],
    10
  );

  async function handleMarkAdminNotificationRead(notificationId: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`notification-read-${notificationId}`);
    try {
      await api.markAdminNotificationRead(token, notificationId);
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setMessage("Notification marked as read.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update notification.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkAllAdminNotificationsRead() {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading("notifications-read-all");
    try {
      await api.markAllAdminNotificationsRead(token);
      setAdminNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setMessage("All notifications marked as read.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update notifications.");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredNotifications = adminNotifications
    .filter((n) => {
      const q = notificationSearch.toLowerCase().trim();
      if (q) {
        const titleMatch = n.title.toLowerCase().includes(q);
        const msgMatch = n.message.toLowerCase().includes(q);
        if (!titleMatch && !msgMatch) return false;
      }
      if (notificationFilter === "UNREAD") return !n.isRead;
      if (notificationFilter === "READ") return n.isRead;

      if (notificationTypeFilter !== "ALL") {
        const typeStr = (n.type || "").toUpperCase();
        if (notificationTypeFilter === "PAYMENT" && !typeStr.includes("PAYMENT")) return false;
        if (notificationTypeFilter === "TASK" && !typeStr.includes("TASK")) return false;
        if (notificationTypeFilter === "USER" && !typeStr.includes("USER") && !typeStr.includes("REGISTER") && !typeStr.includes("TEACHER")) return false;
      }

      if (notificationDateFilter !== "ALL") {
        const notifDate = new Date(n.createdAt);
        const now = new Date();
        if (notificationDateFilter === "TODAY") {
          const isToday = notifDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (notificationDateFilter === "WEEK") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          if (notifDate < oneWeekAgo) return false;
        } else if (notificationDateFilter === "MONTH") {
          const oneMonthAgo = new Date();
          oneMonthAgo.setDate(now.getDate() - 30);
          if (notifDate < oneMonthAgo) return false;
        } else if (notificationDateFilter === "CUSTOM") {
          if (notificationStartDate) {
            const start = new Date(`${notificationStartDate}T00:00:00`);
            if (notifDate < start) return false;
          }
          if (notificationEndDate) {
            const end = new Date(`${notificationEndDate}T23:59:59`);
            if (notifDate > end) return false;
          }
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const notificationPagination = useAdminPagination(
    filteredNotifications,
    [notificationSearch, notificationFilter, notificationTypeFilter, notificationDateFilter, notificationStartDate, notificationEndDate, adminNotifications.length],
    4
  );

  const notificationFilterOptions = [
    { id: "ALL", label: "All Statuses" },
    { id: "UNREAD", label: "Unread" },
    { id: "READ", label: "Read" },
  ];

  const notificationTypeOptions = [
    { id: "ALL", label: "All Categories" },
    { id: "PAYMENT", label: "Payments" },
    { id: "TASK", label: "Tasks" },
    { id: "USER", label: "Accounts" },
  ];

  const notificationDateOptions = [
    { id: "ALL", label: "All Time" },
    { id: "TODAY", label: "Today" },
    { id: "WEEK", label: "Last 7 Days" },
    { id: "MONTH", label: "Last 30 Days" },
    { id: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <>
<AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
              <AdminPageHeader
                title="Approve Learning Materials"
                description="Review educational resources and files uploaded by teachers before publishing them to the student portal."
              />

              <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {!selectedApprovalClassFolder ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-6 overflow-y-auto modern-scrollbar bg-slate-50/50">
                    {["Playgroup", "Pre-KG", "LKG", "UKG"].map((className) => {
                      const classApprovals = combinedApprovals.filter(a =>
                        getApprovalClass(a)
                          .split(",")
                          .map(c => c.trim())
                          .filter(Boolean)
                          .includes(className)
                      );
                      const pendingCount = classApprovals.filter(a => a.isTask ? (a.status !== "APPROVED" && a.status !== "REJECTED") : !a.isApproved).length;
                      return (
                        <button
                          key={className}
                          onClick={() => setSelectedApprovalClassFolder(className)}
                          className="flex flex-col p-6 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group relative shadow-sm"
                        >
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                            <Folder className="w-6 h-6 fill-indigo-100 text-indigo-500" />
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-650 transition-colors">{className}</h3>
                          <div className="flex items-center justify-between w-full mt-3">
                            <span className="text-xs text-slate-400 font-medium">
                              {classApprovals.length} total items
                            </span>
                            {pendingCount > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                                {pendingCount} Pending
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Clean
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-x-4 gap-y-3 pb-3 w-full min-w-0">
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <button
                          onClick={() => setSelectedApprovalClassFolder(null)}
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 transition border border-slate-200 bg-white shadow-sm"
                          title="Back to folders"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 text-slate-800 min-w-0">
                          <FolderOpen className="w-5 h-5 text-[#8AC926] shrink-0" />
                          <h2 className="font-sans text-lg sm:text-xl font-extrabold text-slate-900 break-words truncate">{selectedApprovalClassFolder} Uploads</h2>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:max-w-full sm:ml-auto min-w-0">
                        <AdminSearchInput
                          placeholder="Search uploads…"
                          value={approvalSearch}
                          onChange={setApprovalSearch}
                          ariaLabel="Search learning materials and task proofs"
                        />
                        <PillSelect
                          value={approvalTypeFilter}
                          options={APPROVAL_TYPE_OPTIONS}
                          onChange={setApprovalTypeFilter}
                          ariaLabel="Filter by type"
                        />
                        <PillSelect
                          value={approvalStatusFilter}
                          options={APPROVAL_STATUS_OPTIONS}
                          onChange={setApprovalStatusFilter}
                          ariaLabel="Filter by status"
                        />
                        <PillSelect
                          value={approvalSort}
                          options={APPROVAL_SORT_OPTIONS}
                          onChange={setApprovalSort}
                          ariaLabel="Sort order"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50 p-4">
                      {sortedFilteredApprovals.length === 0 ? (
                        <AdminListEmpty message={`No learning materials or task proofs match your search or filters for ${selectedApprovalClassFolder}.`} />
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
                          <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto modern-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 font-semibold w-[35%]">Material / Task Uploaded</th>
                                  <th className="px-4 py-3 font-semibold w-[15%]">Type</th>
                                  <th className="px-4 py-3 font-semibold w-[20%]">Uploaded By</th>
                                  <th className="px-4 py-3 font-semibold w-[15%]">Uploaded On</th>
                                  <th className="px-4 py-3 font-semibold w-[15%]">Status</th>
                                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {approvalPagination.paginatedItems.map((m) => (
                                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 align-middle min-w-0">
                                      <div className="flex flex-col space-y-1">
                                        <span className="font-bold text-sm text-[#8AC926] break-all whitespace-normal">
                                          {m.title}
                                        </span>
                                        {m.description && (
                                          <p className="text-2xs text-slate-400 line-clamp-2 break-all whitespace-normal">
                                            {m.description}
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-xs font-semibold text-slate-600">
                                      {m.isTask ? "Task Proof" : "Learning Material"}
                                    </td>
                                    <td className="px-4 py-3 align-middle min-w-0">
                                      <div className="flex flex-col space-y-0.5">
                                        <p className="text-xs font-semibold text-slate-700 break-all whitespace-normal">
                                          {m.uploadedBy?.name ?? "Admin"}
                                        </p>
                                        {m.uploadedBy?.email && (
                                          <p className="text-2xs text-slate-450 break-all whitespace-normal">
                                            {m.uploadedBy.email}
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-xs text-slate-500">
                                      {new Date(m.createdAt).toLocaleDateString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <div className="flex items-center gap-1.5">
                                        {m.isTask ? (
                                          <span
                                            className={`px-2.5 py-0.5 rounded-lg text-2xs font-extrabold uppercase border shrink-0 ${
                                              m.status === "APPROVED"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : m.status === "REJECTED"
                                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                                  : m.status === "RESUBMITTED"
                                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                                  : m.status === "UNDER_REVIEW"
                                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                            }`}
                                          >
                                            {m.status === "APPROVED"
                                              ? "Approved"
                                              : m.status === "REJECTED"
                                                ? "Rejected"
                                                : m.status === "RESUBMITTED"
                                                ? "Resubmitted"
                                                : m.status === "UNDER_REVIEW"
                                                ? "Under Review"
                                                : "Submitted"}
                                          </span>
                                        ) : (
                                          <span
                                            className={`px-2.5 py-0.5 rounded-lg text-2xs font-extrabold uppercase border shrink-0 ${
                                              m.isApproved
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}
                                          >
                                            {m.isApproved ? "Approved" : "Pending Review"}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 text-right align-middle">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setViewDetailsModal(m)}
                                          title="View Details"
                                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        {m.isTask ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleViewHistory(m.id)}
                                              title="View History"
                                              className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition"
                                            >
                                              <HistoryIcon className="w-4 h-4" />
                                            </button>
                                            {(m.status === "SUBMITTED" || m.status === "RESUBMITTED" || m.status === "UNDER_REVIEW" || m.status === "REJECTED") && (
                                              <button
                                                disabled={actionLoading === `task-approve-${m.id}`}
                                                onClick={() => handleApproveTaskProof(m.id, true)}
                                                title="Approve"
                                                className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                                              >
                                                {actionLoading === `task-approve-${m.id}` ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <Check className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                            {(m.status === "SUBMITTED" || m.status === "RESUBMITTED" || m.status === "UNDER_REVIEW") && (
                                              <button
                                                disabled={actionLoading === `task-approve-${m.id}`}
                                                onClick={() => {
                                                  setRejectTaskForm({ id: m.id, reason: "" });
                                                  setShowRejectTaskForm(true);
                                                }}
                                                title="Reject"
                                                className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                                              >
                                                {actionLoading === `task-approve-${m.id}` ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <X className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                            {(m.status === "APPROVED" || m.status === "REJECTED") && (
                                              <button
                                                disabled={actionLoading === `task-approve-${m.id}`}
                                                onClick={() => handleRevokeTaskProof(m.id)}
                                                title="Revoke Approval/Rejection"
                                                className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                                              >
                                                {actionLoading === `task-approve-${m.id}` ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <RotateCcw className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              disabled={actionLoading === `task-delete-${m.id}`}
                                              onClick={() => handleDeleteTask(m.id)}
                                              title="Delete Proof"
                                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                                            >
                                              {actionLoading === `task-delete-${m.id}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-4 h-4" />
                                              )}
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {!m.isApproved ? (
                                              <button
                                                disabled={actionLoading === `material-approve-${m.id}`}
                                                onClick={() => handleApproveMaterial(m.id, true)}
                                                title="Approve"
                                                className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                                              >
                                                {actionLoading === `material-approve-${m.id}` ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <Check className="w-4 h-4" />
                                                )}
                                              </button>
                                            ) : (
                                              <button
                                                disabled={actionLoading === `material-approve-${m.id}`}
                                                onClick={() => handleApproveMaterial(m.id, false)}
                                                title="Revoke Approval"
                                                className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                                              >
                                                {actionLoading === `material-approve-${m.id}` ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <RotateCcw className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              disabled={actionLoading === `material-delete-${m.id}`}
                                              onClick={() => handleDeleteMaterial(m.id)}
                                              title="Delete Material"
                                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                                            >
                                              {actionLoading === `material-delete-${m.id}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-4 h-4" />
                                              )}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <AdminListPagination
                              rangeStart={approvalPagination.rangeStart}
                              rangeEnd={approvalPagination.rangeEnd}
                              total={sortedFilteredApprovals.length}
                              safePage={approvalPagination.safePage}
                              totalPages={approvalPagination.totalPages}
                              pageNumbers={approvalPagination.pageNumbers}
                              onPageChange={approvalPagination.setCurrentPage}
                              itemLabel="uploads"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AdminPageBody>

              {/* REJECT TASK PROOF MODAL */}
              {showRejectTaskForm && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative">
                    <ModalCloseButton
                      onClick={() => {
                        setShowRejectTaskForm(false);
                        setRejectTaskForm({ id: "", reason: "" });
                      }}
                      className="absolute top-4 right-4"
                    />
                    <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">
                      Provide a reason for rejection
                    </h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!rejectTaskForm.reason.trim()) {
                          setError("Reason is required.");
                          return;
                        }
                        handleApproveTaskProof(rejectTaskForm.id, false, rejectTaskForm.reason.trim());
                        setShowRejectTaskForm(false);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">Rejection Reason</label>
                        <textarea
                          rows={3}
                          placeholder="Explain why this task was rejected..."
                          value={rejectTaskForm.reason}
                          onChange={(e) => setRejectTaskForm({ ...rejectTaskForm, reason: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition resize-none"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectTaskForm(false)}
                          className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition shadow-md shadow-rose-500/20"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {viewDetailsModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative max-h-[90vh] overflow-hidden flex flex-col">
                    <ModalCloseButton
                      onClick={() => setViewDetailsModal(null)}
                      className="absolute top-4 right-4"
                    />
                    <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10 shrink-0">
                      {viewDetailsModal.isTask ? "Task Proof Details" : "Learning Material Details"}
                    </h3>

                    <div className="space-y-6 overflow-y-auto modern-scrollbar pr-2 flex-1">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-bold text-slate-900 text-xs mb-1">
                          {viewDetailsModal.isTask ? "Assigned Task" : "Material"}
                        </p>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-[#8AC926] text-sm">{viewDetailsModal.title}</span>
                          <span className={`px-2 py-0.5 rounded text-4xs font-extrabold uppercase border ${
                            viewDetailsModal.isApproved || viewDetailsModal.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : viewDetailsModal.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : viewDetailsModal.status === "COMPLETED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {viewDetailsModal.isTask ? (viewDetailsModal.status === "COMPLETED" ? "Submitted" : viewDetailsModal.status) : (viewDetailsModal.isApproved ? "Approved" : "Pending Review")}
                          </span>
                        </div>
                        {viewDetailsModal.isTask && viewDetailsModal.originalTask?.description && (
                          <p className="text-xs text-slate-600 whitespace-pre-wrap mb-3">{viewDetailsModal.originalTask.description}</p>
                        )}
                        {!viewDetailsModal.isTask && viewDetailsModal.originalMaterial?.description && (
                          <p className="text-xs text-slate-600 whitespace-pre-wrap mb-3">{viewDetailsModal.originalMaterial.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200/60 flex-wrap">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            By: {viewDetailsModal.uploadedBy?.name || "Admin"} {viewDetailsModal.uploadedBy?.email ? `(${viewDetailsModal.uploadedBy.email})` : ""}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            Uploaded: {new Date(viewDetailsModal.createdAt).toLocaleDateString()}
                          </span>
                          {viewDetailsModal.isTask && viewDetailsModal.originalTask?.dueDate && (
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              Due: {new Date(viewDetailsModal.originalTask.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {(viewDetailsModal.description || viewDetailsModal.fileUrl) && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 mb-2">
                            {viewDetailsModal.isTask ? (viewDetailsModal.status === "REJECTED" ? "Rejection Reason / Comments" : "Teacher Comments / Proof") : "Uploaded File"}
                          </h4>
                          {viewDetailsModal.description && (
                            <div className={`p-4 rounded-xl border mb-3 ${viewDetailsModal.isTask && viewDetailsModal.status === "REJECTED" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-slate-50 border-slate-100 text-slate-700"}`}>
                              <p className="text-xs font-medium whitespace-pre-wrap">{viewDetailsModal.description}</p>
                            </div>
                          )}
                          {viewDetailsModal.fileUrl && (
                            <a
                              href={resolveStorageUrl(viewDetailsModal.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-400" />
                              View Uploaded {viewDetailsModal.isTask ? "Proof" : "Material"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewDetailsModal(null)}
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
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative max-h-[80vh] flex flex-col">
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
                      ) : taskAuditHistory.length === 0 ? (
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

              <ConfirmDialog
                open={confirmDelete !== null}
                title={confirmDelete?.title || "Are you sure?"}
                message={confirmDelete?.message || ""}
                confirmLabel="Delete"
                variant="danger"
                loading={actionLoading !== null && actionLoading.includes("delete")}
                onCancel={() => setConfirmDelete(null)}
                onConfirm={handleConfirmDelete}
              />
            </AdminPageShell>
    </>
  );
}
