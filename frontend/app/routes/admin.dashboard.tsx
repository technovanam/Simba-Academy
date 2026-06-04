import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/admin.dashboard";
import {
  ADMIN_LEGACY_SECTION_REDIRECTS,
  ADMIN_SECTIONS,
  ADMIN_TAB_PATHS,
  adminTabFromSection,
  adminTabTitle,
  type AdminTab,
} from "../lib/adminRoutes";
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
  type GoogleReviewsStatusResponse,
  type PublicReview,
} from "../lib/api";
import { clearSession, getToken, getUser } from "../lib/auth";
import {
  BookOpen,
  CreditCard,
  LogOut,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Book,
  Image,
  Award,
  Search,
  Check,
  Loader2,
  Layers,
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
  Download,
  Phone,
  MapPin,
} from "lucide-react";
import { AdminPeoplePanel } from "../components/AdminPeoplePanel";
import { AdminPaymentsPanel } from "../components/AdminPaymentsPanel";
import { RecentPaymentCard, sortPaymentsNewestFirst } from "../components/RecentPaymentCard";
import { StoryBookActions } from "../components/StoryBookActions";
import { GalleryItemActions } from "../components/GalleryItemActions";
import { PortalSelect } from "../components/PortalSelect";
import { LIBRARY_AUDIENCE_OPTIONS, audienceLabel } from "../lib/library";
import { resolveStorageUrl } from "../lib/storage";
import { isDateTodayOrFuture, localDateInputMin } from "../lib/dates";
import { ModalCloseButton } from "../components/ModalCloseButton";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../components/AdminPageShell";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  PillSelect,
  adminListRowClass,
  useAdminPagination,
} from "../components/AdminListUi";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Portal | Simba Academy" }];
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const activeTab = adminTabFromSection(section);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setToken(getToken());
  }, []);

  const [inquirySubTab, setInquirySubTab] = useState<"general" | "franchise">("general");

  function goToTab(tab: AdminTab) {
    if (activeTab !== tab) navigate(ADMIN_TAB_PATHS[tab]);
  }

  useEffect(() => {
    if (section && section in ADMIN_LEGACY_SECTION_REDIRECTS) {
      navigate(ADMIN_LEGACY_SECTION_REDIRECTS[section], { replace: true });
      return;
    }
    if (!section || !ADMIN_SECTIONS.has(section)) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [section, navigate]);

  useEffect(() => {
    document.title = `${adminTabTitle(activeTab)} | Simba Academy`;
  }, [activeTab]);

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [books, setBooks] = useState<StoryBook[]>([]);
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

  const [courseForm, setCourseForm] = useState({ id: "", title: "", description: "", level: "Playgroup", price: "" as string | number, imageUrl: "", isEditing: false });
  const [showCourseForm, setShowCourseForm] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", teacherId: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    category: "Fairy Tales",
    audience: "BOTH" as "STUDENT" | "TEACHER" | "BOTH",
  });
  const [showBookForm, setShowBookForm] = useState(false);

  const [galleryForm, setGalleryForm] = useState({ title: "" });
  const [galleryImageFile, setGalleryImageFile] = useState<File | null>(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");

  const [testimonialForm, setTestimonialForm] = useState({ name: "", content: "", rating: 5 });
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  // New Direct File Upload States
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({ title: "", description: "", type: "PDF" as "PDF" | "PPT", courseId: "" });
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);

  // Fetch data specifically for the active tab
  useEffect(() => {
    if (!mounted) return;

    if (!token || user?.role !== "ADMIN") {
      navigate("/admin/login");
      return;
    }

    loadTabData(activeTab);
  }, [mounted, token, user, navigate, activeTab]);

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
        const allBooks = await api.getStoryBooks(token);
        setBooks(allBooks);
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
          setGoogleReviews([]);
          setGoogleLocations([]);
          setGoogleReviewsMeta({
            configured: true,
            fetchMode: "business_profile",
            hint: "Click Sync from Google to load reviews (max once every 15 minutes).",
          });
        }
      } else if (tab === "gallery") {
        const allGallery = await api.getGallery();
        setGallery(allGallery);
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

  function handleLogout() {
    clearSession();
    navigate("/admin/login");
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

  // ── DIRECT FILE UPLOAD HANDLERS ──────────────────────────────────────


  async function handleMaterialUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setMessage("");

    if (!materialForm.title.trim()) {
      setError("Please enter the material title.");
      return;
    }
    if (!materialForm.courseId) {
      setError("Please select a course to link.");
      return;
    }
    if (!selectedMaterialFile) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      const created = await api.uploadMaterial(token, selectedMaterialFile, {
        title: materialForm.title,
        description: materialForm.description || undefined,
        type: materialForm.type,
        courseId: materialForm.courseId,
      });

      // Append new material to state
      setMaterials((prev) => [created, ...prev]);
      setMessage(`Learning material "${created.title}" successfully uploaded directly to cPanel Web Disk!`);
      
      // Reset form
      setMaterialForm({ title: "", description: "", type: "PDF", courseId: "" });
      setSelectedMaterialFile(null);
      setShowMaterialForm(false);
    } catch (err) {
      console.error("Material upload failed:", err);
      setError("Failed to upload course material directly. Verify WebDAV configuration.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── COURSE MANAGEMENT ACTIONS ────────────────────────────────────────
  async function handleCourseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setActionLoading("course-save");
    setError("");
    setMessage("");

    if (!courseForm.title.trim()) {
      setError("Please enter the course title.");
      setActionLoading(null);
      return;
    }
    if (courseForm.price === "" || courseForm.price === undefined || isNaN(Number(courseForm.price))) {
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
      setCourseForm({ id: "", title: "", description: "", level: "Playgroup", price: "", imageUrl: "", isEditing: false });
      setCourseImageFile(null);
      setShowCourseForm(false);
    } catch (err) {
      console.error("Course save failed:", err);
      setError(err instanceof ApiError ? err.message : "Failed to save course. Please verify WebDAV connection.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleCourseActive(courseId: string, currentActive: boolean) {
    if (!token) return;
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
    if (!token || !window.confirm("Are you sure you want to delete this course? All uploaded materials for this course will be deleted.")) return;
    setActionLoading(`course-delete-${courseId}`);
    try {
      await api.deleteCourse(token, courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setMessage("Course deleted successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete course.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── MATERIAL APPROVAL ACTIONS ────────────────────────────────────────
  async function handleDeleteMaterial(materialId: string) {
    if (!token || !window.confirm("Permanently delete this material and its file from storage?")) return;
    setActionLoading(`material-delete-${materialId}`);
    try {
      await api.deleteMaterial(token, materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      setMessage("Learning material permanently deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete material.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveMaterial(materialId: string, approve: boolean) {
    if (!token) return;
    setActionLoading(`material-approve-${materialId}`);
    try {
      const updated = await api.approveMaterial(token, materialId, approve);
      setMaterials((prev) => prev.map((m) => (m.id === materialId ? updated : m)));
      setMessage(approve ? "Learning material approved successfully." : "Learning material rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update material approval.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── TASK ASSIGNMENT ACTIONS ──────────────────────────────────────────
  async function handleAssignTask(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setMessage("");

    if (!taskForm.teacherId) {
      setError("Please select a teacher to assign the task to.");
      return;
    }
    if (!taskForm.title.trim()) {
      setError("Please enter the task title.");
      return;
    }
    if (!taskForm.dueDate) {
      setError("Please choose a due date.");
      return;
    }
    if (!isDateTodayOrFuture(taskForm.dueDate)) {
      setError("Due date cannot be in the past.");
      return;
    }

    try {
      const created = await api.createTask(token, {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: new Date(`${taskForm.dueDate}T12:00:00`).toISOString(),
        teacherId: taskForm.teacherId,
      });
      setTasks((prev) => [created, ...prev]);
      setMessage("Task assigned successfully.");
      setTaskForm({ title: "", description: "", dueDate: "", teacherId: "" });
      setShowTaskForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign task.");
    }
  }

  async function handleApproveTaskProof(taskId: string, approve: boolean) {
    if (!token) return;
    setActionLoading(`task-approve-${taskId}`);
    try {
      const updated = await api.approveTask(token, taskId, {
        status: approve ? "APPROVED" : "REJECTED",
        proofDesc: approve ? "Approved by Admin" : "Rejected by Admin"
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
    if (
      !token ||
      !window.confirm("Permanently delete this task and any proof file from storage?")
    )
      return;
    setActionLoading(`task-delete-${taskId}`);
    try {
      await api.deleteTask(token, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setMessage("Task deleted successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete task.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── STORY BOOKS ACTIONS ──────────────────────────────────────────────
  async function handleAddStoryBook(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setMessage("");

    if (!bookForm.title.trim()) {
      setError("Please enter the story book title.");
      return;
    }
    if (!bookFile) {
      setError("Please choose a PDF, PPT, or DOC file to upload.");
      return;
    }
    setActionLoading("book-save");

    try {
      const uploadResponse = await api.uploadRaw(token, bookFile);
      if (!uploadResponse.verified) {
        throw new ApiError("Story book file could not be verified on storage.", 500);
      }
      const finalFileUrl = uploadResponse.url;

      const created = await api.createStoryBook(token, {
        title: bookForm.title,
        author: bookForm.author || null,
        category: bookForm.category,
        fileUrl: finalFileUrl,
        fileSize: bookFile?.size ?? null,
        audience: bookForm.audience,
      });
      setBooks((prev) => [created, ...prev]);
      setMessage(
        uploadResponse.storage === "webdav"
          ? "Story book saved to cPanel storage and published to selected portals."
          : "Story book saved to server storage and published to selected portals."
      );
      setBookForm({ title: "", author: "", category: "Fairy Tales", audience: "BOTH" });
      setBookFile(null);
      setShowBookForm(false);
    } catch (err) {
      console.error("Storybook save failed:", err);
      setError(err instanceof ApiError ? err.message : "Failed to add story book. Please verify WebDAV connection.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteStoryBook(bookId: string) {
    if (!token || !window.confirm("Are you sure you want to delete this story book?")) return;
    setActionLoading(`book-delete-${bookId}`);
    try {
      await api.deleteStoryBook(token, bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setMessage("Story book deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete story book.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── INQUIRIES ACTIONS ────────────────────────────────────────────────
  async function handleMarkInquiryRead(inquiryId: string) {
    if (!token) return;
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
    if (!token) return;
    setActionLoading(`franchise-read-${franchiseId}`);
    try {
      await api.markFranchiseRead(token, franchiseId);
      setFranchiseInquiries((prev) => prev.map((f) => (f.id === franchiseId ? { ...f, isRead: true } : f)));
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
    if (!token) return;
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
    if (!token || !window.confirm("Are you sure you want to delete this gallery item?")) return;
    setActionLoading(`gallery-delete-${galleryId}`);
    try {
      await api.deleteGalleryItem(token, galleryId);
      setGallery((prev) => prev.filter((g) => g.id !== galleryId));
      setMessage("Gallery item deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete gallery item.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveTestimonial(testimonialId: string, approve: boolean) {
    if (!token) return;
    setActionLoading(`testimonial-approve-${testimonialId}`);
    try {
      await api.approveTestimonial(token, testimonialId, approve);
      setTestimonials((prev) => prev.map((t) => (t.id === testimonialId ? { ...t, isApproved: approve } : t)));
      setMessage(approve ? "Testimonial approved & published!" : "Testimonial hidden.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to review testimonial.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteTestimonial(testimonialId: string) {
    if (!token || !window.confirm("Are you sure you want to delete this testimonial?")) return;
    setActionLoading(`testimonial-delete-${testimonialId}`);
    try {
      await api.deleteTestimonial(token, testimonialId);
      setTestimonials((prev) => prev.filter((t) => t.id !== testimonialId));
      setMessage("Testimonial deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete testimonial.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddTestimonial(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
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

    try {
      const created = await api.createTestimonial(token, testimonialForm);
      setTestimonials((prev) => [created, ...prev]);
      setMessage("Testimonial added successfully.");
      setTestimonialForm({ name: "", content: "", rating: 5 });
      setShowTestimonialForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add testimonial.");
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

  const taskPagination = useAdminPagination(filteredTasks, [
    taskSearch,
    taskStatusFilter,
    taskTeacherFilter,
    tasks.length,
  ]);
  const filteredGallery = gallery.filter(
    (g) =>
      (g.title ?? "").toLowerCase().includes(gallerySearch.toLowerCase()) ||
      g.type.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  const bookPagination = useAdminPagination(filteredBooks, [bookSearch, books.length]);
  const galleryPagination = useAdminPagination(filteredGallery, [gallerySearch, gallery.length]);
  const inquiryPagination = useAdminPagination(filteredInquiries, [
    inquirySearch,
    inquirySubTab,
    inquiries.length,
    franchiseInquiries.length,
  ]);

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
    { id: "general", label: `Admissions (${inquiries.length})` },
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] font-sans text-[#3E2723] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
        <p className="font-bold text-[#8C6D58]">Initializing Simba Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans text-sm text-slate-900 flex flex-col lg:flex-row overflow-hidden">
      
      {/* ── LEFT INTEGRATED SIDEBAR ── */}
      <aside className="w-full lg:w-72 lg:h-screen lg:sticky lg:top-0 bg-[#F1F5F9] border-r border-slate-200 py-6 px-5 flex flex-col shrink-0 select-none overflow-y-auto justify-between z-30 shadow-2xl">
        <div className="space-y-6">
          {/* Brand + role */}
          <div className="flex items-center gap-3.5 bg-slate-100/80 p-3 rounded-xl border border-slate-200/80">
            <img
              src="/favicon.png"
              alt="Simba Preschool"
              className="w-11 h-11 shrink-0 object-contain"
            />
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">Simba Preschool</h3>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Academy Director
              </p>
            </div>
          </div>

          {/* Menu Navigation System */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-3 mb-2">MENU</span>
            {[
              { id: "overview", label: "Dashboard", icon: Layers },
              { id: "users", label: "Registered Users", icon: Users },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "teachers", label: "Teacher Management", icon: UserPlus },
              { id: "materials", label: "Approve Uploads", icon: FileCheck2 },
              { id: "tasks", label: "Assign Tasks", icon: Calendar },
              { id: "books", label: "Story Library", icon: Book },
              { id: "inquiries", label: "Admissions Leads", icon: Mail },
              { id: "reviews", label: "Parent Reviews", icon: Award },
              { id: "gallery", label: "Media Gallery", icon: Image },
            ].map((tab) => {
              const Icon = tab.icon;
              const tabId = tab.id as AdminTab;
              const isActive = activeTab === tabId;
              const to = ADMIN_TAB_PATHS[tabId];
              return (
                <Link
                  key={tab.id}
                  to={to}
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
                    <div className="w-0.5 h-3 bg-white rounded-lg absolute left-0 top-1/2 -translate-y-1/2"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar Blocks */}
        <div className="mt-8 space-y-4">
          {/* Logout Action */}
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs tracking-wider uppercase hover:bg-rose-100 hover:text-rose-800 transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN WORKSPACE SECTION ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Alerts & Messages (Floating Toasts) */}
        {message && (
          <div className={`fixed top-6 right-6 z-[9999] max-w-sm w-full bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl shadow-xl overflow-hidden flex text-left ${messageClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="w-2 bg-[#8AC926] flex-shrink-0" />
            <div className="p-4 flex gap-3.5 items-start w-full">
              <Check className="w-5 h-5 text-[#8AC926] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 leading-tight">Success</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{message}</p>
                <span className="text-[10px] text-slate-400 font-semibold mt-2 block">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <ModalCloseButton
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerMessageClose();
                }}
              />
            </div>
          </div>
        )}
        {error && (
          <div className={`fixed top-6 right-6 z-[9999] max-w-sm w-full bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl shadow-xl overflow-hidden flex text-left ${errorClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="w-2 bg-red-500 flex-shrink-0" />
            <div className="p-4 flex gap-3.5 items-start w-full">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 leading-tight">Error</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{error}</p>
                <span className="text-[10px] text-slate-400 font-semibold mt-2 block">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <ModalCloseButton
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerErrorClose();
                }}
              />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto flex flex-col overflow-hidden">
          {activeTab === "overview" && (
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3 mb-5 select-none">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
                  Simba Academy Workspace
                </h2>
                <p className="text-[10px] text-slate-600 font-semibold tracking-wider mt-0.5 uppercase">
                  Secure Administrator Command Center
                </p>
              </div>
              <div className="flex items-center gap-3">
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

          {loading && activeTab !== "users" && activeTab !== "teachers" && activeTab !== "payments" ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
              <p className="font-bold text-[#8AC926] mt-2">Loading dashboard data…</p>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in flex-1 flex flex-col overflow-hidden">
              {/* ────────────────── OVERVIEW TAB ────────────────── */}
              {activeTab === "overview" && (
                <div className="space-y-5 animate-fade-in flex-1 flex flex-col overflow-hidden">
                  {/* Three Main Metric Cards (Matched Height & Side-by-Side) */}
                  {stats && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                      
                      {/* Members overview — light green panel */}
                      <div className="bg-[#F3FAEB] border border-green-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[170px] h-full shrink-0">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold tracking-wider text-[10px] uppercase text-green-800">Registered Members</span>
                            <div className="p-1.5 bg-green-100 rounded-xl border border-green-200">
                              <Users className="w-3.5 h-3.5 text-[#6B9E1A]" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-green-600/80 tracking-widest block uppercase">Active accounts</span>
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
                      <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[170px] h-full shrink-0">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold tracking-wider text-[10px] uppercase text-blue-800">Zoho Payments Revenue</span>
                            <div className="p-1.5 bg-blue-100 rounded-xl border border-blue-200">
                              <CreditCard className="w-3.5 h-3.5 text-[#1364F1]" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-blue-600/80 tracking-widest block uppercase">Recent Payments</span>
                              <h4 className="font-bold text-xs uppercase leading-tight tracking-wider text-slate-800">Enrollment Payments</h4>
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
                            <span className="text-emerald-700">₹{stats.revenue.toLocaleString("en-IN")}</span>
                            {" · "}
                            {payments.length} total record{payments.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      {/* Today's Schedule — light purple panel */}
                      <div className="bg-[#F5F3FF] border border-violet-100 rounded-2xl p-5 relative overflow-hidden text-slate-800 select-none flex flex-col justify-between min-h-[170px] h-full shrink-0">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold tracking-wider text-[10px] uppercase text-violet-800">Today's Schedule</span>
                            <div className="p-1.5 bg-violet-100 rounded-xl border border-violet-200">
                              <Calendar className="w-3.5 h-3.5 text-violet-600" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-violet-600/80 tracking-widest block uppercase">Recent Tasks</span>
                              <h4 className="font-bold text-xs uppercase leading-tight tracking-wider text-slate-800">Teacher Assignments</h4>
                            </div>

                            <div className="space-y-1.5">
                              {tasks.length === 0 ? (
                                <div className="bg-white rounded-xl p-3 border border-violet-100 text-xs text-center text-slate-600 font-semibold">
                                  No recent tasks assigned.
                                </div>
                              ) : (
                                [...tasks]
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .slice(0, 2)
                                  .map((task) => (
                                    <div key={task.id} className="bg-white rounded-xl p-2.5 border border-violet-100 text-xs flex flex-col gap-1">
                                      <div className="flex justify-between items-start gap-1">
                                        <span className="font-bold text-slate-800 text-2xs truncate max-w-[120px]">
                                          {task.title}
                                        </span>
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
                                      <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold">
                                        <span>To: {task.teacher?.name ?? "Staff"}</span>
                                        {task.dueDate && (
                                          <span>
                                            Due: {new Date(task.dueDate).toLocaleDateString("en-IN", {
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch flex-1 min-h-0">
                    {/* Left & Middle Column Workspace (Main Content - 2/3 Width) */}
                    <div className="lg:col-span-2 flex flex-col min-h-0">
                      {/* Financial Audit Logs Table Card */}
                      <div id="recent-transactions" className="bg-white rounded-2xl p-5 border border-slate-200 flex-1 flex flex-col">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Payments</h3>
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
                    <div className="flex flex-col min-h-0">
                      {/* Academy Stats & Analytics Card */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200 flex-1 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-5">
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h4 className="font-bold text-[10px] uppercase text-slate-800 tracking-wider">Academy Analytics</h4>
                            <TrendingUp className="w-4 h-4 text-[#8AC926]" />
                          </div>

                          {/* Metrics — flat row style (matches admission leads) */}
                          <div className="grid grid-cols-1 gap-2">
                            <div className="p-2.5 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Total Materials</span>
                              <span className="text-lg font-bold text-[#FF9F1C] leading-none">{stats?.materials ?? 0}</span>
                            </div>
                            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Pending Review</span>
                              <span className="text-lg font-bold text-indigo-600 leading-none">{stats?.pendingApprovals ?? 0}</span>
                            </div>
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Unread Leads</span>
                              <span className="text-lg font-bold text-rose-600 leading-none">{stats?.unreadInquiries ?? 0}</span>
                            </div>
                            <div className="p-2.5 bg-[#8AC926]/5 border border-[#8AC926]/15 rounded-xl flex items-center justify-between">
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Total Student Enquiries</span>
                              <span className="text-lg font-bold text-[#8AC926] leading-none">{inquiries.length}</span>
                            </div>
                            <div className="p-2.5 bg-[#FF9F1C]/5 border border-[#FF9F1C]/15 rounded-xl flex items-center justify-between">
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Total Franchise Enquiries</span>
                              <span className="text-lg font-bold text-[#FF9F1C] leading-none">{franchiseInquiries.length}</span>
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
                          setCourseForm({ id: "", title: "", description: "", level: "Playgroup", price: "", imageUrl: "", isEditing: false });
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
                        <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                          {c.imageUrl && (
                            <img src={resolveStorageUrl(c.imageUrl)} alt={c.title} className="w-full h-32 object-cover" />
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="text-2xs font-bold text-[#8AC926] uppercase">{c.level}</span>
                              <span className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border ${c.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}>
                                {c.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800">{c.title}</h4>
                            {c.description && <p className="text-2xs text-slate-600 mt-1 line-clamp-2">{c.description}</p>}
                            <p className="text-sm font-bold text-emerald-600 mt-2">₹{c.price?.toLocaleString("en-IN") ?? "—"}</p>
                            <div className="border-t border-slate-200 pt-3 mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCourseForm({ id: c.id, title: c.title, description: c.description ?? "", level: c.level, price: c.price ?? "", imageUrl: c.imageUrl ?? "", isEditing: true });
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
                                {actionLoading === `course-active-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : c.isActive ? "Deactivate" : "Activate"}
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
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowCourseForm(false)}>
                      <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl border border-slate-200 relative" onClick={(e) => e.stopPropagation()}>
                        <ModalCloseButton onClick={() => setShowCourseForm(false)} className="absolute top-4 right-4" />
                        <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-5 pr-10">
                          {courseForm.isEditing ? "Edit Course" : "Add Course Catalog"}
                        </h3>
                        <form onSubmit={handleCourseSubmit} noValidate className="space-y-4">
                          <input required placeholder="Course title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]" />
                          <textarea placeholder="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926] min-h-[80px]" />
                          <PortalSelect value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]">
                            {["Daycare", "Playgroup", "Pre-KG", "LKG", "UKG", "Phonics", "Handwriting", "Spoken English", "Nursery", "All"].map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </PortalSelect>
                          <input required type="number" placeholder="Tuition fee (INR)" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#8AC926]" />
                          <input type="file" accept="image/*" onChange={(e) => setCourseImageFile(e.target.files?.[0] ?? null)} className="w-full text-xs" />
                          <button type="submit" disabled={actionLoading === "course-save"} className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-bold text-xs uppercase disabled:opacity-60">
                            {actionLoading === "course-save" ? "Saving…" : courseForm.isEditing ? "Save Changes" : "Create Catalog Entry"}
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
                    actions={
                      <button
                        onClick={() => {
                          if (courses.length === 0) {
                            alert("Create a course catalog entry first before uploading materials.");
                            return;
                          }
                          setMaterialForm({ title: "", description: "", type: "PDF", courseId: courses[0]?.id ?? "" });
                          setSelectedMaterialFile(null);
                          setShowMaterialForm(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10"
                      >
                        <Plus className="w-4 h-4" /> Upload Learning Material
                      </button>
                    }
                  />

                  <AdminPageBody>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold">
                            <th className="pb-3">Title / Document</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Associated Course</th>
                            <th className="pb-3">Uploaded By</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {combinedApprovals.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 font-semibold text-slate-600">
                                No learning materials or task proofs have been uploaded for review.
                              </td>
                            </tr>
                          ) : (
                            combinedApprovals.map((m) => (
                              <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition">
                                <td className="py-4">
                                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="font-bold flex items-center gap-1.5 hover:underline text-[#8AC926] cursor-pointer">
                                    {m.title} <ExternalLink className="w-3.5 h-3.5 text-slate-650" />
                                  </a>
                                  {m.description && <p className="text-2xs text-slate-600 line-clamp-1 mt-0.5">{m.description}</p>}
                                </td>
                                <td className="py-4">
                                  {m.isTask ? (
                                    <span className="px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase bg-blue-950/20 text-blue-400 border border-blue-900/40">
                                      TASK PROOF
                                    </span>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase ${
                                      m.type === "PDF" ? "bg-red-950/20 text-red-400 border border-red-900/40" : "bg-orange-950/20 text-orange-400 border border-orange-900/40"
                                    }`}>
                                      {m.type}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 font-semibold text-slate-700">
                                  {m.course?.title}
                                </td>
                                <td className="py-4">
                                  <p className="font-bold text-slate-800">{m.uploadedBy?.name ?? "Admin"}</p>
                                  <p className="text-2xs text-slate-600">{m.uploadedBy?.email}</p>
                                </td>
                                <td className="py-4">
                                  {m.isTask ? (
                                    <span className={`px-2.5 py-0.5 rounded-lg text-2xs font-extrabold uppercase border ${
                                      m.status === "APPROVED" 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                        : m.status === "REJECTED"
                                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                                    }`}>
                                      {m.status === "APPROVED" ? "Approved" : m.status === "REJECTED" ? "Rejected" : "Pending Review"}
                                    </span>
                                  ) : (
                                    <span className={`px-2.5 py-0.5 rounded-lg text-2xs font-extrabold uppercase border ${
                                      m.isApproved 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}>
                                      {m.isApproved ? "Approved" : "Pending Review"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 text-2xs text-slate-600">
                                  {new Date(m.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-right">
                                  {m.isTask ? (
                                    <div className="flex justify-end gap-2">
                                      {(m.status === "COMPLETED" || m.status === "REJECTED") && (
                                        <button
                                          disabled={actionLoading === `task-approve-${m.id}`}
                                          onClick={() => handleApproveTaskProof(m.id, true)}
                                          className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
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
                                          onClick={() => handleApproveTaskProof(m.id, false)}
                                          className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
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
                                          onClick={() => handleApproveTaskProof(m.id, false)}
                                          className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
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
                                        className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                                      >
                                        {actionLoading === `task-delete-${m.id}` ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end gap-2 flex-wrap">
                                      {!m.isApproved ? (
                                        <button
                                          disabled={actionLoading === `material-approve-${m.id}`}
                                          onClick={() => handleApproveMaterial(m.id, true)}
                                          className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
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
                                          className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
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
                                        className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-2xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                                      >
                                        {actionLoading === `material-delete-${m.id}` ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MATERIAL DIRECT UPLOAD FORM MODAL */}
                  {showMaterialForm && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up relative">
                        <ModalCloseButton
                          onClick={() => {
                            setShowMaterialForm(false);
                            setSelectedMaterialFile(null);
                          }}
                          className="absolute top-4 right-4"
                        />
                        <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">Upload Learning Material</h3>
                        <form onSubmit={handleMaterialUploadSubmit} noValidate className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Material Title</label>
                            <input
                              required
                              placeholder="e.g. Jolly Phonics Pupil Book 1"
                              value={materialForm.title}
                              onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Description (optional)</label>
                            <textarea
                              rows={3}
                              placeholder="Brief summary of the learning resource..."
                              value={materialForm.description}
                              onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1.5">Category Type</label>
                              <PortalSelect
                                value={materialForm.type}
                                onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                                className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                              >
                                <option value="PDF" className="bg-white text-slate-800">PDF Document</option>
                                <option value="PPT" className="bg-white text-slate-800">PPT Presentation</option>
                              </PortalSelect>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1.5">Associate Course</label>
                              <PortalSelect
                                value={materialForm.courseId}
                                onChange={(e) => setMaterialForm({ ...materialForm, courseId: e.target.value })}
                                className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                              >
                                {courses.map((course) => (
                                  <option key={course.id} value={course.id} className="bg-white text-slate-800">
                                    {course.title} ({course.level})
                                  </option>
                                ))}
                              </PortalSelect>
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Select File (PDF or PPT)</label>
                            <div className="flex flex-col gap-2">
                              <label className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 bg-[#F8FAFC] flex flex-col items-center justify-center cursor-pointer hover:bg-[#8AC926]/5 transition">
                                <Loader2 className={`w-8 h-8 text-[#8AC926] ${actionLoading === "material-upload" ? "animate-spin" : ""}`} />
                                <span className="font-bold text-[#8AC926] mt-2 text-2xs">
                                  {selectedMaterialFile ? selectedMaterialFile.name : "Choose PDF/PPT file from computer"}
                                </span>
                                <span className="text-3xs text-slate-650 mt-1">
                                  {selectedMaterialFile ? `(${(selectedMaterialFile.size / 1024 / 1024).toFixed(2)} MB)` : "Max file size: 100 MB"}
                                </span>
                                <input
                                  type="file"
                                  required
                                  accept=".pdf,.ppt,.pptx"
                                  className="hidden"
                                  onChange={(e) => setSelectedMaterialFile(e.target.files?.[0] ?? null)}
                                />
                              </label>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={actionLoading === "material-upload" || !selectedMaterialFile}
                            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase disabled:opacity-50 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 cursor-pointer"
                          >
                            {actionLoading === "material-upload" ? "Uploading to cPanel..." : "Upload & Publish Material"}
                          </button>
                        </form>
                      </div>
                    </div>
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
                        <AdminSearchInput
                          value={taskSearch}
                          onChange={setTaskSearch}
                          placeholder="Search tasks…"
                          ariaLabel="Search tasks"
                        />
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
                          onClick={() => setShowTaskForm(true)}
                          className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" /> Assign Task
                        </button>
                      </>
                    }
                  />

                  <AdminPageBody>
                  {filteredTasks.length === 0 ? (
                    <AdminListEmpty message="No task assignments matched your search or filters." />
                  ) : (
                    <AdminRecordList>
                      {taskPagination.paginatedItems.map((t) => (
                        <div key={t.id} className={adminListRowClass}>
                          <div className="flex-1 min-w-[180px]">
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
                              <p className="text-2xs text-slate-600 font-medium line-clamp-2">{t.description}</p>
                            )}
                            <p className="text-2xs text-slate-500 mt-0.5">
                              To: <span className="font-semibold text-slate-700">{t.teacher?.name ?? "—"}</span>
                              {t.teacher?.email && <> · {t.teacher.email}</>}
                            </p>
                            {t.dueDate && (
                              <p className="text-2xs text-rose-600 font-semibold mt-0.5 inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
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
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                        total={filteredTasks.length}
                        safePage={taskPagination.safePage}
                        totalPages={taskPagination.totalPages}
                        pageNumbers={taskPagination.pageNumbers}
                        onPageChange={taskPagination.setCurrentPage}
                        itemLabel="tasks"
                      />
                    </AdminRecordList>
                  )}

                  {/* ASSIGN TASK FORM MODAL */}
                  {showTaskForm && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative">
                        <ModalCloseButton onClick={() => setShowTaskForm(false)} className="absolute top-4 right-4" />
                        <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">Assign Task to Teacher</h3>
                        <form onSubmit={handleAssignTask} noValidate className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Select Teacher</label>
                            <PortalSelect
                              required
                              value={taskForm.teacherId}
                              onChange={(e) => setTaskForm({ ...taskForm, teacherId: e.target.value })}
                              className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            >
                              <option value="" className="bg-white text-slate-800">-- Choose a Teacher --</option>
                              {teachersList.map((t) => (
                                <option key={t.id} value={t.id} className="bg-white text-slate-800">{t.name} ({t.email})</option>
                              ))}
                            </PortalSelect>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Task Title</label>
                            <input
                              required
                              placeholder="e.g. Upload UKG Science lesson photos"
                              value={taskForm.title}
                              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Task Description / Instructions</label>
                            <textarea
                              rows={3}
                              placeholder="Provide detailed instructions for the teacher..."
                              value={taskForm.description}
                              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Due Date</label>
                            <input
                              type="date"
                              required
                              min={localDateInputMin()}
                              value={taskForm.dueDate}
                              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            />
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Today or a future date only.</p>
                          </div>

                          <button type="submit" className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10">
                            Assign Task
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                  </AdminPageBody>
                </AdminPageShell>
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
                          onClick={() => setShowBookForm(true)}
                          className="px-4 py-2 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider flex items-center gap-2 hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10 whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" /> Add Story Book
                        </button>
                      </>
                    }
                  />

                  <AdminPageBody>
                  {filteredBooks.length === 0 ? (
                    <AdminListEmpty message="No story books match your search." />
                  ) : (
                    <AdminRecordList>
                      {bookPagination.paginatedItems.map((b) => (
                        <div key={b.id} className={adminListRowClass}>
                          <div className="flex-1 min-w-[180px]">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-[#8AC926]/15 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30 shrink-0">
                                {b.category}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200 shrink-0">
                                {audienceLabel(b.audience ?? "BOTH")}
                              </span>
                            </div>
                            <p className="font-bold text-sm text-slate-800">{b.title}</p>
                            {b.author && (
                              <p className="text-2xs text-slate-600 font-medium">Author: {b.author}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                              disabled={actionLoading === `book-delete-${b.id}`}
                              onClick={() => handleDeleteStoryBook(b.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center"
                              title="Delete book"
                            >
                              {actionLoading === `book-delete-${b.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                      <AdminListPagination
                        rangeStart={bookPagination.rangeStart}
                        rangeEnd={bookPagination.rangeEnd}
                        total={filteredBooks.length}
                        safePage={bookPagination.safePage}
                        totalPages={bookPagination.totalPages}
                        pageNumbers={bookPagination.pageNumbers}
                        onPageChange={bookPagination.setCurrentPage}
                        itemLabel="books"
                      />
                    </AdminRecordList>
                  )}

                  {/* STORY BOOK UPLOAD FORM MODAL */}
                  {showBookForm && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-scale-up text-slate-800 relative">
                        <ModalCloseButton onClick={() => setShowBookForm(false)} className="absolute top-4 right-4" />
                        <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">Register Story Book</h3>
                        <form onSubmit={handleAddStoryBook} noValidate className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Book Title</label>
                            <input
                              required
                              placeholder="e.g. The Lion and the Mouse"
                              value={bookForm.title}
                              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Author Name (optional)</label>
                            <input
                              placeholder="e.g. Aesop"
                              value={bookForm.author}
                              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Book Category</label>
                            <PortalSelect
                              value={bookForm.category}
                              onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                              className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            >
                              {["Fairy Tales", "Phonics Books", "Bedtime Stories", "Animal Stories", "Picture Books", "Educational"].map((cat) => (
                                <option key={cat} value={cat} className="bg-white text-slate-800">{cat}</option>
                              ))}
                            </PortalSelect>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Show in portal</label>
                            <PortalSelect
                              value={bookForm.audience}
                              onChange={(e) =>
                                setBookForm({
                                  ...bookForm,
                                  audience: e.target.value as "STUDENT" | "TEACHER" | "BOTH",
                                })
                              }
                              className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            >
                              {LIBRARY_AUDIENCE_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </PortalSelect>
                            <p className="text-3xs text-slate-500 mt-1 font-medium">
                              Teachers and students can view and print only. Only admins can download files.
                            </p>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Book Document (PDF/PPT/DOC)</label>
                            <div className="flex flex-col gap-2">
                              <label className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 bg-[#F8FAFC] flex flex-col items-center justify-center cursor-pointer hover:bg-[#8AC926]/5 transition">
                                <Loader2 className={`w-8 h-8 text-[#8AC926] ${actionLoading === "book-save" ? "animate-spin" : ""}`} />
                                <span className="font-bold text-[#8AC926] mt-2 text-2xs">
                                  {bookFile ? bookFile.name : "Choose PDF/PPT/DOC file from computer"}
                                </span>
                                <span className="text-3xs text-slate-650 mt-1">
                                  {bookFile
                                    ? `(${(bookFile.size / 1024 / 1024).toFixed(2)} MB)`
                                    : "Uploads directly to secure cPanel storage."}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => setBookFile(e.target.files?.[0] ?? null)}
                                />
                              </label>
                            </div>
                          </div>

                          <button type="submit" className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10">
                            Register Book to Library
                          </button>
                        </form>
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
                    description="Review preschool admissions inquiries and franchise business opportunities."
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
                          ? "No admissions contact forms match your search."
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
                            aria-label={`View ${isFranchise ? "franchise" : "admission"} lead from ${item.name}`}
                          >
                            <div className="flex-1 min-w-[180px]">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-4xs font-extrabold uppercase border shrink-0 ${
                                    isFranchise
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {isFranchise ? "Franchise" : "Admission"}
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
                                  <> · Location: <span className="text-[#6B9E1A] font-semibold">{franchiseItem.location}</span></>
                                )}
                              </p>
                              {item.message && (
                                <p className="text-2xs text-slate-600 mt-1 line-clamp-2">{item.message}</p>
                              )}
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
                            <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                            {leadView.kind === "franchise" ? "Franchise lead" : "Admission inquiry"}
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
                                  <a href={`tel:${leadView.item.phone.replace(/\s/g, "")}`} className="text-[#4E8C52] hover:underline">
                                    {leadView.item.phone}
                                  </a>
                                ) : (
                                  "Not provided"
                                )}
                              </dd>
                            </div>
                          </div>
                          {leadView.kind === "franchise" && (leadView.item as FranchiseInquiry).location && (
                            <div className="flex gap-3">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <dt className="text-2xs font-bold text-slate-500 uppercase">Location</dt>
                                <dd className="font-semibold text-slate-800">
                                  {(leadView.item as FranchiseInquiry).location}
                                </dd>
                              </div>
                            </div>
                          )}
                          <div>
                            <dt className="text-2xs font-bold text-slate-500 uppercase mb-1">Message</dt>
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
                              setMessage("Complete Google sign-in in the new tab, then paste the refresh token into backend .env.");
                            } catch (err) {
                              setError(err instanceof ApiError ? err.message : "Could not start Google connect.");
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
                              setError(err instanceof ApiError ? err.message : "Failed to refresh Google reviews.");
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === "google-refresh"}
                          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-sans font-bold text-xs tracking-wider hover:bg-slate-50 transition whitespace-nowrap"
                        >
                          {actionLoading === "google-refresh" ? "Syncing…" : "Sync from Google"}
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
                          <h3 className="font-sans text-sm font-extrabold text-slate-900">Google Business reviews</h3>
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
                            Overall{" "}
                            <span className="text-[#FF9F1C]">★ {googleReviewsMeta.rating}</span>
                            {googleReviewsMeta.totalRatings != null && (
                              <span className="text-slate-600"> · {googleReviewsMeta.totalRatings} total ratings</span>
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
                          Google reviews not configured. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_IDS in backend .env, then click Refresh Google.
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
                                  <p className="font-bold text-2xs text-slate-900 truncate">{loc.placeName}</p>
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
                                  OAuth is not finished. Click <strong>Connect Google Business</strong>, then add{" "}
                                  <code className="text-2xs bg-slate-100 px-1 rounded">GOOGLE_BUSINESS_REFRESH_TOKEN</code> to backend .env.
                                </>
                              ) : googleReviewsMeta.fetchMode === "business_profile" ? (
                                <>
                                  No reviews loaded yet. Click <strong>Refresh Google</strong> once.
                                  If you see a rate-limit message above, wait 5 minutes before trying again.
                                </>
                              ) : (
                                <>
                                  No written reviews yet for {googleLocations.length || "your"} location(s).
                                  Connect Google Business or check Places API settings in backend .env.
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {googleReviews.map((r) => (
                                <div
                                  key={r.id}
                                  className="bg-white rounded-2xl p-5 border border-blue-100 shadow-md flex flex-col gap-3"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex text-[#FF9F1C] gap-0.5 text-sm">
                                      {Array.from({ length: r.rating }).map((_, idx) => (
                                        <span key={idx}>★</span>
                                      ))}
                                    </div>
                                    <span className="px-2 py-0.5 rounded-lg text-4xs font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                                      Google
                                    </span>
                                  </div>
                                  <p className={`text-xs leading-relaxed ${r.content === "—" ? "text-slate-500 italic" : "italic text-slate-700"}`}>
                                    {r.content === "—" ? "No written feedback (star rating only)" : `\u201C${r.content}\u201D`}
                                  </p>
                                  <div>
                                    <h5 className="font-sans font-bold text-xs text-slate-900">— {r.name}</h5>
                                    {r.placeName && (
                                      <p className="text-3xs text-slate-600 font-semibold mt-1">{r.placeName}</p>
                                    )}
                                    {r.relativeTime && (
                                      <p className="text-3xs text-slate-500 mt-0.5">{r.relativeTime}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </section>

                    {/* ── Manual testimonials (database) ── */}
                    <section>
                      <h3 className="font-sans text-sm font-extrabold text-slate-900 mb-4">Manual website testimonials</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {testimonials.length === 0 ? (
                          <div className="col-span-full bg-white rounded-2xl p-8 text-center text-sm font-semibold text-slate-600 border border-slate-200">
                            No manual testimonials yet. Use Add Review to create one.
                          </div>
                        ) : (
                          testimonials.map((t) => (
                            <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md flex flex-col justify-between hover:shadow-lg transition group/review">
                              <div>
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex text-[#FF9F1C] gap-0.5">
                                    {Array.from({ length: t.rating }).map((_, idx) => (
                                      <span key={idx}>★</span>
                                    ))}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-4xs font-extrabold uppercase border ${
                                    t.isApproved
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                  }`}>
                                    {t.isApproved ? "PUBLISHED" : "HIDDEN"}
                                  </span>
                                </div>
                                <p className="text-xs italic text-slate-700">&ldquo;{t.content}&rdquo;</p>
                                <h5 className="font-sans font-bold text-xs text-[#8AC926] mt-3">— {t.name}</h5>
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
                        <ModalCloseButton onClick={() => setShowTestimonialForm(false)} className="absolute top-4 right-4" />
                        <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">Register Parent Testimonial</h3>
                        <form onSubmit={handleAddTestimonial} noValidate className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Parent Name</label>
                            <input
                              required
                              placeholder="e.g. Mrs. Priya Govind"
                              value={testimonialForm.name}
                              onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Rating Stars (1 to 5)</label>
                            <PortalSelect
                              value={String(testimonialForm.rating)}
                              onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })}
                              className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] transition"
                            >
                              {[5, 4, 3, 2, 1].map((r) => (
                                <option key={r} value={r} className="bg-white text-slate-800">{r} Stars</option>
                              ))}
                            </PortalSelect>
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Review Content</label>
                            <textarea
                              rows={4}
                              required
                              placeholder="Simba Academy has changed the way my daughter learns. The staff..."
                              value={testimonialForm.content}
                              onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] placeholder-slate-400 transition"
                            />
                          </div>
                          <button type="submit" className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#78B020] transition shadow-md shadow-[#8AC926]/10">
                            Register Testimonial
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
                          <div className="flex-1 min-w-[180px]">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-4xs font-extrabold uppercase border border-sky-200 shrink-0">
                                {g.type}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-4xs font-extrabold uppercase border border-emerald-200 shrink-0">
                                Public gallery
                              </span>
                            </div>
                            <p className="font-bold text-sm text-slate-800">{g.title || "Academy Activity"}</p>
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
                        <ModalCloseButton onClick={closeGalleryForm} className="absolute top-4 right-4" />
                        <h3 className="font-sans text-lg font-extrabold text-slate-900 mb-4 pr-10">
                          {editingGallery ? "Edit Gallery Photo" : "Upload Gallery Photo"}
                        </h3>
                        <form onSubmit={handleSaveGallery} noValidate className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1.5">Photo title (optional)</label>
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
                              JPEG, PNG, WebP, or GIF. {editingGallery ? "Leave empty to keep the current photo." : "Uploaded to secure storage before publishing."}
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
