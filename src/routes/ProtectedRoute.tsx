import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { authStore } from "@/features/auth/store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
