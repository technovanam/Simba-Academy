import { useNavigate } from "react-router";
import { ApiError } from "../../lib/api";
import { clearSession } from "../../lib/auth";
import { useAdminOutlet } from "./AdminOutletContext";

export function useAdminTabLoadError() {
  const navigate = useNavigate();
  const { setError } = useAdminOutlet();

  return function handleLoadError(tab: string, err: unknown) {
    console.error(`Dashboard data load error for tab "${tab}":`, err);
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
      navigate("/admin/login");
    } else {
      setError(`Failed to load data for tab "${tab}". Please try again.`);
    }
  };
}
