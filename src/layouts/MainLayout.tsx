import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <div className="flex bg-background min-h-screen text-foreground font-sans antialiased">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
