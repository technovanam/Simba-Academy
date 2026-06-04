const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status, data.errors);
  }

  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ user: AuthUser; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
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
    body: { firstName: string; lastName: string; email: string; phone?: string }
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

  createTask: (token: string, body: { title: string; description?: string; dueDate?: string | null; teacherId: string }) =>
    request<Task>("/api/admin/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  approveTask: (token: string, id: string, body: { status: "APPROVED" | "REJECTED"; proofDesc?: string }) =>
    request<Task>(`/api/admin/tasks/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token),

  deleteTask: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/tasks/${id}`, { method: "DELETE" }, token),

  getStoryBooks: (token: string) =>
    request<StoryBook[]>("/api/admin/books", {}, token),

  getLibraryStoryBooks: (token: string) =>
    request<StoryBook[]>("/api/library/storybooks", {}, token),

  getTeacherStoryBooks: (token: string) =>
    request<StoryBook[]>("/api/teacher/books", {}, token),

  createStoryBook: (
    token: string,
    body: {
      title: string;
      author?: string | null;
      category: string;
      fileUrl: string;
      fileSize?: number | null;
      audience?: "STUDENT" | "TEACHER" | "BOTH";
    }
  ) =>
    request<StoryBook>("/api/admin/books", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  deleteStoryBook: (token: string, id: string) =>
    request<{ message: string }>(`/api/admin/books/${id}`, { method: "DELETE" }, token),

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
};

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
  employeeId?: string | null;
  status?: AccountStatus;
  mustChangePassword?: boolean;
  createdAt?: string;
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
  user?: { name: string; email: string } | null;
  course?: { title: string } | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  proofUrl?: string | null;
  proofDesc?: string | null;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  teacher?: { name: string; email: string } | null;
}

export interface StoryBook {
  id: string;
  title: string;
  author?: string | null;
  category: string;
  fileUrl: string;
  fileSize?: number | null;
  audience?: "STUDENT" | "TEACHER" | "BOTH";
  createdAt: string;
}
