import { Navigate } from "react-router";

export default function StudentReceiptsRedirect() {
  return <Navigate to="/student/dashboard" replace />;
}
