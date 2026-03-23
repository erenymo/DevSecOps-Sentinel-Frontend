import { useTheme } from "next-themes";
import { Moon, Sun, Menu, LayoutDashboard, Briefcase, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Workspaces", icon: Briefcase, path: "/workspaces" },
];

export function Header() {
  const { setTheme, theme } = useTheme();
  const location = useLocation();

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <Sheet>
          <SheetTrigger>
            <button className="p-2 md:hidden hover:bg-accent rounded-md transition-colors" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-6 border-b text-left">
              <SheetTitle className="flex items-center gap-2 text-primary">
                <Shield className="h-6 w-6" />
                <span className="font-bold tracking-tight">Sentinel</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="p-3 mt-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="text-lg font-bold tracking-tight text-primary md:hidden">
          Sentinel
        </div>
        <div className="hidden md:flex flex-1 items-center space-x-4">
          <div className="text-sm font-medium text-muted-foreground">Sentinel Space</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shadow-sm cursor-pointer hover:opacity-90">
          U
        </div>
      </div>
    </header>
  );
}
