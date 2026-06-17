import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { ADMIN_TAB_PATHS, type AdminTab } from "../../lib/adminRoutes";
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
  type Testimonial,
  type DashboardStats,
  type GoogleLocationSummary,
  type PublicReview,
  type AdminNotification,
  type LibraryFolder,
} from "../../lib/api";
import { clearSession } from "../../lib/auth";
import { isActionBusy } from "../../lib/actionGuard";
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
  Phone,
  MapPin,
  FolderPlus,
  Folder,
  FolderOpen,
  FolderInput,
  ChevronDown,
  Home,
  MoreVertical,
} from "lucide-react";
import { AdminPeoplePanel } from "../AdminPeoplePanel";
import { AdminPaymentsPanel } from "../AdminPaymentsPanel";
import { AdminLessonPlansPanel } from "../AdminLessonPlansPanel";
import { ConfirmDialog } from "../ConfirmDialog";
import { RecentPaymentCard, sortPaymentsNewestFirst } from "../RecentPaymentCard";
import { StoryBookActions } from "../StoryBookActions";
import { GalleryItemActions } from "../GalleryItemActions";
import { PortalSelect } from "../PortalSelect";
import { PortalDateRangePicker } from "../PortalDateRangePicker";
import { AdminSettingsPanel } from "../AdminSettingsPanel";
import { LIBRARY_AUDIENCE_OPTIONS, audienceLabel } from "../../lib/library";
import {
  STUDENT_CLASS_OPTIONS,
  STORY_BOOK_ACCEPT,
  isValidStoryBookFile,
  type StudentClassLevel,
} from "../../lib/constants";
import type { LibraryAudience } from "../../lib/library";
import { resolveStorageUrl } from "../../lib/storage";
import { isDateTodayOrFuture, localDateInputMin } from "../../lib/dates";
import { ModalCloseButton } from "../ModalCloseButton";
import { GoogleReviewCard } from "../GoogleReviewCard";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../AdminPageShell";
import {
  PortalPageShell,
  portalDashboardBodyClass,
  portalDashboardLowerGridClass,
} from "../PortalPageShell";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  PillSelect,
  adminListRowClass,
  adminListRowStackClass,
  useAdminPagination,
} from "../AdminListUi";
import { useAdminOutlet } from "./AdminOutletContext";
import { AdminTabLoader } from "./AdminTabLoader";
import { AdminNotificationBell } from "./AdminNotificationBell";

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

