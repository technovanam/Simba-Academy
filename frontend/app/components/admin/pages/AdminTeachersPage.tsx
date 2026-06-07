import { AdminPeoplePanel } from "../../AdminPeoplePanel";
import { useAdminOutlet } from "../AdminOutletContext";

export function AdminTeachersPage() {
  const { token, user, setMessage, setError } = useAdminOutlet();
  return (
    <AdminPeoplePanel
      mode="teachers"
      token={token}
      currentUserId={user?.id}
      onNotify={setMessage}
      onError={setError}
    />
  );
}

