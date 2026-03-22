import { Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, Shield } from "lucide-react";

export function AuthLayout() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">Sentinel</span>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} DevSecOps Sentinel. All rights reserved.
      </div>
    </div>
  );
}
