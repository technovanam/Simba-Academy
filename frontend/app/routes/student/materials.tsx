import { Navigate } from "react-router";

export default function StudentMaterialsRedirect() {
  return <Navigate to="/student/dashboard" replace />;
}
