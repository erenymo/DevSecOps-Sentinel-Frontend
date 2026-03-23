import { CreateWorkspaceModal } from "@/features/workspaces/components/CreateWorkspaceModal";
import { WorkspaceList } from "@/features/workspaces/components/WorkspaceList";
import { Briefcase } from "lucide-react";

export function WorkspacesPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
            <Briefcase className="h-4 w-4" />
            Security Context
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground text-sm">
            Manage your project environments and isolated security boundaries.
          </p>
        </div>
        <CreateWorkspaceModal />
      </div>

      <div className="grid gap-6">
        <WorkspaceList />
      </div>
    </div>
  );
}
