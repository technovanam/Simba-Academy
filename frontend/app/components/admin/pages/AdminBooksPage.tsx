import { DriveLibraryPanel } from "../../DriveLibraryPanel";
import { useAdminOutlet } from "../AdminOutletContext";

export function AdminBooksPage() {
  const { token } = useAdminOutlet();
  return <DriveLibraryPanel token={token!} role="ADMIN" />;
}
