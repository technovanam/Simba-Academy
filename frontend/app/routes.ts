import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("courses", "routes/courses.tsx"),
  route("franchise", "routes/franchise.tsx"),
  route("contact", "routes/contact.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("teacher/login", "routes/teacher.login.tsx"),
  route("teacher/change-password", "routes/teacher.change-password.tsx"),
  route("teacher/forgot-password", "routes/teacher.forgot-password.tsx"),
  route("teacher/reset-password", "routes/teacher.reset-password.tsx"),
  route("admin/login", "routes/admin.login.tsx"),
  route("admin", "routes/admin.index.tsx"),
  route("admin/:section", "routes/admin.dashboard.tsx"),
  route("student/dashboard", "routes/student.dashboard.tsx"),
  route("student/checkout", "routes/student.checkout.tsx"),
  route("teacher/dashboard", "routes/teacher.dashboard.tsx"),
] satisfies RouteConfig;
