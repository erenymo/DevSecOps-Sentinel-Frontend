import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar } from "lucide-react";
import { useWorkspaces, useDeleteWorkspace } from "../hooks/useWorkspaces";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Workspace } from "../types";

export function WorkspaceList() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useWorkspaces();
  const deleteMutation = useDeleteWorkspace();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching workspaces...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-xl bg-destructive/5 text-destructive border-destructive/20">
        <p className="font-semibold text-lg mb-2">Error Loading Workspaces</p>
        <p className="text-sm opacity-80">Failed to connect to the server. Please try again later.</p>
      </div>
    );
  }

  const workspaces: Workspace[] = data?.data || [];

  if (workspaces.length === 0) {
    return (
      <div className="p-16 text-center border-2 border-dashed rounded-xl bg-muted/20 border-muted/30">
        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
           <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg text-foreground">No Workspaces Found</p>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
          Get started by creating your first workspace to manage your security posture.
        </p>
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this workspace?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Workspace Name</TableHead>
            <TableHead className="font-semibold hidden sm:table-cell">Description</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Created At</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((workspace: Workspace) => (
            <TableRow
              key={workspace.id}
              className="hover:bg-muted/30 transition-colors group cursor-pointer"
              onClick={() => navigate(`/workspaces/${workspace.id}`)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {workspace.name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {workspace.description || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                {format(new Date(workspace.createdAt), "PPP")}
              </TableCell>
              <TableCell className="text-right p-2">
                <div className="flex justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, workspace.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
