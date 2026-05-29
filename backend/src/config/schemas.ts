import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Contact / Inquiry ───────────────────────────────────────────────
export const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const franchiseInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  location: z.string().optional(),
  message: z.string().optional(),
});

// ── Payment ─────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  currency: z.string().default("INR"),
  courseId: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  courseId: z.string().optional(),
});

// ── Course ──────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  level: z.enum(["Playgroup", "LKG", "UKG", "Nursery", "All"]),
  price: z.number().positive("Price must be positive").optional(),
  imageUrl: z.string().url().optional(),
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
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
  isActive: z.boolean().optional(),
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
  imageUrl: z.string(),
  type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
});
