import { z } from "zod";

// Accepts either an absolute http(s) URL or a local upload path like
// "/uploads/abc.pdf" (files live in backend/uploads, served at /backend/uploads).
const urlOrUploadPath = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "Must be a valid URL or upload path"
  );

export const STUDENT_CLASS_LEVELS = ["Playgroup", "Nursery", "Pre-KG", "LKG", "UKG", "Preschool"] as const;
export type StudentClassLevel = (typeof STUDENT_CLASS_LEVELS)[number];

// ── Auth ────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  studentClass: z.enum(STUDENT_CLASS_LEVELS).optional(),
});

export const registerWithPaymentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  studentClass: z.enum(STUDENT_CLASS_LEVELS, { message: "Please select your child's class" }),
  paymentSessionId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  portal: z.enum(["student", "teacher", "admin"]).optional(),
});

export const checkEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ── Contact / Inquiry ───────────────────────────────────────────────
export const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  inquiryType: z.enum(["Preschool", "Franchise"]).default("Preschool"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const franchiseInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  location: z.string().optional(),
  message: z.string().optional(),
});

// ── Course ──────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  level: z.enum([
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
  ]),
  price: z.number().positive("Price must be positive").optional(),
  imageUrl: urlOrUploadPath.optional(),
  isActive: z.boolean().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

// ── Material ────────────────────────────────────────────────────────
export const createMaterialSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["PDF", "PPT", "VIDEO", "IMAGE", "DOC"]),
  courseId: z.string(),
});

// ── Admin ───────────────────────────────────────────────────────────
export const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  studentClass: z.enum(STUDENT_CLASS_LEVELS, { message: "Assigned class is required" }),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7, "Valid phone number required").optional(),
  status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
  studentClass: z.enum(STUDENT_CLASS_LEVELS, { message: "Assigned class is required" }).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
  status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
  phone: z.string().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  portal: z.enum(["student", "teacher", "admin"]).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const approveMaterialSchema = z.object({
  isApproved: z.boolean(),
});

// ── Testimonial ─────────────────────────────────────────────────────
export const createTestimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  rating: z.number().min(1).max(5).default(5),
});

export const approveTestimonialSchema = z.object({
  isApproved: z.boolean(),
});

// ── Gallery ─────────────────────────────────────────────────────────
export const createGallerySchema = z.object({
  title: z.string().optional(),
  imageUrl: urlOrUploadPath,
  type: z.literal("IMAGE").default("IMAGE"),
});

export const updateGallerySchema = z.object({
  title: z.string().optional(),
  imageUrl: urlOrUploadPath.optional(),
});

function isDueDateTodayOrFuture(value: string): boolean {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() >= today.getTime();
}

// ── Task Assignment (Admin) ─────────────────────────────────────────
export const createTaskFolderSchema = z.object({
  name: z.string().min(2, "Folder name must be at least 2 characters"),
  studentClass: z.string().min(1, "Class is required"),
});

export const createRecurringTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  studentClass: z.string().min(1, "Class is required"),
  repeatDay: z.enum(["DAILY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  isActive: z.boolean().optional(),
  folderId: z.string().optional().nullable(),
});

export const updateRecurringTaskSchema = createRecurringTaskSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  dueDate: z
    .string()
    .min(1, "Due date is required")
    .refine(isDueDateTodayOrFuture, "Due date cannot be in the past"),
  teacherId: z.string(),
});

export const approveTaskSchema = z.object({
  status: z.enum(["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "RESUBMITTED"]),
  proofDesc: z.string().optional(),
  rejectionReason: z.string().optional(),
});


// ── Lesson Plan (Admin) ───────────────────────────────────────────
export const createLessonPlanSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  courseId: z.string().optional().nullable(),
  planDate: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  materialsNeeded: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  fileUrl: urlOrUploadPath.optional().nullable(),
  fileName: z.string().optional().nullable(),
});

export const updateLessonPlanSchema = createLessonPlanSchema.partial();


// ── Story Book (Admin) ──────────────────────────────────────────────
export const createStoryBookSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  author: z.string().optional().nullable(),
  category: z.string().min(1, "At least one class must be selected").refine(
    (val) => val.split(",").every((c) => (STUDENT_CLASS_LEVELS as readonly string[]).includes(c.trim())),
    { message: "Each class must be one of: " + STUDENT_CLASS_LEVELS.join(", ") }
  ),
  fileUrl: urlOrUploadPath,
  fileSize: z.number().optional().nullable(),
  audience: z.enum(["STUDENT", "TEACHER", "BOTH"]).default("BOTH"),
  folderId: z.string().optional().nullable(),
});

export const updateStoryBookSchema = createStoryBookSchema.partial();

// ── Library Folders (Admin) ─────────────────────────────────────────
export const createFolderSchema = z.object({
  name: z.string().min(2, "Folder name must be at least 2 characters"),
  parentId: z.string().optional().nullable(),
  audience: z.enum(["STUDENT", "TEACHER", "BOTH"]).default("BOTH"),
  category: z.enum([...STUDENT_CLASS_LEVELS, "ALL"] as [string, ...string[]]).optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(2, "Folder name must be at least 2 characters").optional(),
  audience: z.enum(["STUDENT", "TEACHER", "BOTH"]).optional(),
  category: z.enum([...STUDENT_CLASS_LEVELS, "ALL"] as [string, ...string[]]).optional().nullable(),
});

export const moveItemSchema = z.object({
  targetFolderId: z.string().nullable(),
});


// ── Task Proof Submission (Teacher) ─────────────────────────────────
export const submitTaskProofSchema = z.object({
  proofUrl: urlOrUploadPath,
  proofDesc: z.string().min(5, "Proof description must be at least 5 characters"),
});

