import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Workspaces", icon: Briefcase, path: "/workspaces" },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn("hidden md:flex w-64 border-r bg-card flex-col", className)}>
      <div className="h-14 border-b flex items-center px-6 gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg tracking-tight">Sentinel</span>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-between group px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-3 w-3" />}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Project Phase</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Alpha v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
