import { Navigate } from "react-router";

export default function Redirect() {
  return <Navigate to="/student/library" replace />;
}
