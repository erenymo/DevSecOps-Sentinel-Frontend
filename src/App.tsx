import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { WorkspacesPage } from "./pages/workspaces/WorkspacesPage";
import { WorkspaceDetailPage } from "./pages/workspaces/WorkspaceDetailPage";
import { ModuleDetailPage } from "./pages/workspaces/ModuleDetailPage";
import { authStore } from "./features/auth/store/authStore";
import { Button } from "./components/ui/button";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authStore.clearAuth();
    navigate("/auth");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>Log out</Button>
      </div>
      <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
        <h3 className="font-semibold leading-none tracking-tight mb-2">Welcome to DevSecOps Sentinel</h3>
        <p className="text-sm text-muted-foreground">Frontend architecture scaffolded successfully with security and modern practices.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Route>
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
          <Route path="/workspaces/:workspaceId/modules/:moduleId" element={<ModuleDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
