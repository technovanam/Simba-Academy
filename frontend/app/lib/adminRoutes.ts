export type AdminTab =
  | "overview"
  | "users"
  | "payments"
  | "teachers"
  | "courses"
  | "materials"
  | "tasks"
  | "planner"
  | "books"
  | "inquiries"
  | "reviews"
  | "gallery"
  | "settings"
  | "documents"
  | "notifications";

/** URL segment after /admin/ */
export const ADMIN_TAB_SECTIONS: Record<AdminTab, string> = {
  overview: "dashboard",
  users: "users",
  payments: "payments",
  teachers: "teachers",
  courses: "courses",
  materials: "materials",
  tasks: "tasks",
  planner: "planner",
  books: "books",
  inquiries: "inquiries",
  reviews: "reviews",
  gallery: "gallery",
  settings: "settings",
  documents: "documents",
  notifications: "notifications",
};

export const ADMIN_TAB_PATHS: Record<AdminTab, string> = Object.fromEntries(
  Object.entries(ADMIN_TAB_SECTIONS).map(([tab, section]) => [tab, `/admin/${section}`])
) as Record<AdminTab, string>;

const SECTION_TO_TAB = Object.fromEntries(
  Object.entries(ADMIN_TAB_SECTIONS).map(([tab, section]) => [section, tab])
) as Record<string, AdminTab>;

export const ADMIN_SECTIONS = new Set(Object.values(ADMIN_TAB_SECTIONS));

/** Legacy combined marketing URL */
export const ADMIN_LEGACY_SECTION_REDIRECTS: Record<string, string> = {
  marketing: "/admin/reviews",
  documents: "/admin/books",
};

export function adminTabFromSection(section: string | undefined): AdminTab {
  if (!section) return "overview";
  if (section in ADMIN_LEGACY_SECTION_REDIRECTS) {
    return "overview";
  }
  return SECTION_TO_TAB[section] ?? "overview";
}

export function adminTabTitle(tab: AdminTab): string {
  const titles: Record<AdminTab, string> = {
    overview: "Dashboard",
    users: "Student Management",
    payments: "Payments",
    teachers: "Teacher Management",
    courses: "Courses",
    materials: "Approve Uploads",
    tasks: "Assign Tasks",
    planner: "Lesson Planner",
    books: "Story Library",
    inquiries: "General Enquiry",
    reviews: "Parent Reviews",
    gallery: "Media Gallery",
    settings: "Settings",
    documents: "Document Vault",
    notifications: "Notifications",
  };
  return titles[tab];
}
