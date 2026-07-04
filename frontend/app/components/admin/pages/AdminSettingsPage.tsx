import { AdminSettingsPanel } from "../../AdminSettingsPanel";
import { useAdminOutlet } from "../AdminOutletContext";

export function AdminSettingsPage() {
  const { token, user } = useAdminOutlet();
  return <AdminSettingsPanel user={user!} token={token!} />;
}
