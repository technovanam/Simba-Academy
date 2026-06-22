export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/** Prefer field-level validation messages over generic "Validation failed". */
export function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.errors) {
      const messages = Object.values(err.errors).flat();
      if (messages.length > 0) return messages.join(" ");
    }
    return err.message;
  }
  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const refreshedToken = response.headers.get("x-refresh-token");
  if (refreshedToken && typeof window !== "undefined") {
    localStorage.setItem("simba_token", refreshedToken);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status, data.errors);
  }

  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  register: (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    studentClass?: string;
  }) =>
    request<{ user: AuthUser; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: {
    email: string;
    password: string;
    portal?: "student" | "teacher" | "admin";
  }) =>
    request<{ user: AuthUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createPreRegisterOrder: () =>
    request<ZohoPaymentSessionResponse>("/api/payments/create-pre-register-order", {
      method: "POST",
    }),

  registerWithPayment: (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    studentClass: string;
    paymentSessionId: string;
    paymentId: string;
    signature: string;
  }) =>
    request<{ user: AuthUser; token: string }>("/api/auth/register-with-payment", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  checkEmail: (email: string) =>
    request<{ available: boolean }>("/api/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),


  profile: (token: string) =>
    request<AuthUser>("/api/auth/profile", {}, token),

  submitInquiry: (body: {
    name: string;
    email: string;
    phone?: string;
    inquiryType: "Preschool" | "Franchise";
    message: string;
  }) =>
    request<{ message: string }>("/api/contact/inquiry", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitFranchise: (body: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    message?: string;
  }) =>
    request<{ message: string }>("/api/contact/franchise", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getCourses: () => request<Course[]>("/api/courses"),

  getGallery: () => request<GalleryItem[]>("/api/public/gallery"),

  /** Approved reviews only — homepage / public site */
  getTestimonials: () => request<Testimonial[]>("/api/public/testimonials"),

  /** Google + approved manual reviews for the website */
  getPublicReviews: () => request<PublicReviewsResponse>("/api/public/reviews"),

  getGoogleReviewsStatus: (token: string) =>
    request<GoogleReviewsStatusResponse>("/api/admin/google-reviews/status", {}, token),

  syncGoogleReviews: (token: string) =>
    request<GoogleReviewsStatusResponse>("/api/admin/google-reviews/sync", { method: "POST" }, token),

  getGoogleBusinessAuthUrl: (token: string) =>
    request<{ url: string; message?: string }>("/api/admin/google-reviews/auth-url", {}, token),

  /** All reviews including pending — admin Parent Reviews tab */
  getAdminTestimonials: (token: string) =>
    request<Testimonial[]>("/api/admin/testimonials", {}, token),

  getDashboard: (token: string) =>
    request<DashboardStats>("/api/admin/dashboard", {}, token),

  getInquiries: (token: string) =>
    request<Inquiry[]>("/api/contact/inquiries", {}, token),

  getFranchiseInquiries: (token: string) =>
    request<FranchiseInquiry[]>("/api/contact/franchises", {}, token),

  markInquiryRead: (token: string, id: string) =>
    request<Inquiry>(`/api/contact/inquiries/${id}/read`, { method: "PATCH" }, token),

  createTeacher: (
    token: string,
    body: { firstName: string; lastName: string; email: string; phone?: string; studentClass?: string | null }
  ) =>
    request<AuthUser & { emailSent?: boolean; emailWarning?: string }>("/api/admin/teachers", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateTeacher: (
    token: string,
    id: string,
    body: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      status: AccountStatus;
      studentClass: string | null;
    }>
  ) =>
    request<AuthUser>(`/api/admin/teachers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  sendTeacherPasswordReset: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/teachers/${id}/send-reset`, { method: "POST" }, token),

  getUsers: (
    token: string,
    params?: { search?: string; filter?: UserListFilter; sort?: UserListSort }
  ) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.filter) qs.set("filter", params.filter);
    if (params?.sort) qs.set("sort", params.sort);
    const query = qs.toString();
    return request<AuthUser[]>(`/api/admin/users${query ? `?${query}` : ""}`, {}, token);
  },

  getTeachers: (
    token: string,
    params?: { search?: string; filter?: TeacherListFilter; sort?: UserListSort }
  ) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.filter) qs.set("filter", params.filter);
    if (params?.sort) qs.set("sort", params.sort);
    const query = qs.toString();
    return request<AuthUser[]>(`/api/admin/teachers${query ? `?${query}` : ""}`, {}, token);
  },

  updateUser: (
    token: string,
    id: string,
    body: Partial<{
      name: string;
      firstName: string;
      lastName: string;
      email: string;
      role: AuthUser["role"];
      status: AccountStatus;
      phone: string | null;
    }>
  ) =>
    request<AuthUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  sendUserPasswordReset: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}/send-reset`, { method: "POST" }, token),

  deleteUser: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, { method: "DELETE" }, token),

  forgotPassword: (email: string, portal?: "student" | "teacher" | "admin") =>
    request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, ...(portal ? { portal } : {}) }),
    }),

  resetPassword: (body: { token: string; password: string }) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  changePassword: (
    token: string,
    body: { currentPassword: string; newPassword: string }
  ) =>
    request<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  getMaterials: (token: string) =>
    request<Material[]>("/api/admin/materials", {}, token),

  deleteMaterial: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/materials/${id}`, { method: "DELETE" }, token),

  approveMaterial: (token: string, id: string, isApproved: boolean) =>
    request<Material>(`/api/admin/materials/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    }, token),

  createCourse: (token: string, body: Partial<Course>) =>
    request<Course>("/api/courses", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateCourse: (token: string, id: string, body: Partial<Course>) =>
    request<Course>(`/api/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  deleteCourse: (token: string, id: string) =>
    request<{ message: string }>(`/api/courses/${id}`, { method: "DELETE" }, token),

  getPayments: (token: string) =>
    request<Payment[]>("/api/admin/payments", {}, token),

  getTasks: (token: string) =>
    request<Task[]>("/api/admin/tasks", {}, token),

  getRecurringTasks: (token: string) =>
    request<RecurringTask[]>("/api/admin/recurring-tasks", {}, token),

  createRecurringTask: (token: string, body: { title: string; description?: string; studentClass: string; repeatDay: string; isActive?: boolean; folderId?: string | null }) =>
    request<RecurringTask>("/api/admin/recurring-tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateRecurringTask: (token: string, id: string, body: Partial<{ title: string; description: string | null; studentClass: string; repeatDay: string; isActive: boolean; folderId: string | null }>) =>
    request<RecurringTask>(`/api/admin/recurring-tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  deleteRecurringTask: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/recurring-tasks/${id}`, { method: "DELETE" }, token),

  getRecurringTaskHistory: (token: string, id: string) =>
    request<Task[]>(`/api/admin/recurring-tasks/${id}/history`, {}, token),

  getTaskFolders: (token: string) =>
    request<TaskFolder[]>("/api/admin/task-folders", {}, token),

  createTaskFolder: (token: string, body: { name: string; studentClass: string }) =>
    request<TaskFolder>("/api/admin/task-folders", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateTaskFolder: (token: string, id: string, body: Partial<{ name: string; studentClass: string }>) =>
    request<TaskFolder>(`/api/admin/task-folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  deleteTaskFolder: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/task-folders/${id}`, { method: "DELETE" }, token),

  createTask: (token: string, body: { title: string; description?: string; dueDate?: string | null; teacherId: string }) =>
    request<Task>("/api/admin/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  approveTask: (token: string, id: string, body: { status: "APPROVED" | "REJECTED" | "COMPLETED" | "SUBMITTED" | "UNDER_REVIEW" | "RESUBMITTED"; proofDesc?: string; rejectionReason?: string }) =>
    request<Task>(`/api/admin/tasks/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  getTaskAuditHistory: (token: string, taskId: string) =>
    request<TaskAudit[]>(`/api/admin/tasks/${taskId}/audit`, {}, token),

  deleteTask: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/tasks/${id}`, { method: "DELETE" }, token),

  updateTask: (
    token: string,
    id: string,
    body: Partial<{ title: string; description: string | null; dueDate: string | null; teacherId: string }>
  ) =>
    request<Task>(`/api/admin/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  getStoryBooks: (token: string, folderId?: string | null) => {
    const qs = folderId !== undefined ? `?folderId=${encodeURIComponent(folderId ?? "root")}` : "";
    return request<StoryBook[]>(`/api/admin/books${qs}`, {}, token);
  },

  getLibraryStoryBooks: (token: string, folderId?: string | null) => {
    const qs = folderId !== undefined ? `?folderId=${encodeURIComponent(folderId ?? "root")}` : "";
    return request<StoryBook[]>(`/api/library/storybooks${qs}`, {}, token);
  },

  getTeacherStoryBooks: (token: string, folderId?: string | null) => {
    const qs = folderId !== undefined ? `?folderId=${encodeURIComponent(folderId ?? "root")}` : "";
    return request<StoryBook[]>(`/api/teacher/books${qs}`, {}, token);
  },

  getLessonPlans: (token: string) =>
    request<LessonPlan[]>("/api/admin/lesson-plans", {}, token),

  createLessonPlan: (
    token: string,
    body: {
      title: string;
      courseId?: string | null;
      planDate?: string | null;
      content: string;
      materialsNeeded?: string | null;
      isPublished?: boolean;
      fileUrl?: string | null;
      fileName?: string | null;
      targetClass?: string | null;
    }
  ) =>
    request<LessonPlan>("/api/admin/lesson-plans", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateLessonPlan: (
    token: string,
    id: string,
    body: Partial<{
      title: string;
      courseId: string | null;
      planDate: string | null;
      content: string;
      materialsNeeded: string | null;
      isPublished: boolean;
      fileUrl: string | null;
      fileName: string | null;
      targetClass: string | null;
    }>
  ) =>
    request<LessonPlan>(`/api/admin/lesson-plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  deleteLessonPlan: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/lesson-plans/${id}`, { method: "DELETE" }, token),

  getTeacherLessonPlans: (token: string) =>
    request<LessonPlan[]>("/api/teacher/lesson-plans", {}, token),

  createStoryBook: (
    token: string,
    body: {
      title: string;
      author?: string | null;
      category: string;
      fileUrl: string;
      fileSize?: number | null;
      audience?: "STUDENT" | "TEACHER" | "BOTH";
      folderId?: string | null;
    }
  ) =>
    request<StoryBook>("/api/admin/books", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateStoryBook: (
    token: string,
    bookId: string,
    body: {
      title?: string;
      author?: string | null;
      category?: string;
      fileUrl?: string;
      fileSize?: number | null;
      audience?: "STUDENT" | "TEACHER" | "BOTH";
      folderId?: string | null;
    }
  ) =>
    request<StoryBook>(`/api/admin/books/${bookId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }, token),

  moveStoryBook: (token: string, bookId: string, targetFolderId: string | null) =>
    request<StoryBook>(`/api/admin/books/${bookId}/move`, {
      method: "PATCH",
      body: JSON.stringify({ targetFolderId }),
    }, token),

  deleteStoryBook: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/books/${id}`, { method: "DELETE" }, token),

  // ── Library Folders ─────────────────────────────────────────────
  getLibraryFolders: (token: string, parentId?: string | null) => {
    const qs = parentId !== undefined ? `?parentId=${encodeURIComponent(parentId ?? "root")}` : "";
    return request<LibraryFolder[]>(`/api/admin/folders${qs}`, {}, token);
  },

  getLibraryFolderAncestors: (token: string, folderId: string) =>
    request<Array<{ id: string; name: string; parentId: string | null }>>(
      `/api/admin/folders/${folderId}/ancestors`, {}, token
    ),

  getAllLibraryFolders: (token: string) =>
    request<Array<{ id: string; name: string; parentId: string | null }>>(
      "/api/admin/folders-all", {}, token
    ),

  createLibraryFolder: (
    token: string,
    body: { name: string; parentId?: string | null; audience?: string; category?: string | null }
  ) =>
    request<LibraryFolder>("/api/admin/folders", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateLibraryFolder: (
    token: string,
    id: string,
    body: { name?: string; audience?: string; category?: string | null }
  ) =>
    request<LibraryFolder>(`/api/admin/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  moveLibraryFolder: (token: string, folderId: string, targetFolderId: string | null) =>
    request<LibraryFolder>(`/api/admin/folders/${folderId}/move`, {
      method: "PATCH",
      body: JSON.stringify({ targetFolderId }),
    }, token),

  deleteLibraryFolder: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/folders/${id}`, { method: "DELETE" }, token),

  // Library folder browsing (teacher/student)
  getPublicLibraryFolders: (token: string, parentId?: string | null) => {
    const qs = parentId !== undefined ? `?parentId=${encodeURIComponent(parentId ?? "root")}` : "";
    return request<LibraryFolder[]>(`/api/library/folders${qs}`, {}, token);
  },

  getPublicFolderAncestors: (token: string, folderId: string) =>
    request<Array<{ id: string; name: string; parentId: string | null }>>(
      `/api/library/folders/${folderId}/ancestors`, {}, token
    ),

  markFranchiseRead: (token: string, id: string) =>
    request<FranchiseInquiry>(`/api/contact/franchises/${id}/read`, { method: "PATCH" }, token),

  createGalleryItem: (token: string, body: { title?: string; imageUrl: string; type?: string }) =>
    request<GalleryItem>("/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  updateGalleryItem: (
    token: string,
    id: string,
    body: { title?: string; imageUrl?: string }
  ) =>
    request<GalleryItem>(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  deleteGalleryItem: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/gallery/${id}`, { method: "DELETE" }, token),

  approveTestimonial: (token: string, id: string, isApproved: boolean) =>
    request<Testimonial>(`/api/admin/testimonials/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    }, token),

  deleteTestimonial: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/testimonials/${id}`, { method: "DELETE" }, token),

  createTestimonial: (token: string, body: { name: string; content: string; rating: number }) =>
    request<Testimonial>("/api/admin/testimonials", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  uploadRaw: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string; storage: "webdav" | "local"; verified: boolean }>("/api/storage/upload-raw", {
      method: "POST",
      body: formData,
    }, token);
  },

  uploadMaterial: (
    token: string,
    file: File,
    body: { title: string; description?: string; type: "PDF" | "PPT" | "VIDEO" | "IMAGE" | "DOC"; courseId: string }
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", body.title);
    if (body.description) formData.append("description", body.description);
    formData.append("type", body.type);
    formData.append("courseId", body.courseId);

    return request<Material>("/api/storage/upload", {
      method: "POST",
      body: formData,
    }, token);
  },

  getTeacherTasks: (token: string) =>
    request<Task[]>("/api/teacher/tasks", {}, token),

  getTeacherTaskAuditHistory: (token: string, taskId: string) =>
    request<TaskAudit[]>(`/api/teacher/tasks/${taskId}/audit`, {}, token),

  getTeacherStudents: (token: string) =>
    request<AuthUser[]>("/api/teacher/students", {}, token),

  submitTaskProof: (
    token: string,
    id: string,
    body: { proofUrl: string; proofDesc: string }
  ) =>
    request<Task>(`/api/teacher/tasks/${id}/proof`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  getTeacherMaterials: (token: string) =>
    request<Material[]>("/api/storage/materials", {}, token),

  createOrder: (token: string, body: { amount?: number; courseId?: string }) =>
    request<ZohoPaymentSessionResponse>("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  verifyPayment: (
    token: string,
    body: { paymentSessionId: string; paymentId: string; signature: string }
  ) =>
    request<{ success: boolean; payment: Payment }>("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  getStudentPayments: (token: string) =>
    request<Payment[]>("/api/payments/history", {}, token),

  getPublicStoryBooks: (token: string) =>
    request<StoryBook[]>("/api/library/storybooks", {}, token),

  updateBookStatus: (token: string, bookId: string, status: "READING" | "READ" | "UNREAD") =>
    request<{ success: boolean; status: string }>(
      `/api/student/books/${bookId}/status`,
      { method: "POST", body: JSON.stringify({ status }) },
      token
    ),

  getStudentNotifications: (token: string) =>
    request<StudentNotification[]>("/api/student/notifications", {}, token),

  getStudentNotificationUnreadCount: (token: string) =>
    request<{ count: number }>("/api/student/notifications/unread-count", {}, token),

  markStudentNotificationRead: (token: string, id: string) =>
    request<StudentNotification>(`/api/student/notifications/${id}/read`, { method: "PATCH" }, token),

  markAllStudentNotificationsRead: (token: string) =>
    request<{ message: string }>("/api/student/notifications/read-all", { method: "PATCH" }, token),

  getTeacherNotifications: (token: string) =>
    request<TeacherNotification[]>("/api/teacher/notifications", {}, token),

  getTeacherNotificationUnreadCount: (token: string) =>
    request<{ count: number }>("/api/teacher/notifications/unread-count", {}, token),

  markTeacherNotificationRead: (token: string, id: string) =>
    request<TeacherNotification>(`/api/teacher/notifications/${id}/read`, { method: "PATCH" }, token),

  markAllTeacherNotificationsRead: (token: string) =>
    request<{ message: string }>("/api/teacher/notifications/read-all", { method: "PATCH" }, token),

  getAdminNotifications: (token: string) =>
    request<AdminNotification[]>("/api/admin/notifications", {}, token),

  getAdminNotificationUnreadCount: (token: string) =>
    request<{ count: number }>("/api/admin/notifications/unread-count", {}, token),

  markAdminNotificationRead: (token: string, id: string) =>
    request<AdminNotification>(`/api/admin/notifications/${id}/read`, { method: "PATCH" }, token),

  markAllAdminNotificationsRead: (token: string) =>
    request<{ message: string }>("/api/admin/notifications/read-all", { method: "PATCH" }, token),

  browseDocuments: (token: string, folderId?: string | null, search?: string, type?: string) => {
    const qs = new URLSearchParams();
    if (folderId && folderId !== "root") qs.set("folderId", folderId);
    if (search) qs.set("search", search);
    if (type) qs.set("type", type);
    const query = qs.toString();
    return request<DriveItem[]>(`/api/documents/browse${query ? `?${query}` : ""}`, {}, token);
  },

  getDocumentAncestors: (token: string, folderId: string) =>
    request<DriveAncestor[]>(`/api/documents/ancestors/${folderId}`, {}, token),

  getRecentDocuments: (token: string) =>
    request<DriveItem[]>("/api/documents/recent", {}, token),

  createDriveFolder: (token: string, name: string, parentId?: string | null) =>
    request<DriveItem>("/api/documents/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    }, token),

  uploadDriveFile: (token: string, file: File, parentId?: string | null, convert = true) => {
    const formData = new FormData();
    formData.append("file", file);
    if (parentId && parentId !== "root") formData.append("parentId", parentId);
    formData.append("convert", String(convert));
    return request<DriveItem>("/api/documents/upload", {
      method: "POST",
      body: formData,
    }, token);
  },

  renameDriveItem: (token: string, id: string, name: string) =>
    request<DriveItem>(`/api/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }, token),

  deleteDriveItem: (token: string, id: string) =>
    request<{ success: boolean; message: string }>(`/api/documents/${id}`, {
      method: "DELETE",
    }, token),

  updateDriveAccessRule: (token: string, fileId: string, audience: "BOTH" | "TEACHER" | "STUDENT", targetClass: string | null) =>
    request(`/api/documents/${fileId}/access`, {
      method: "PUT",
      body: JSON.stringify({ audience, targetClass }),
    }, token),

  revokeDriveAccessRule: (token: string, fileId: string) =>
    request<{ success: boolean; message: string }>(`/api/documents/${fileId}/access`, {
      method: "DELETE",
    }, token),

  getDocumentLogs: (token: string) =>
    request<AuditLogItem[]>("/api/documents/logs", {}, token),
};

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export type AccountStatus = "ACTIVE" | "DEACTIVATED";
export type UserListFilter = "ALL" | "ACTIVE" | "DEACTIVATED" | "TEACHERS" | "STUDENTS" | "ADMINS";
export type TeacherListFilter = "ALL" | "ACTIVE" | "DEACTIVATED";
export type UserListSort = "NEWEST" | "OLDEST" | "NAME_ASC" | "NAME_DESC";

export interface AuthUser {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  phone?: string | null;
  studentClass?: string | null;
  employeeId?: string | null;
  status?: AccountStatus;
  mustChangePassword?: boolean;
  createdAt?: string;
  books?: Array<{
    id: string;
    title: string;
    author?: string | null;
    category: string;
    fileUrl: string;
    readingStatus: "UNREAD" | "READING" | "READ";
    isRead?: boolean;
  }>;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  level: string;
  price?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface GalleryItem {
  id: string;
  title?: string | null;
  imageUrl: string;
  type: string;
  createdAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  isApproved?: boolean;
}

export type PublicReviewSource = "google" | "manual";

export interface PublicReview {
  id: string;
  name: string;
  content: string;
  rating: number;
  source: PublicReviewSource;
  relativeTime?: string;
  profilePhotoUrl?: string;
  placeName?: string;
  placeId?: string;
}

export interface GoogleLocationSummary {
  placeId: string;
  placeName: string;
  rating?: number;
  totalRatings?: number;
  reviewsReturned: number;
}

export interface PublicReviewsResponse {
  reviews: PublicReview[];
  google: {
    configured: boolean;
    fetchMode?: "business_profile" | "places" | "oauth_pending" | "none";
    rating?: number;
    totalRatings?: number;
    placeName?: string;
    count: number;
    locationCount?: number;
    locations?: GoogleLocationSummary[];
  };
}

export interface GoogleReviewsStatusResponse {
  configured: boolean;
  fetchMode?: "business_profile" | "places" | "oauth_pending" | "none";
  message?: string;
  hint?: string;
  synced?: boolean;
  fromSnapshot?: boolean;
  syncBlocked?: string;
  syncedAt?: string;
  reviews?: Array<
    PublicReview & { placeId?: string; placeName?: string }
  >;
  rating?: number;
  totalRatings?: number;
  placeName?: string;
  locations?: GoogleLocationSummary[];
}

export interface DashboardStats {
  users: number;
  courses: number;
  materials: number;
  pendingApprovals: number;
  payments: number;
  revenue: number;
  inquiries: number;
  unreadInquiries: number;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface FranchiseInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  location?: string | null;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  fileUrl: string;
  fileSize?: number | null;
  isApproved: boolean;
  courseId: string;
  uploadedById?: string | null;
  createdAt: string;
  course?: { title: string; slug: string } | null;
  uploadedBy?: { name: string; email: string } | null;
}

export interface ZohoPaymentSessionResponse {
  paymentSessionId: string;
  orderId: string;
  amount: number;
  amountInr: number;
  amountString: string;
  currency: string;
  accountId: string;
  apiKey: string;
  domain: string;
  isTestMode?: boolean;
  isPlaceholder?: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentSessionId?: string | null;
  gatewayPaymentId?: string | null;
  userId: string;
  courseId?: string | null;
  createdAt: string;
  user?: { name: string; email: string; studentClass?: string | null } | null;
  course?: { title: string; level?: string | null } | null;
}

export interface TaskFolder {
  id: string;
  name: string;
  studentClass: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  description?: string | null;
  studentClass: string;
  repeatDay: string;
  isActive: boolean;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  proofUrl?: string | null;
  proofDesc?: string | null;
  proofSubmittedAt?: string | null;
  rejectionReason?: string | null;
  teacherId: string;
  recurringTaskId?: string | null;
  createdAt: string;
  updatedAt: string;
  teacher?: { name: string; email: string; studentClass?: string | null } | null;
  recurringTask?: { studentClass: string } | null;
}

export interface TaskAudit {
  id: string;
  taskId: string;
  action: string;
  statusFrom?: string | null;
  statusTo: string;
  changedById?: string | null;
  changedByName?: string | null;
  comments?: string | null;
  createdAt: string;
}

export interface StoryBook {
  id: string;
  title: string;
  author?: string | null;
  category: string;
  fileUrl: string;
  fileSize?: number | null;
  audience?: "STUDENT" | "TEACHER" | "BOTH";
  folderId?: string | null;
  createdAt: string;
  readingStatus?: "UNREAD" | "READING" | "READ";
  isRead?: boolean;
}

export interface LibraryFolder {
  id: string;
  name: string;
  parentId?: string | null;
  audience: "STUDENT" | "TEACHER" | "BOTH";
  category?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    children: number;
    storyBooks: number;
  };
}

export interface StudentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  storyBookId?: string | null;
  isRead: boolean;
  createdAt: string;
  storyBook?: Pick<StoryBook, "id" | "title" | "category" | "author"> | null;
}

export interface TeacherNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  storyBookId?: string | null;
  taskId?: string | null;
  lessonPlanId?: string | null;
  isRead: boolean;
  createdAt: string;
  storyBook?: Pick<StoryBook, "id" | "title" | "category" | "author"> | null;
  task?: Pick<Task, "id" | "title" | "status"> | null;
  lessonPlan?: Pick<LessonPlan, "id" | "title" | "planDate"> | null;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string | null;
  taskId?: string | null;
  paymentId?: string | null;
  user?: Pick<AuthUser, "id" | "name" | "role"> | null;
  task?: Pick<Task, "id" | "title" | "status"> | null;
  payment?: Pick<Payment, "id" | "amount" | "status"> | null;
}

export interface LessonPlan {
  id: string;
  title: string;
  courseId?: string | null;
  planDate?: string | null;
  content: string;
  materialsNeeded?: string | null;
  isPublished: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  targetClass?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: { title: string; level?: string } | null;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  thumbnailLink?: string;
  parents?: string[];
  accessRule?: {
    audience: "BOTH" | "TEACHER" | "STUDENT";
    targetClass: string | null;
  } | null;
}

export interface DriveAncestor {
  id: string;
  name: string;
  parentId: string | null;
}