export function AdminTabBody({ tab }: { tab: AdminTab }) {
  const navigate = useNavigate();
  const { token, user, setMessage, setError } = useAdminOutlet();
  const activeTab = tab;

  function goToTab(next: AdminTab) {
    if (activeTab !== next) navigate(ADMIN_TAB_PATHS[next]);
  }

  const [inquirySubTab, setInquirySubTab] = useState<"general" | "franchise">("general");

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
  const [showRejectTaskForm, setShowRejectTaskForm] = useState(false);
  const [rejectTaskForm, setRejectTaskForm] = useState({ id: "", reason: "" });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});

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

  const [testimonialForm, setTestimonialForm] = useState({ name: "", content: "", rating: 5 });
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  // New Direct File Upload States
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    type: "course" | "material" | "task" | "book" | "folder" | "gallery" | "testimonial";
    id: string;
    title: string;
    message: string;
  } | null>(null);

  // Fetch data specifically for the active tab
  useEffect(() => {
    if (!token) return;
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
        const [allTasks, allUsers] = await Promise.all([
          api.getTasks(token),
          api.getUsers(token), // To populate the assign-to-teacher select options
        ]);
        setTasks(allTasks);
        setUsers(allUsers);
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
      const created = await api.createTask(token, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        dueDate: new Date(`${taskForm.dueDate}T12:00:00`).toISOString(),
        teacherId: taskForm.teacherId,
      });
      setTasks((prev) => [created, ...prev]);
      setMessage("Task assigned successfully.");
      setTaskForm({ title: "", description: "", dueDate: "", teacherId: "" });
      setTaskFormErrors({});
      setShowTaskForm(false);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.errors)) {
          if (messages[0]) mapped[key] = messages[0];
        }
        setTaskFormErrors(mapped);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to assign task.");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveTaskProof(taskId: string, approve: boolean, rejectReason?: string) {
    if (!token || isActionBusy(actionLoading)) return;
    setActionLoading(`task-approve-${taskId}`);
    try {
      const updated = await api.approveTask(token, taskId, {
        status: approve ? "APPROVED" : "REJECTED",
        proofDesc: approve ? "Approved by Admin" : (rejectReason || "Rejected by Admin"),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setMessage(approve ? "Task proof approved!" : "Task proof rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to review task proof.");
    } finally {
      setActionLoading(null);
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

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.author ?? "").toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(bookSearch.toLowerCase())
  );

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

  const combinedItems = [
    ...folders.map((f) => ({ ...f, isFolder: true })),
    ...filteredBooks.map((b) => ({ ...b, isFolder: false })),
  ];
  const bookPagination = useAdminPagination(combinedItems, [bookSearch, books.length, folders.length], 10);
  const galleryPagination = useAdminPagination(filteredGallery, [gallerySearch, gallery.length]);
  const inquiryPagination = useAdminPagination(
    filteredInquiries,
    [inquirySearch, inquirySubTab, inquiries.length, franchiseInquiries.length],
    4
  );

  const taskStatusOptions = [
    { id: "ALL", label: "All Statuses" },
    { id: "PENDING", label: "Pending" },
    { id: "COMPLETED", label: "Completed" },
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
    })),
    ...tasks
      .filter((t) => t.proofUrl)
      .map((t) => ({
        id: t.id,
        title: `[Task Proof] ${t.title}`,
        description: t.proofDesc,
        type: "TASK_PROOF",
        fileUrl: t.proofUrl!,
        course: { title: "N/A (Task Assignment)" },
        uploadedBy: t.teacher ? { name: t.teacher.name, email: t.teacher.email } : null,
        isApproved: t.status === "APPROVED",
        createdAt: t.updatedAt || t.createdAt,
        isTask: true,
        status: t.status,
      })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const approvalPagination = useAdminPagination(
    combinedApprovals,
    [materials.length, tasks.length],
    3
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
    <PortalPageShell className="!overflow-visible">
      {activeTab === "overview" && (
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3 mb-5 shrink-0 select-none w-full min-w-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
              Simba Academy Workspace
            </h2>
            <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase">
              Secure Administrator Command Center
            </p>
          </div>
          <div className="flex items-center gap-3">
            {token && <AdminNotificationBell token={token} />}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-[#8AC926]/10 hover:border-[#8AC926]/40 transition-all duration-300"
            >
              <ExternalLink className="w-3 h-3 text-[#8AC926]" />
              View Live Site
            </a>
          </div>
        </div>
      )}

      {loading &&
      activeTab !== "users" &&
      activeTab !== "teachers" &&
      activeTab !== "payments" &&
      activeTab !== "planner" ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
          <p className="font-bold text-[#8AC926] mt-2">Loading dashboard data…</p>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in flex-1 flex flex-col min-h-0 w-full min-w-0 max-w-full overflow-visible pb-6 lg:pb-8">
          {/* ────────────────── OVERVIEW TAB ────────────────── */}
          {activeTab === "overview" && (
            <div className={portalDashboardBodyClass}>
              {/* Three Main Metric Cards (Matched Height & Side-by-Side) */}
              {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch shrink-0">
                  {/* Members overview — light green panel */}
                  <div className="bg-[#F3FAEB] border border-green-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[190px] h-full shrink-0">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold tracking-wider text-[10px] uppercase text-green-800">
                          Registered Members
                        </span>
                        <div className="p-1.5 bg-green-100 rounded-xl border border-green-200">
                          <Users className="w-3.5 h-3.5 text-[#6B9E1A]" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-green-600/80 tracking-widest block uppercase">
                            Active accounts
                          </span>
                          <h3 className="text-2xl font-bold text-slate-800 leading-none tracking-tight">
                            {stats.users} Active
                          </h3>
                        </div>

                        <div className="bg-white rounded-xl p-2.5 border border-green-100 flex items-center -space-x-2">
                          {[
                            "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=100&h=100&q=80",
                            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
                            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
                          ].map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`User Avatar ${idx + 1}`}
                              className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 object-cover"
                            />
                          ))}
                          <span className="text-[9px] font-bold text-slate-600 pl-3 leading-none uppercase tracking-wider">
                            Teachers &amp; Students
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-green-100 pt-2 mt-2">
                      <button
                        type="button"
                        onClick={() => goToTab("users")}
                        className="text-[9px] font-extrabold uppercase tracking-widest text-green-700 hover:underline inline-arrow"
                      >
                        Manage Users <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[9px] font-extrabold text-slate-500">
                        Total: {stats.users}
                      </span>
                    </div>
                  </div>

                  {/* Revenue / payments overview — light blue panel */}
                  <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[190px] h-full shrink-0">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold tracking-wider text-[10px] uppercase text-blue-800">
                          Zoho Payments Revenue
                        </span>
                        <div className="p-1.5 bg-blue-100 rounded-xl border border-blue-200">
                          <CreditCard className="w-3.5 h-3.5 text-[#1364F1]" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-600/80 tracking-widest block uppercase">
                            Recent Payments
                          </span>
                          <h4 className="font-bold text-xs uppercase leading-tight tracking-wider text-slate-800">
                            Enrollment Payments
                          </h4>
                        </div>

                        <div className="space-y-1.5">
                          {recentPaymentsTop.length === 0 ? (
                            <div className="bg-white rounded-xl p-2.5 border border-blue-100 text-xs text-center text-slate-600 font-semibold">
                              No payments yet.
                            </div>
                          ) : (
                            recentPaymentsTop.map((p) => (
                              <RecentPaymentCard key={p.id} payment={p} theme="blue" compact />
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-blue-100 pt-2 mt-2 gap-2">
                      <button
                        type="button"
                        onClick={() => goToTab("payments")}
                        className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700 hover:underline inline-arrow shrink-0"
                      >
                        Manage Payments <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[9px] font-extrabold text-slate-500 text-right leading-tight">
                        <span className="text-emerald-700">
                          ₹{stats.revenue.toLocaleString("en-IN")}
                        </span>
                        {" · "}
                        {payments.length} total record{payments.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  {/* Today's Schedule — light purple panel */}
                  <div className="bg-[#F5F3FF] border border-violet-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[190px] h-full shrink-0">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold tracking-wider text-[10px] uppercase text-violet-800">
                          Today's Schedule
                        </span>
                        <div className="p-1.5 bg-violet-100 rounded-xl border border-violet-200">
                          <Calendar className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-violet-600/80 tracking-widest block uppercase">
                            Recent Tasks
                          </span>
                          <h4 className="font-bold text-xs uppercase leading-tight tracking-wider text-slate-800">
                            Teacher Assignments
                          </h4>
                        </div>

                        <div className="space-y-1.5">
                          {tasks.length === 0 ? (
                            <div className="bg-white rounded-xl p-3 border border-violet-100 text-xs text-center text-slate-600 font-semibold">
                              No recent tasks assigned.
                            </div>
                          ) : (
                            [...tasks]
                              .sort(
                                (a, b) =>
                                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                              )
                              .slice(0, 2)
                              .map((task) => (
                                <div
                                  key={task.id}
                                  className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs flex flex-col gap-1"
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="font-bold text-slate-800 text-2xs truncate max-w-[120px]">
                                      {task.title}
                                    </span>
                                    <span
                                      className={`px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase shrink-0 ${
                                        task.status === "APPROVED" || task.status === "COMPLETED"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : task.status === "PENDING"
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                      }`}
                                    >
                                      {task.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold">
                                    <span>To: {task.teacher?.name ?? "Staff"}</span>
                                    {task.dueDate && (
                                      <span>
                                        Due:{" "}
                                        {new Date(task.dueDate).toLocaleDateString("en-IN", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-violet-100 pt-2 mt-2">
                      <button
                        type="button"
                        onClick={() => goToTab("tasks")}
                        className="text-[9px] font-extrabold uppercase tracking-widest text-violet-700 hover:underline inline-arrow"
                      >
                        Manage Tasks <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[9px] font-extrabold text-slate-500">
                        Total: {tasks.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Split Workspace Layout */}
              <div className={portalDashboardLowerGridClass}>
                {/* Left & Middle Column Workspace (Main Content - 2/3 Width) */}
                <div className="lg:col-span-2 flex flex-col">
                  {/* Financial Audit Logs Table Card */}
                  <div
                    id="recent-transactions"
                    className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Recent Payments
                        </h3>
                        <p className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase mt-0.5">
                          Latest enrollment transactions
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToTab("payments")}
                        className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700 hover:underline inline-arrow"
                      >
                        View all <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {recentPaymentsList.length === 0 ? (
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-xs text-center text-slate-600 font-semibold">
                          No payments recorded yet.
                        </div>
                      ) : (
                        recentPaymentsList.map((p) => (
                          <RecentPaymentCard key={p.id} payment={p} theme="slate" />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Auxiliary Column (Today's Actions & Analytics - 1/3 Width) */}
                <div className="flex flex-col">
                  {/* Academy Stats & Analytics Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col">
                    <div className="space-y-5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="font-bold text-[10px] uppercase text-slate-800 tracking-wider">
                          Academy Analytics
                        </h4>
                        <TrendingUp className="w-4 h-4 text-[#8AC926]" />
                      </div>

                      {/* Metrics — flat row style (matches admission leads) */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="p-2.5 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                            Total Materials
                          </span>
                          <span className="text-lg font-bold text-[#FF9F1C] leading-none">
                            {stats?.materials ?? 0}
                          </span>
                        </div>
                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                            Pending Review
                          </span>
                          <span className="text-lg font-bold text-indigo-600 leading-none">
                            {stats?.pendingApprovals ?? 0}
                          </span>
                        </div>
                        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                            Unread Leads
                          </span>
                          <span className="text-lg font-bold text-rose-600 leading-none">
                            {stats?.unreadInquiries ?? 0}
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#8AC926]/5 border border-[#8AC926]/15 rounded-xl flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                            Total General Enquiries
                          </span>
                          <span className="text-lg font-bold text-[#8AC926] leading-none">
                            {inquiries.length}
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">
                            Total Franchise Enquiries
                          </span>
                          <span className="text-lg font-bold text-[#FF9F1C] leading-none">
                            {franchiseInquiries.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && token && (
            <AdminPeoplePanel
              mode="users"
              token={token}
              currentUserId={user?.id}
              onNotify={setMessage}
              onError={setError}
            />
          )}

          {activeTab === "payments" && token && (
            <AdminPaymentsPanel token={token} onError={setError} />
          )}

          {activeTab === "teachers" && token && (
            <AdminPeoplePanel
              mode="teachers"
              token={token}
              currentUserId={user?.id}
              onNotify={setMessage}
              onError={setError}
            />
          )}

          {activeTab === "courses" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Preschool & Phonics Courses"
                description="Design educational tracks, update catalog items, and set class fee structures."
                actions={
                  <button
                    type="button"
                    onClick={() => {
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
                      setShowCourseForm(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10"
                  >
                    <Plus className="w-4 h-4" /> Add Course Catalog
                  </button>
                }
              />

              <AdminPageBody>
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      placeholder="Search courses by catalog title..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs w-full outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 border border-slate-200">
                      No active courses in the catalog.
                    </div>
                  ) : (
                    filteredCourses.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col"
                      >
                        {c.imageUrl && (
                          <img
                            src={resolveStorageUrl(c.imageUrl)}
                            alt={c.title}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-2xs font-bold text-[#8AC926] uppercase">
                              {c.level}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${c.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}
                            >
                              {c.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800">{c.title}</h4>
                          {c.description && (
                            <p className="text-2xs text-slate-600 mt-1 line-clamp-2">
                              {c.description}
                            </p>
                          )}
                          <p className="text-sm font-bold text-emerald-600 mt-2">
                            ₹{c.price?.toLocaleString("en-IN") ?? "—"}
                          </p>
                          <div className="border-t border-slate-200 pt-3 mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCourseForm({
                                  id: c.id,
                                  title: c.title,
                                  description: c.description ?? "",
                                  level: c.level,
                                  price: c.price ?? "",
                                  imageUrl: c.imageUrl ?? "",
                                  isEditing: true,
                                });
                                setShowCourseForm(true);
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-2xs hover:bg-slate-100 flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === `course-active-${c.id}`}
                              onClick={() => handleToggleCourseActive(c.id, c.isActive ?? true)}
                              className="flex-1 py-1.5 rounded-xl font-bold text-2xs border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {actionLoading === `course-active-${c.id}` ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              ) : c.isActive ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === `course-delete-${c.id}`}
                              onClick={() => handleDeleteCourse(c.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {showCourseForm && (
                  <div
                    className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setShowCourseForm(false)}
                  >
                    <div
                      className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl border border-slate-200 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ModalCloseButton
                        onClick={() => setShowCourseForm(false)}
                        className="absolute top-4 right-4"
                      />
                      <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-5 pr-10">
                        {courseForm.isEditing ? "Edit Course" : "Add Course Catalog"}
                      </h3>
                      <form onSubmit={handleCourseSubmit} noValidate className="space-y-4">
                        <input
                          required
                          placeholder="Course title"
                          value={courseForm.title}
                          onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
                        />
                        <textarea
                          placeholder="Description"
                          value={courseForm.description}
                          onChange={(e) =>
                            setCourseForm({ ...courseForm, description: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926] min-h-[80px]"
                        />
                        <PortalSelect
                          value={courseForm.level}
                          onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                          className="rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
                        >
                          {[
                            "Daycare",
                            "Playgroup",
                            "Pre-KG",
                            "LKG",
                            "UKG",
                            "Phonics",
                            "Handwriting",
                            "Spoken English",
                            "Nursery",
                            "All",
                          ].map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </PortalSelect>
                        <input
                          required
                          type="number"
                          placeholder="Tuition fee (INR)"
                          value={courseForm.price}
                          onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCourseImageFile(e.target.files?.[0] ?? null)}
                          className="w-full text-xs"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading === "course-save"}
                          className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-bold text-xs uppercase disabled:opacity-60"
                        >
                          {actionLoading === "course-save"
                            ? "Saving…"
                            : courseForm.isEditing
                              ? "Save Changes"
                              : "Create Catalog Entry"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}

          {/* ────────────────── APPROVE UPLOADS ────────────────── */}
          {activeTab === "materials" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Approve Learning Materials"
                description="Review educational resources and files uploaded by teachers before publishing them to the student portal."
              />

              <AdminPageBody>
                {combinedApprovals.length === 0 ? (
                  <AdminListEmpty message="No learning materials or task proofs have been uploaded for review." />
                ) : (
                  <AdminRecordList>
                    {approvalPagination.paginatedItems.map((m) => (
                      <div key={m.id} className={adminListRowStackClass}>
                        <div className="flex-1 min-w-0 w-full space-y-1.5">
                          <a
                            href={resolveStorageUrl(m.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-sm text-[#8AC926] hover:underline inline-flex items-start gap-1.5 break-words"
                          >
                            <span className="min-w-0">{m.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          </a>
                          {m.description ? (
                            <p className="text-2xs text-slate-600 line-clamp-2 break-words">{m.description}</p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {m.isTask ? (
                              <span className="px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                TASK PROOF
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${
                                  m.type === "PDF"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}
                              >
                                {m.type}
                              </span>
                            )}
                            {m.isTask ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-2xs font-extrabold uppercase border ${
                                  m.status === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : m.status === "REJECTED"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {m.status === "APPROVED"
                                  ? "Approved"
                                  : m.status === "REJECTED"
                                    ? "Rejected"
                                    : "Pending Review"}
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-2xs font-extrabold uppercase border ${
                                  m.isApproved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {m.isApproved ? "Approved" : "Pending Review"}
                              </span>
                            )}
                          </div>
                          <p className="text-2xs text-slate-600 break-words">
                            <span className="font-semibold text-slate-700">
                              {m.uploadedBy?.name ?? "Admin"}
                            </span>
                            {m.uploadedBy?.email ? ` · ${m.uploadedBy.email}` : ""}
                          </p>
                          <p className="text-2xs text-slate-500">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end shrink-0">
                          {m.isTask ? (
                            <>
                              {(m.status === "COMPLETED" || m.status === "REJECTED") && (
                                <button
                                  disabled={actionLoading === `task-approve-${m.id}`}
                                  onClick={() => handleApproveTaskProof(m.id, true)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                                >
                                  {actionLoading === `task-approve-${m.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Approve"
                                  )}
                                </button>
                              )}
                              {m.status === "COMPLETED" && (
                                <button
                                  disabled={actionLoading === `task-approve-${m.id}`}
                                  onClick={() => {
                                    setRejectTaskForm({ id: m.id, reason: "" });
                                    setShowRejectTaskForm(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                                >
                                  {actionLoading === `task-approve-${m.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Reject"
                                  )}
                                </button>
                              )}
                              {m.status === "APPROVED" && (
                                <button
                                  disabled={actionLoading === `task-approve-${m.id}`}
                                  onClick={() => {
                                    setRejectTaskForm({ id: m.id, reason: "" });
                                    setShowRejectTaskForm(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                                >
                                  {actionLoading === `task-approve-${m.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Revoke"
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={actionLoading === `task-delete-${m.id}`}
                                onClick={() => handleDeleteTask(m.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                              >
                                {actionLoading === `task-delete-${m.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              {!m.isApproved ? (
                                <button
                                  disabled={actionLoading === `material-approve-${m.id}`}
                                  onClick={() => handleApproveMaterial(m.id, true)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                                >
                                  {actionLoading === `material-approve-${m.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Approve"
                                  )}
                                </button>
                              ) : (
                                <button
                                  disabled={actionLoading === `material-approve-${m.id}`}
                                  onClick={() => handleApproveMaterial(m.id, false)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                                >
                                  {actionLoading === `material-approve-${m.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Revoke"
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={actionLoading === `material-delete-${m.id}`}
                                onClick={() => handleDeleteMaterial(m.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50"
                              >
                                {actionLoading === `material-delete-${m.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <AdminListPagination
                      rangeStart={approvalPagination.rangeStart}
                      rangeEnd={approvalPagination.rangeEnd}
                      total={combinedApprovals.length}
                      safePage={approvalPagination.safePage}
                      totalPages={approvalPagination.totalPages}
                      pageNumbers={approvalPagination.pageNumbers}
                      onPageChange={approvalPagination.setCurrentPage}
                      itemLabel="uploads"
                    />
                  </AdminRecordList>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}

          {/* ────────────────── TASKS ASSIGNMENT ────────────────── */}
          {activeTab === "tasks" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Assign Tasks & Set Due Dates"
                description="Delegate tasks to your teachers, set exact due dates, and track their activity."
                actions={
                  <>
                    <div className="relative w-full min-w-0 sm:w-[260px] max-w-full">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        placeholder="Search title, teacher…"
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-xs w-full outline-none focus:border-[#8AC926] placeholder-slate-400 transition-all"
                        aria-label="Search tasks"
                      />
                    </div>
                    <PillSelect
                      value={taskStatusFilter}
                      options={taskStatusOptions}
                      onChange={setTaskStatusFilter}
                      ariaLabel="Filter by status"
                    />
                    <PillSelect
                      value={taskTeacherFilter}
                      options={taskTeacherOptions}
                      onChange={setTaskTeacherFilter}
                      ariaLabel="Filter by teacher"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTaskFormErrors({});
                        setShowTaskForm(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Assign Task
                    </button>
                  </>
                }
              />

              <AdminPageBody>
                {sortedFilteredTasks.length === 0 ? (
                  <AdminListEmpty message="No task assignments matched your search or filters." />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 px-2 sm:px-3 pt-2.5 sm:pt-3 pb-2 sm:pb-3 space-y-1.5">
                    {taskPagination.paginatedItems.map((t) => (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                                t.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : t.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : t.status === "COMPLETED"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-800">{t.title}</p>
                          {t.description && (
                            <p className="text-2xs text-slate-600 font-medium line-clamp-2">
                              {t.description}
                            </p>
                          )}
                          <p className="text-2xs text-slate-500 mt-0.5">
                            To:{" "}
                            <span className="font-semibold text-slate-700">
                              {t.teacher?.name ?? "—"}
                            </span>
                            {t.teacher?.email && <> · {t.teacher.email}</>}
                          </p>
                          {t.dueDate && (
                            <p className="text-2xs text-rose-600 font-semibold mt-0.5 inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due:{" "}
                              {new Date(t.dueDate).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={actionLoading === `task-delete-${t.id}`}
                            onClick={() => handleDeleteTask(t.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                            title="Delete task"
                          >
                            {actionLoading === `task-delete-${t.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    <AdminListPagination
                      rangeStart={taskPagination.rangeStart}
                      rangeEnd={taskPagination.rangeEnd}
                      total={sortedFilteredTasks.length}
                      safePage={taskPagination.safePage}
                      totalPages={taskPagination.totalPages}
                      pageNumbers={taskPagination.pageNumbers}
                      onPageChange={taskPagination.setCurrentPage}
                      itemLabel="tasks"
                    />
                  </div>
                )}

                {/* ASSIGN TASK FORM MODAL */}
                {showTaskForm && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative">
                      <ModalCloseButton
                        onClick={() => {
                          setTaskFormErrors({});
                          setShowTaskForm(false);
                        }}
                        className="absolute top-4 right-4"
                      />
                      <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">
                        Assign Task to Teacher
                      </h3>
                      <form onSubmit={handleAssignTask} noValidate className="space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Select Teacher
                          </label>
                          <PortalSelect
                            value={taskForm.teacherId}
                            onChange={(e) => {
                              clearTaskFieldError("teacherId");
                              setTaskForm({ ...taskForm, teacherId: e.target.value });
                            }}
                            className={taskFieldClass(Boolean(taskFormErrors.teacherId))}
                          >
                            <option value="" className="bg-white text-slate-800">
                              -- Choose a Teacher --
                            </option>
                            {teachersList.map((t) => (
                              <option key={t.id} value={t.id} className="bg-white text-slate-800">
                                {t.name} ({t.email})
                              </option>
                            ))}
                          </PortalSelect>
                          {taskFormErrors.teacherId && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-1">
                              {taskFormErrors.teacherId}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Task Title
                          </label>
                          <input
                            placeholder="e.g. Upload UKG Science lesson photos"
                            value={taskForm.title}
                            onChange={(e) => {
                              clearTaskFieldError("title");
                              setTaskForm({ ...taskForm, title: e.target.value });
                            }}
                            className={taskFieldClass(Boolean(taskFormErrors.title))}
                          />
                          <p className="text-[10px] text-slate-500 font-medium mt-1">
                            Minimum {TASK_TITLE_MIN} characters.
                          </p>
                          {taskFormErrors.title && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-1">
                              {taskFormErrors.title}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Task Description / Instructions
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Provide detailed instructions for the teacher..."
                            value={taskForm.description}
                            onChange={(e) => {
                              clearTaskFieldError("description");
                              setTaskForm({ ...taskForm, description: e.target.value });
                            }}
                            className={taskFieldClass(Boolean(taskFormErrors.description))}
                          />
                          <p className="text-[10px] text-slate-500 font-medium mt-1">
                            Minimum {TASK_DESCRIPTION_MIN} characters.
                          </p>
                          {taskFormErrors.description && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-1">
                              {taskFormErrors.description}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">Due Date</label>
                          <input
                            type="date"
                            min={localDateInputMin()}
                            value={taskForm.dueDate}
                            onChange={(e) => {
                              clearTaskFieldError("dueDate");
                              setTaskForm({ ...taskForm, dueDate: e.target.value });
                            }}
                            className={taskFieldClass(Boolean(taskFormErrors.dueDate))}
                          />
                          <p className="text-[10px] text-slate-500 font-medium mt-1">
                            Today or a future date only.
                          </p>
                          {taskFormErrors.dueDate && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-1">
                              {taskFormErrors.dueDate}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading === "task-assign"}
                          className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {actionLoading === "task-assign" ? "Assigning…" : "Assign Task"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}

          {activeTab === "planner" && token && (
            <AdminLessonPlansPanel token={token} onNotify={setMessage} onError={setError} />
          )}

          {/* ────────────────── STORY BOOKS LIBRARY ────────────────── */}
          {activeTab === "books" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Story Books Library (cPanel Storage)"
                description="Provision categorized children's books and bedtime stories directly to the student portal."
                actions={
                  <>
                    <AdminSearchInput
                      value={bookSearch}
                      onChange={setBookSearch}
                      placeholder="Search books…"
                      ariaLabel="Search story books"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(null);
                        setFolderForm({ name: "", audience: "BOTH", categories: [] });
                        setShowFolderForm(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-indigo-600 transition shadow-md shadow-indigo-500/10 whitespace-nowrap"
                    >
                      <FolderPlus className="w-4 h-4" /> New Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBookId(null);
                        setBookForm({ title: "", author: "", categories: ["Playgroup"], audience: "BOTH" });
                        setBookFile(null);
                        setShowBookForm(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Add Story Book
                    </button>
                  </>
                }
              />

              <AdminPageBody>
                {/* ── BREADCRUMB NAVIGATION ── */}
                {currentFolderId && (
                  <nav className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigateToFolder(null)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Home className="w-3.5 h-3.5" /> Root
                    </button>
                    {folderAncestors.map((anc, i) => (
                      <span key={anc.id} className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => navigateToFolder(anc.id)}
                          className={`px-2 py-1 rounded-lg transition hover:bg-slate-100 ${
                            i === folderAncestors.length - 1
                              ? "text-[#6B9E1A] bg-[#8AC926]/10"
                              : "hover:text-slate-700"
                          }`}
                        >
                          {anc.name}
                        </button>
                      </span>
                    ))}
                  </nav>
                )}

                {/* ── GOOGLE DRIVE STYLE LIST ── */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {combinedItems.length === 0 ? (
                    <AdminListEmpty message={currentFolderId ? "This folder is empty." : "No items match your search."} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Access</th>
                            <th className="px-4 py-3 font-semibold">Date Added</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bookPagination.paginatedItems.map((item: any) => {
                            if (item.isFolder) {
                              const f = item;
                              return (
                                <tr
                                  key={`folder-${f.id}`}
                                  className="hover:bg-slate-50 group transition cursor-pointer"
                                  onClick={() => navigateToFolder(f.id)}
                                >
                                  <td className="px-4 py-3 flex items-center gap-3 w-1/2">
                                    <Folder className="w-5 h-5 text-slate-400 fill-slate-400 shrink-0" />
                                    <span className="font-semibold text-slate-700 whitespace-normal break-words">{f.name}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-4xs font-extrabold uppercase border border-violet-200">
                                        {audienceLabel(f.audience ?? "BOTH")}
                                      </span>
                                      {f.category && (
                                        <span className="px-1.5 py-0.5 rounded bg-[#8AC926]/10 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30">
                                          {f.category}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-xs">
                                    {new Date(f.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                  </td>
                                  <td className="px-4 py-2 text-right align-middle">
                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFolder(f);
                                          setFolderForm({
                                            name: f.name,
                                            audience: f.audience ?? "BOTH",
                                            categories: f.category ? f.category.split(",") : [],
                                          });
                                          setShowFolderForm(true);
                                        }}
                                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
                                        title="Rename"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openMoveDialog("folder", f.id, f.name)}
                                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
                                        title="Move"
                                      >
                                        <FolderInput className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFolder(f.id)}
                                        className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            } else {
                              const b = item;
                              return (
                                <tr key={`book-${b.id}`} className="hover:bg-slate-50 group transition">
                                  <td className="px-4 py-3 flex items-center gap-3 w-1/2">
                                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span className="font-semibold text-slate-700 whitespace-normal break-words">{b.title}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="px-1.5 py-0.5 rounded bg-[#8AC926]/10 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30">
                                        {b.category}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200">
                                        {audienceLabel(b.audience ?? "BOTH")}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-xs">
                                    {new Date(b.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                  </td>
                                  <td className="px-4 py-2 text-right align-middle">
                                    <div className="flex items-center justify-end gap-1">
                                      {token && (
                                        <StoryBookActions
                                          bookId={b.id}
                                          token={token}
                                          role="ADMIN"
                                          title={b.title}
                                          variant="admin"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => openMoveDialog("book", b.id, b.title)}
                                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
                                        title="Move to folder"
                                      >
                                        <FolderInput className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingBookId(b.id);
                                          setBookForm({
                                            title: b.title,
                                            author: b.author || "",
                                            categories: b.category.split(",") as StudentClassLevel[],
                                            audience: (b.audience as LibraryAudience) || "BOTH",
                                          });
                                          setBookFile(null);
                                          setShowBookForm(true);
                                        }}
                                        className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
                                        title="Edit book"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={actionLoading === `book-delete-${b.id}`}
                                        onClick={() => handleDeleteStoryBook(b.id)}
                                        className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition disabled:opacity-50"
                                        title="Delete book"
                                      >
                                        {actionLoading === `book-delete-${b.id}` ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {combinedItems.length > 10 && (
                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                      <AdminListPagination
                        rangeStart={bookPagination.rangeStart}
                        rangeEnd={bookPagination.rangeEnd}
                        total={combinedItems.length}
                        safePage={bookPagination.safePage}
                        totalPages={bookPagination.totalPages}
                        pageNumbers={bookPagination.pageNumbers}
                        onPageChange={bookPagination.setCurrentPage}
                        itemLabel="items"
                      />
                    </div>
                  )}
                </div>

                {/* ── STORY BOOK UPLOAD FORM MODAL ── */}
                {showBookForm && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[min(92dvh,720px)] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative my-auto">
                      <ModalCloseButton
                        onClick={() => { setShowBookForm(false); setEditingBookId(null); }}
                        className="absolute top-4 right-4"
                      />
                      <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-1 pr-10">
                        {editingBookId ? "Edit Story Book" : "Register Story Book"}
                      </h3>
                      {currentFolderId && folderAncestors.length > 0 && (
                        <p className="text-3xs text-indigo-600 font-semibold mb-3 flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          Adding to: {folderAncestors[folderAncestors.length - 1]?.name ?? "folder"}
                        </p>
                      )}
                      <form onSubmit={handleAddStoryBook} noValidate className="space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Book Title
                          </label>
                          <input
                            required
                            placeholder="e.g. The Lion and the Mouse"
                            value={bookForm.title}
                            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Class (for student library)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {STUDENT_CLASS_OPTIONS.map((opt) => {
                              const isSelected = bookForm.categories.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected
                                      ? bookForm.categories.filter((c) => c !== opt.id)
                                      : [...bookForm.categories, opt.id];
                                    setBookForm({ ...bookForm, categories: next });
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition ${
                                    isSelected
                                      ? "border-[#8AC926] bg-[#8AC926]/15 text-[#5a8218]"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-[#8AC926] border-[#8AC926]"
                                      : "border-slate-300 bg-white"
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </span>
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-3xs text-slate-500 mt-1 font-medium">
                            Select one or more classes. Students only see books matching their class.
                          </p>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Show in portal
                          </label>
                          <PillSelect
                            value={bookForm.audience}
                            options={LIBRARY_AUDIENCE_OPTIONS}
                            onChange={(audience) => setBookForm({ ...bookForm, audience: audience as LibraryAudience })}
                            ariaLabel="Story book portal audience"
                          />
                          <p className="text-3xs text-slate-500 mt-1 font-medium">
                            Teachers and students can view and print only. Only admins can download
                            files.
                          </p>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">
                            Book document {editingBookId && <span className="font-normal text-slate-400 text-xs ml-2">(Optional, leave empty to keep current file)</span>}
                          </label>
                          <div className="flex flex-col gap-2">
                            <label className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 bg-[#F8FAFC] flex flex-col items-center justify-center cursor-pointer hover:bg-[#8AC926]/5 transition">
                              <Loader2
                                className={`w-8 h-8 text-[#8AC926] ${actionLoading === "book-save" ? "animate-spin" : ""}`}
                              />
                              <span className="font-bold text-[#8AC926] mt-2 text-2xs">
                                {bookFile
                                  ? bookFile.name
                                  : "Choose file from computer"}
                              </span>
                              <span className="text-3xs text-slate-650 mt-1">
                                {bookFile
                                  ? `(${(bookFile.size / 1024 / 1024).toFixed(2)} MB)`
                                  : "Supports PDF, DOC, DOCX, PPT, PPTX"}
                              </span>
                              <input
                                type="file"
                                accept={STORY_BOOK_ACCEPT}
                                className="hidden"
                                onChange={(e) => setBookFile(e.target.files?.[0] ?? null)}
                              />
                            </label>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10"
                        >
                          {editingBookId ? "Update Book" : "Register Book to Library"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ── CREATE / EDIT FOLDER MODAL ── */}
                {showFolderForm && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative my-auto">
                      <ModalCloseButton
                        onClick={() => { setShowFolderForm(false); setEditingFolder(null); }}
                        className="absolute top-4 right-4"
                      />
                      <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10 flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-indigo-500" />
                        {editingFolder ? "Edit Folder" : "New Folder"}
                      </h3>
                      <form onSubmit={handleCreateFolder} noValidate className="space-y-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">Folder Name</label>
                          <input
                            required
                            placeholder="e.g. Rhymes Collection"
                            value={folderForm.name}
                            onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 placeholder-slate-400 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">Access</label>
                          <PillSelect
                            value={folderForm.audience}
                            options={LIBRARY_AUDIENCE_OPTIONS}
                            onChange={(audience) => setFolderForm({ ...folderForm, audience: audience as string })}
                            ariaLabel="Folder access"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">Class filter</label>
                          <div className="flex flex-wrap gap-2">
                            {STUDENT_CLASS_OPTIONS.map((opt) => {
                              const isSelected = folderForm.categories.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected
                                      ? folderForm.categories.filter((c) => c !== opt.id)
                                      : [...folderForm.categories, opt.id];
                                    setFolderForm({ ...folderForm, categories: next });
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition ${
                                    isSelected
                                      ? "border-[#8AC926] bg-[#8AC926]/15 text-[#5a8218]"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-[#8AC926] border-[#8AC926]"
                                      : "border-slate-300 bg-white"
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </span>
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading === "folder-save"}
                          className="w-full py-3 rounded-xl bg-indigo-500 text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-indigo-600 transition shadow-md shadow-indigo-500/10 disabled:opacity-60"
                        >
                          {actionLoading === "folder-save" ? "Saving…" : editingFolder ? "Update Folder" : "Create Folder"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ── MOVE DIALOG ── */}
                {showMoveDialog && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative my-auto">
                      <ModalCloseButton
                        onClick={() => setShowMoveDialog(null)}
                        className="absolute top-4 right-4"
                      />
                      <h3 className="font-sans text-base font-extrabold text-slate-900 mb-1 pr-10 flex items-center gap-2">
                        <FolderInput className="w-5 h-5 text-indigo-500" />
                        Move "{showMoveDialog.name}"
                      </h3>
                      <p className="text-3xs text-slate-500 mb-4 font-medium">
                        Select a destination folder, or choose root.
                      </p>
                      <div className="space-y-1 max-h-60 overflow-y-auto mb-4 border border-slate-100 rounded-xl p-2 bg-[#F8FAFC]">
                        <button
                          type="button"
                          onClick={() => setMoveTargetId(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                            moveTargetId === null
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Home className="w-3.5 h-3.5" /> Root (no folder)
                        </button>
                        {allFoldersFlat
                          .filter((f) => f.id !== showMoveDialog.id)
                          .map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setMoveTargetId(f.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                                moveTargetId === f.id
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Folder className="w-3.5 h-3.5 text-indigo-400" />
                              {f.name}
                              {f.parentId && (
                                <span className="text-3xs text-slate-400 ml-auto">
                                  (in {allFoldersFlat.find((p) => p.id === f.parentId)?.name ?? "…"})
                                </span>
                              )}
                            </button>
                          ))}
                        {allFoldersFlat.length === 0 && (
                          <p className="text-3xs text-slate-400 text-center py-4 font-medium">
                            No folders created yet.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleMoveItem}
                        disabled={actionLoading === "move-item"}
                        className="w-full py-3 rounded-xl bg-indigo-500 text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-indigo-600 transition shadow-md shadow-indigo-500/10 disabled:opacity-60"
                      >
                        {actionLoading === "move-item" ? "Moving…" : "Move Here"}
                      </button>
                    </div>
                  </div>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}

          {/* ────────────────── CONTACT INQUIRIES ────────────────── */}
          {activeTab === "inquiries" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Submissions & Leads"
                description="Review general preschool inquiries and franchise business opportunities."
                actions={
                  <>
                    <AdminSearchInput
                      value={inquirySearch}
                      onChange={setInquirySearch}
                      placeholder="Search leads…"
                      ariaLabel="Search inquiries"
                    />
                    <PillSelect
                      value={inquirySubTab}
                      options={inquiryTabOptions}
                      onChange={(id) => setInquirySubTab(id as "general" | "franchise")}
                      ariaLabel="Lead type"
                    />
                  </>
                }
              />

              <AdminPageBody>
                {filteredInquiries.length === 0 ? (
                  <AdminListEmpty
                    message={
                      inquirySubTab === "general"
                        ? "No general inquiries match your search."
                        : "No franchise inquiries match your search."
                    }
                  />
                ) : (
                  <AdminRecordList>
                    {inquiryPagination.paginatedItems.map((item) => {
                      const isFranchise = inquirySubTab === "franchise";
                      const franchiseItem = isFranchise ? (item as FranchiseInquiry) : null;
                      const readKey = isFranchise
                        ? `franchise-read-${item.id}`
                        : `inquiry-read-${item.id}`;

                      return (
                        <div
                          key={item.id}
                          className={`${adminListRowClass} cursor-pointer hover:border-[#8AC926]/50 hover:bg-[#8AC926]/5 transition`}
                          onClick={() =>
                            setLeadView({
                              kind: isFranchise ? "franchise" : "admission",
                              item,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setLeadView({
                                kind: isFranchise ? "franchise" : "admission",
                                item,
                              });
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`View ${isFranchise ? "franchise" : "general"} inquiry from ${item.name}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                                  isFranchise
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {isFranchise ? "Franchise" : "General"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                                  item.isRead
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {item.isRead ? "Read" : "New"}
                              </span>
                            </div>
                            <p className="font-bold text-sm text-slate-800">{item.name}</p>
                            <p className="text-2xs text-slate-600 font-medium">{item.email}</p>
                            <p className="text-2xs text-slate-500 mt-0.5">
                              {item.phone || "No phone"}
                              {franchiseItem?.location && (
                                <>
                                  {" "}
                                  · Location:{" "}
                                  <span className="text-[#6B9E1A] font-semibold">
                                    {franchiseItem.location}
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="text-2xs text-slate-400 mt-0.5">
                              {new Date(item.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div
                            className="flex flex-wrap items-center gap-2 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="View full details"
                              onClick={() =>
                                setLeadView({
                                  kind: isFranchise ? "franchise" : "admission",
                                  item,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-2xs font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            {!item.isRead && (
                              <button
                                type="button"
                                disabled={actionLoading === readKey}
                                onClick={() =>
                                  isFranchise
                                    ? handleMarkFranchiseRead(item.id)
                                    : handleMarkInquiryRead(item.id)
                                }
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-2xs font-bold flex items-center gap-1 disabled:opacity-50"
                              >
                                {actionLoading === readKey ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Mark Read"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <AdminListPagination
                      rangeStart={inquiryPagination.rangeStart}
                      rangeEnd={inquiryPagination.rangeEnd}
                      total={filteredInquiries.length}
                      safePage={inquiryPagination.safePage}
                      totalPages={inquiryPagination.totalPages}
                      pageNumbers={inquiryPagination.pageNumbers}
                      onPageChange={inquiryPagination.setCurrentPage}
                      itemLabel="leads"
                    />
                  </AdminRecordList>
                )}

                {leadView && (
                  <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setLeadView(null)}
                  >
                    <div
                      className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ModalCloseButton
                        onClick={() => setLeadView(null)}
                        className="absolute top-4 right-4 z-10"
                      />
                      <div className="flex flex-wrap items-center gap-2 mb-4 pr-10">
                        <span
                          className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${
                            leadView.kind === "franchise"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {leadView.kind === "franchise" ? "Franchise Lead" : "General Enquiry"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${
                            leadView.item.isRead
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {leadView.item.isRead ? "Read" : "New"}
                        </span>
                      </div>

                      <h3 className="font-sans text-xl font-extrabold text-slate-900 mb-4">
                        {leadView.item.name}
                      </h3>

                      <dl className="space-y-3 text-sm">
                        <div className="flex gap-3">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <dt className="text-2xs font-bold text-slate-500 uppercase">Email</dt>
                            <dd>
                              <a
                                href={`mailto:${leadView.item.email}`}
                                className="text-[#4E8C52] font-semibold hover:underline break-all"
                              >
                                {leadView.item.email}
                              </a>
                            </dd>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <dt className="text-2xs font-bold text-slate-500 uppercase">Phone</dt>
                            <dd className="font-semibold text-slate-800">
                              {leadView.item.phone ? (
                                <a
                                  href={`tel:${leadView.item.phone.replace(/\s/g, "")}`}
                                  className="text-[#4E8C52] hover:underline"
                                >
                                  {leadView.item.phone}
                                </a>
                              ) : (
                                "Not provided"
                              )}
                            </dd>
                          </div>
                        </div>
                        {leadView.kind === "franchise" &&
                          (leadView.item as FranchiseInquiry).location && (
                            <div className="flex gap-3">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <dt className="text-2xs font-bold text-slate-500 uppercase">
                                  Location
                                </dt>
                                <dd className="font-semibold text-slate-800">
                                  {(leadView.item as FranchiseInquiry).location}
                                </dd>
                              </div>
                            </div>
                          )}
                        <div>
                          <dt className="text-2xs font-bold text-slate-500 uppercase mb-1">
                            Message
                          </dt>
                          <dd className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {leadView.item.message?.trim() || "No message provided."}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-2xs font-bold text-slate-500 uppercase">Submitted</dt>
                          <dd className="font-semibold text-slate-700">
                            {new Date(leadView.item.createdAt).toLocaleString("en-IN", {
                              weekday: "short",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
                        {!leadView.item.isRead && (
                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              (leadView.kind === "franchise"
                                ? `franchise-read-${leadView.item.id}`
                                : `inquiry-read-${leadView.item.id}`)
                            }
                            onClick={() =>
                              leadView.kind === "franchise"
                                ? handleMarkFranchiseRead(leadView.item.id)
                                : handleMarkInquiryRead(leadView.item.id)
                            }
                            className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setLeadView(null)}
                          className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}

          {/* ────────────────── PARENT REVIEWS ────────────────── */}
          {activeTab === "reviews" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Parent Reviews & Testimonials"
                description="Connect Google Business to load full written feedback from every branch. Manual testimonials are added below."
                actions={
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!token) return;
                        try {
                          const { url, message } = await api.getGoogleBusinessAuthUrl(token);
                          if (message) {
                            setError(message);
                            return;
                          }
                          window.open(url, "_blank", "noopener,noreferrer");
                          setMessage(
                            "Complete Google sign-in in the new tab, then paste the refresh token into backend .env."
                          );
                        } catch (err) {
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : "Could not start Google connect."
                          );
                        }
                      }}
                      className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-sans font-bold text-xs tracking-wider hover:bg-blue-100 transition whitespace-nowrap"
                    >
                      Connect Google Business
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!token) return;
                        setActionLoading("google-refresh");
                        setError("");
                        try {
                          const status = await api.syncGoogleReviews(token);
                          setGoogleReviews(status.reviews ?? []);
                          setGoogleLocations(status.locations ?? []);
                          setGoogleReviewsMeta({
                            configured: status.configured,
                            hint: status.hint,
                            rating: status.rating,
                            totalRatings: status.totalRatings,
                            placeName: status.placeName,
                            fetchMode: status.fetchMode,
                          });
                          if (!status.configured) {
                            setMessage(
                              status.message ??
                                "Add GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_IDS in backend .env"
                            );
                          } else if (status.syncBlocked) {
                            setError(status.syncBlocked);
                          } else if (status.synced) {
                            const withText = (status.reviews ?? []).filter(
                              (r) => r.content && r.content !== "—"
                            ).length;
                            setMessage(
                              `Synced ${status.reviews?.length ?? 0} Google review(s) from ${status.locations?.length ?? 0} location(s) (${withText} with written feedback).`
                            );
                          } else {
                            setMessage(
                              status.hint ??
                                `Showing ${status.reviews?.length ?? 0} saved review(s).`
                            );
                          }
                        } catch (err) {
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : "Failed to refresh Google reviews."
                          );
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                      disabled={actionLoading === "google-refresh"}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-sans font-bold text-xs tracking-wider hover:bg-slate-50 transition whitespace-nowrap"
                    >
                      {actionLoading === "google-refresh" ? "Refreshing…" : "Refresh now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTestimonialForm(true)}
                      className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Add Review
                    </button>
                  </>
                }
              />

              <AdminPageBody>
                {/* ── Google Business reviews (all locations) ── */}
                <section className="mb-10">
                  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-sans text-sm font-extrabold text-slate-900">
                        Google Business reviews
                      </h3>
                      <p className="text-2xs text-slate-600 font-medium mt-0.5">
                        {googleReviewsMeta.fetchMode === "business_profile"
                          ? "Full review text from your Google Business account (all locations)"
                          : googleReviewsMeta.fetchMode === "oauth_pending"
                            ? "Finish Connect Google Business — refresh token not in .env yet"
                            : "Places API mode — use Connect Google Business for written feedback"}
                      </p>
                    </div>
                    {googleReviewsMeta.configured && googleReviewsMeta.rating != null && (
                      <p className="text-xs font-bold text-slate-800">
                        Overall <span className="text-[#FF9F1C]">★ {googleReviewsMeta.rating}</span>
                        {googleReviewsMeta.totalRatings != null && (
                          <span className="text-slate-600">
                            {" "}
                            · {googleReviewsMeta.totalRatings} total ratings
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {googleReviewsMeta.hint && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-2xs font-semibold text-amber-900">
                      {googleReviewsMeta.hint}
                    </div>
                  )}

                  {!googleReviewsMeta.configured ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-sm font-semibold text-slate-600 border border-slate-200">
                      Google reviews not configured. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_IDS
                      in backend .env, then click Refresh Google.
                    </div>
                  ) : (
                    <>
                      {googleLocations.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                          {googleLocations.map((loc) => (
                            <div
                              key={loc.placeId}
                              className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs"
                            >
                              <p className="font-bold text-2xs text-slate-900 truncate">
                                {loc.placeName}
                              </p>
                              <p className="text-3xs text-slate-600 mt-1 font-medium">
                                {loc.rating != null && (
                                  <span className="text-[#FF9F1C] mr-1">★ {loc.rating}</span>
                                )}
                                {loc.totalRatings ?? 0} ratings · {loc.reviewsReturned} loaded here
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {googleReviews.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center text-sm font-semibold text-slate-600 border border-slate-200">
                          {googleReviewsMeta.fetchMode === "oauth_pending" ? (
                            <>
                              OAuth is not finished. Click <strong>Connect Google Business</strong>,
                              then add{" "}
                              <code className="text-2xs bg-slate-100 px-1 rounded">
                                GOOGLE_BUSINESS_REFRESH_TOKEN
                              </code>{" "}
                              to backend .env.
                            </>
                          ) : googleReviewsMeta.fetchMode === "business_profile" ? (
                            <>
                              No reviews loaded yet. Click <strong>Refresh Google</strong> once. If
                              you see a rate-limit message above, wait 5 minutes before trying
                              again.
                            </>
                          ) : (
                            <>
                              No written reviews yet for {googleLocations.length || "your"}{" "}
                              location(s). Connect Google Business or check Places API settings in
                              backend .env.
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
                          {googleReviews
                            .filter((r) => r.content && r.content !== "—")
                            .map((r) => (
                              <GoogleReviewCard key={r.id} review={r} />
                            ))}
                          {googleReviews.filter((r) => !r.content || r.content === "—").length >
                            0 && (
                            <p className="md:col-span-2 text-2xs text-slate-500 font-medium text-center py-2">
                              {googleReviews.filter((r) => !r.content || r.content === "—").length}{" "}
                              additional star-only rating(s) hidden — Google did not include written
                              text.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </section>

                {/* ── Manual testimonials (database) ── */}
                <section>
                  <h3 className="font-sans text-sm font-extrabold text-slate-900 mb-4">
                    Manual website testimonials
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {testimonials.length === 0 ? (
                      <div className="col-span-full bg-white rounded-2xl p-8 text-center text-sm font-semibold text-slate-600 border border-slate-200">
                        No manual testimonials yet. Use Add Review to create one.
                      </div>
                    ) : (
                      testimonials.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md flex flex-col justify-between hover:shadow-lg transition group/review"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex text-[#FF9F1C] gap-0.5">
                                {Array.from({ length: t.rating }).map((_, idx) => (
                                  <span key={idx}>★</span>
                                ))}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-4xs font-extrabold uppercase border ${
                                  t.isApproved
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                }`}
                              >
                                {t.isApproved ? "PUBLISHED" : "HIDDEN"}
                              </span>
                            </div>
                            <p className="text-xs italic text-slate-700">
                              &ldquo;{t.content}&rdquo;
                            </p>
                            <h5 className="font-sans font-bold text-xs text-[#8AC926] mt-3">
                              — {t.name}
                            </h5>
                          </div>

                          <div className="border-t border-slate-200 pt-4 mt-4 flex gap-2">
                            {!t.isApproved && (
                              <button
                                disabled={actionLoading === `testimonial-approve-${t.id}`}
                                onClick={() => handleApproveTestimonial(t.id, true)}
                                className="flex-1 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-2xs transition"
                              >
                                Publish Review
                              </button>
                            )}
                            {t.isApproved && (
                              <button
                                disabled={actionLoading === `testimonial-approve-${t.id}`}
                                onClick={() => handleApproveTestimonial(t.id, false)}
                                className="flex-1 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-2xs transition"
                              >
                                Hide Review
                              </button>
                            )}
                            <button
                              disabled={actionLoading === `testimonial-delete-${t.id}`}
                              onClick={() => handleDeleteTestimonial(t.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </AdminPageBody>

              {showTestimonialForm && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up relative">
                    <ModalCloseButton
                      onClick={() => setShowTestimonialForm(false)}
                      className="absolute top-4 right-4"
                    />
                    <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">
                      Register Parent Testimonial
                    </h3>
                    <form onSubmit={handleAddTestimonial} noValidate className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">Parent Name</label>
                        <input
                          required
                          placeholder="e.g. Mrs. Priya Govind"
                          value={testimonialForm.name}
                          onChange={(e) =>
                            setTestimonialForm({ ...testimonialForm, name: e.target.value })
                          }
                          className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Rating Stars (1 to 5)
                        </label>
                        <PortalSelect
                          value={String(testimonialForm.rating)}
                          onChange={(e) =>
                            setTestimonialForm({
                              ...testimonialForm,
                              rating: Number(e.target.value),
                            })
                          }
                          className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r} className="bg-white text-slate-800">
                              {r} Stars
                            </option>
                          ))}
                        </PortalSelect>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Review Content
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Simba Academy has changed the way my daughter learns. The staff..."
                          value={testimonialForm.content}
                          onChange={(e) =>
                            setTestimonialForm({ ...testimonialForm, content: e.target.value })
                          }
                          className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading === "testimonial-save"}
                        className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionLoading === "testimonial-save" ? "Saving…" : "Register Testimonial"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </AdminPageShell>
          )}

          {/* ────────────────── MEDIA GALLERY ────────────────── */}
          {activeTab === "gallery" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Academy Media Gallery (cPanel Storage)"
                description="Manage photos for the public gallery — view, print, download, edit, or remove."
                actions={
                  <>
                    <AdminSearchInput
                      value={gallerySearch}
                      onChange={setGallerySearch}
                      placeholder="Search photos…"
                      ariaLabel="Search gallery"
                    />
                    <button
                      type="button"
                      onClick={openGalleryUpload}
                      className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Upload Photo
                    </button>
                  </>
                }
              />

              <AdminPageBody>
                {filteredGallery.length === 0 ? (
                  <AdminListEmpty
                    message={
                      gallery.length === 0
                        ? "No images uploaded to the media gallery."
                        : "No gallery photos match your search."
                    }
                  />
                ) : (
                  <AdminRecordList>
                    {galleryPagination.paginatedItems.map((g) => (
                      <div key={g.id} className={adminListRowClass}>
                        <img
                          src={resolveStorageUrl(g.imageUrl)}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-4xs font-extrabold uppercase border border-sky-200 shrink-0">
                              {g.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-4xs font-extrabold uppercase border border-emerald-200 shrink-0">
                              Public gallery
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-800">
                            {g.title || "Academy Activity"}
                          </p>
                          {g.createdAt && (
                            <p className="text-2xs text-slate-500 mt-0.5">
                              {new Date(g.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <GalleryItemActions
                            imageUrl={g.imageUrl}
                            title={g.title || "Academy Activity"}
                            variant="admin"
                            onEdit={() => openGalleryEdit(g)}
                          />
                          <button
                            type="button"
                            disabled={actionLoading === `gallery-delete-${g.id}`}
                            onClick={() => handleDeleteGallery(g.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                            title="Delete photo"
                          >
                            {actionLoading === `gallery-delete-${g.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    <AdminListPagination
                      rangeStart={galleryPagination.rangeStart}
                      rangeEnd={galleryPagination.rangeEnd}
                      total={filteredGallery.length}
                      safePage={galleryPagination.safePage}
                      totalPages={galleryPagination.totalPages}
                      pageNumbers={galleryPagination.pageNumbers}
                      onPageChange={galleryPagination.setCurrentPage}
                      itemLabel="photos"
                    />
                  </AdminRecordList>
                )}
              </AdminPageBody>

              {showGalleryForm && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up relative">
                    <ModalCloseButton
                      onClick={closeGalleryForm}
                      className="absolute top-4 right-4"
                    />
                    <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">
                      {editingGallery ? "Edit Gallery Photo" : "Upload Gallery Photo"}
                    </h3>
                    <form onSubmit={handleSaveGallery} noValidate className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Photo title (optional)
                        </label>
                        <input
                          placeholder="e.g. Annual Day Celebrations 2026"
                          value={galleryForm.title}
                          onChange={(e) => setGalleryForm({ title: e.target.value })}
                          className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          {editingGallery ? "Replace image (optional)" : "Image file"}
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          required={!editingGallery}
                          onChange={(e) => setGalleryImageFile(e.target.files?.[0] ?? null)}
                          className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#8AC926]/10 file:text-[#4E8C52] file:font-bold"
                        />
                        <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                          JPEG, PNG, WebP, or GIF.{" "}
                          {editingGallery
                            ? "Leave empty to keep the current photo."
                            : "Uploaded to secure storage before publishing."}
                        </p>
                        {(galleryImageFile || editingGallery) && (
                          <img
                            src={
                              galleryImageFile
                                ? URL.createObjectURL(galleryImageFile)
                                : resolveStorageUrl(editingGallery!.imageUrl)
                            }
                            alt="Preview"
                            className="mt-3 w-full h-32 object-cover rounded-xl border border-slate-200"
                          />
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading === "gallery-save"}
                        className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 disabled:opacity-60"
                      >
                        {actionLoading === "gallery-save"
                          ? "Saving…"
                          : editingGallery
                            ? "Save changes"
                            : "Upload to Gallery"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </AdminPageShell>
          )}

          {activeTab === "settings" && (
            <AdminPageShell>
              <AdminPageHeader
                title="Academy Settings"
                description="Manage your profile, password, and secure session."
              />
              <AdminPageBody>
                <div className="mt-6">
                  <AdminSettingsPanel user={user!} token={token!} />
                </div>
              </AdminPageBody>
            </AdminPageShell>
          )}

          {activeTab === "notifications" && (
            <AdminPageShell className="!overflow-visible">
              <AdminPageHeader
                title="System Notifications & Alerts"
                description="View automated security logs, registration events, and workspace alerts."
                actions={
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <AdminSearchInput
                      value={notificationSearch}
                      onChange={setNotificationSearch}
                      placeholder="Search alerts…"
                      ariaLabel="Search notifications"
                    />
                    
                    <PillSelect
                      value={notificationFilter}
                      options={notificationFilterOptions}
                      onChange={(val) => setNotificationFilter(val as any)}
                      ariaLabel="Filter alerts by status"
                    />

                    <PillSelect
                      value={notificationTypeFilter}
                      options={notificationTypeOptions}
                      onChange={(val) => setNotificationTypeFilter(val as any)}
                      ariaLabel="Filter alerts by category"
                    />

                    <PillSelect
                      value={notificationDateFilter}
                      options={notificationDateOptions}
                      onChange={(val) => setNotificationDateFilter(val as any)}
                      ariaLabel="Filter alerts by date"
                    />

                    {adminNotifications.some((n) => !n.isRead) && (
                      <button
                        type="button"
                        onClick={handleMarkAllAdminNotificationsRead}
                        disabled={actionLoading === "notifications-read-all"}
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#8AC926]/10 hover:border-[#8AC926]/40 transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 text-[#8AC926]" /> Mark all read
                      </button>
                    )}
                  </div>
                }
              />
              <AdminPageBody>
                {notificationDateFilter === "CUSTOM" && (
                  <div className="mb-5 animate-fade-in">
                    <PortalDateRangePicker
                      startDate={notificationStartDate}
                      endDate={notificationEndDate}
                      onStartChange={setNotificationStartDate}
                      onEndChange={setNotificationEndDate}
                      onClear={() => {
                        setNotificationStartDate("");
                        setNotificationEndDate("");
                      }}
                    />
                  </div>
                )}
                {filteredNotifications.length === 0 ? (
                  <AdminListEmpty message="No alerts match your search/filter." />
                ) : (
                  <>
                    <AdminRecordList>
                      {notificationPagination.paginatedItems.map((n) => {
                        const isUnread = !n.isRead;
                        const dateText = new Date(n.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        let Icon = Bell;
                        let iconColor = "text-[#8AC926] bg-[#8AC926]/10 border-[#8AC926]/20";
                        
                        if (n.type.includes("PAYMENT")) {
                          Icon = CreditCard;
                          iconColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                        } else if (n.type.includes("USER") || n.type.includes("REGISTER") || n.type.includes("TEACHER")) {
                          Icon = Users;
                          iconColor = "text-blue-600 bg-blue-50 border-blue-100";
                        } else if (n.type.includes("TASK") || n.type.includes("PROOF")) {
                          Icon = Calendar;
                          iconColor = "text-amber-600 bg-amber-50 border-amber-100";
                        } else if (n.type.includes("ALERT") || n.type.includes("ERROR")) {
                          Icon = AlertCircle;
                          iconColor = "text-rose-600 bg-rose-50 border-rose-100";
                        }

                        return (
                          <div
                            key={n.id}
                            className={`${adminListRowClass} flex items-center justify-between gap-4 p-4 border transition ${
                              isUnread
                                ? "bg-[#8AC926]/5 border-[#8AC926]/20 shadow-xs"
                                : "bg-white hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={`p-2.5 rounded-xl border shrink-0 ${iconColor}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className={`text-sm font-bold text-slate-800 ${isUnread ? "font-extrabold" : ""}`}>
                                    {n.title}
                                  </h4>
                                  {isUnread && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#8AC926] text-white uppercase tracking-wider">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-600 font-semibold text-xs leading-relaxed mt-1">
                                  {n.message}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {dateText}
                                  </span>
                                  {n.user && (
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold uppercase text-[8px] tracking-wider">
                                      By {n.user.name} ({n.user.role})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isUnread && (
                              <button
                                type="button"
                                onClick={() => handleMarkAdminNotificationRead(n.id)}
                                disabled={actionLoading === `notification-read-${n.id}`}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#8AC926]/50 bg-white hover:bg-[#8AC926]/10 text-slate-500 hover:text-[#78B020] font-sans font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 disabled:opacity-50"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5 text-[#8AC926]" />
                                Mark read
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </AdminRecordList>

                    <AdminListPagination
                      rangeStart={notificationPagination.rangeStart}
                      rangeEnd={notificationPagination.rangeEnd}
                      total={filteredNotifications.length}
                      safePage={notificationPagination.safePage}
                      totalPages={notificationPagination.totalPages}
                      pageNumbers={notificationPagination.pageNumbers}
                      onPageChange={notificationPagination.setCurrentPage}
                      itemLabel="alerts"
                    />
                  </>
                )}
              </AdminPageBody>
            </AdminPageShell>
          )}
        </div>
      )}

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
    </PortalPageShell>
  );
}
