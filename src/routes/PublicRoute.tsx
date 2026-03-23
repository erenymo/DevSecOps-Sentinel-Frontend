import { Navigate, Outlet } from "react-router-dom";
import { authStore } from "@/features/auth/store/authStore";

export function PublicRoute() {
  if (authStore.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
