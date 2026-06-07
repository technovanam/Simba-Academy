import { AdminPaymentsPanel } from "../../AdminPaymentsPanel";
import { useAdminOutlet } from "../AdminOutletContext";

export function AdminPaymentsPage() {
  const { token, setError } = useAdminOutlet();
  return <AdminPaymentsPanel token={token} onError={setError} />;
}

