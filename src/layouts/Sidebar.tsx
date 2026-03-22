import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card text-card-foreground hidden md:flex flex-col">
      <div className="p-4 border-b font-bold text-xl tracking-tight text-primary">
        Sentinel <span className="text-sm font-normal text-muted-foreground block">DevSecOps</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground font-medium transition-colors">
          Dashboard
        </Link>
        {/* Additional secure modules will go here */}
      </nav>
    </aside>
  );
}
