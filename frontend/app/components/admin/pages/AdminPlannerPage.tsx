import { AdminLessonPlansPanel } from "../../AdminLessonPlansPanel";
import { useAdminOutlet } from "../AdminOutletContext";

export function AdminPlannerPage() {
  const { token, setMessage, setError } = useAdminOutlet();
  return <AdminLessonPlansPanel token={token} onNotify={setMessage} onError={setError} />;
}

