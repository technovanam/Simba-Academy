import type { AdminTab } from "../../lib/adminRoutes";
import { AdminOverviewPage } from "./pages/AdminOverviewPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminPaymentsPage } from "./pages/AdminPaymentsPage";
import { AdminTeachersPage } from "./pages/AdminTeachersPage";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminMaterialsPage } from "./pages/AdminMaterialsPage";
import { AdminTasksPage } from "./pages/AdminTasksPage";
import { AdminPlannerPage } from "./pages/AdminPlannerPage";
import { AdminBooksPage } from "./pages/AdminBooksPage";
import { AdminInquiriesPage } from "./pages/AdminInquiriesPage";
import { AdminReviewsPage } from "./pages/AdminReviewsPage";
import { AdminGalleryPage } from "./pages/AdminGalleryPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage";
import { DriveLibraryPanel } from "../DriveLibraryPanel";
import { useAdminOutlet } from "./AdminOutletContext";

export function AdminTabBody({ tab }: { tab: AdminTab }) {
  const { token } = useAdminOutlet();
  
  switch (tab) {
    case "overview":
      return <AdminOverviewPage />;
    case "users":
      return <AdminUsersPage />;
    case "payments":
      return <AdminPaymentsPage />;
    case "teachers":
      return <AdminTeachersPage />;
    case "courses":
      return <AdminCoursesPage />;
    case "materials":
      return <AdminMaterialsPage />;
    case "tasks":
      return <AdminTasksPage />;
    case "planner":
      return <AdminPlannerPage />;
    case "books":
      return <AdminBooksPage />;
    case "inquiries":
      return <AdminInquiriesPage />;
    case "reviews":
      return <AdminReviewsPage />;
    case "gallery":
      return <AdminGalleryPage />;
    case "settings":
      return <AdminSettingsPage />;
    case "notifications":
      return <AdminNotificationsPage />;
    case "documents":
      return <DriveLibraryPanel token={token!} role="ADMIN" />;
    default:
      return null;
  }
}
