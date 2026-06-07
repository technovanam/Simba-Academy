import { AdminPeoplePanel } from "../../AdminPeoplePanel";
import { useAdminOutlet } from "../AdminOutletContext";

export function AdminUsersPage() {
  const { token, user, setMessage, setError } = useAdminOutlet();
  return (
    <AdminPeoplePanel
      mode="users"
      token={token}
      currentUserId={user?.id}
      onNotify={setMessage}
      onError={setError}
    />
  );
}

