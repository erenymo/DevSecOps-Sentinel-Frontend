import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { CreateModuleModal } from "@/features/workspaces/components/CreateModuleModal";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useModulesByWorkspace } from "@/features/workspaces/hooks/useModules";
import {
  Boxes,
  ShieldAlert,
  FileWarning,
  Clock,
  PackageOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Module } from "@/features/workspaces/types";

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const { data: workspacesData } = useWorkspaces();
  const { data: modulesData, isLoading } = useModulesByWorkspace(
    workspaceId || ""
  );

  const workspace = workspacesData?.data?.find(
    (w) => w.id === workspaceId
  );
  const modules: Module[] = modulesData?.data || [];

  const summaryCards = [
    {
      label: "Total Modules",
      value: modules.length,
      icon: Boxes,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Vulnerabilities",
      value: 0,
      icon: ShieldAlert,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "License Issues",
      value: 0,
      icon: FileWarning,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Last Scan",
      value: "—",
      icon: Clock,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Breadcrumb
        overrides={{
          "/workspaces": "Workspaces",
          [`/workspaces/${workspaceId}`]: workspace?.name || "Loading…",
        }}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {workspace?.name || "Loading…"}
        </h1>
        {workspace?.description && (
          <p className="text-muted-foreground text-sm mt-1">
            {workspace.description}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Modules</h2>
          {workspaceId && <CreateModuleModal workspaceId={workspaceId} />}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">
              Fetching modules...
            </p>
          </div>
        ) : modules.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed rounded-xl bg-muted/20 border-muted/30">
            <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg text-foreground">
              No Modules Yet
            </p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
              Create your first module to start tracking dependencies and
              vulnerabilities.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((mod) => (
              <Card
                key={mod.id}
                className="border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() =>
                  navigate(
                    `/workspaces/${workspaceId}/modules/${mod.id}`
                  )
                }
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Module Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <PackageOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {mod.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mod.ecosystem} · {mod.rootPath}
                        </p>
                      </div>
                    </div>

                    {/* Right: Stats */}
                    <div className="flex items-center gap-4 sm:gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-lg font-bold">0</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Deps
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-500">0</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Vulns
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-500">0</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          License
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors hidden sm:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
