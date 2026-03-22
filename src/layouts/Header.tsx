import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="text-lg font-bold tracking-tight text-primary md:hidden">
        Sentinel
      </div>
      <div className="hidden md:flex flex-1 items-center space-x-4">
        <div className="text-sm text-muted-foreground">Sentinel Space</div>
      </div>
      
      <div className="flex items-center gap-4">
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
