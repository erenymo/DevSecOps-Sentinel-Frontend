import { useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useModulesByWorkspace } from "@/features/workspaces/hooks/useModules";
import {
  PackageOpen,
  ShieldAlert,
  FileWarning,
  Layers,
} from "lucide-react";
import type { Module } from "@/features/workspaces/types";

export function ModuleDetailPage() {
  const { workspaceId, moduleId } = useParams<{
    workspaceId: string;
    moduleId: string;
  }>();

  const { data: workspacesData } = useWorkspaces();
  const { data: modulesData } = useModulesByWorkspace(workspaceId || "");

  const workspace = workspacesData?.data?.find((w) => w.id === workspaceId);
  const module: Module | undefined = modulesData?.data?.find(
    (m) => m.id === moduleId
  );

  const tabs = [
    {
      label: "Dependencies",
      icon: Layers,
      count: 0,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description:
        "View all direct and transitive dependencies for this module.",
    },
    {
      label: "Vulnerabilities",
      icon: ShieldAlert,
      count: 0,
      color: "text-red-500",
      bg: "bg-red-500/10",
      description:
        "Security vulnerabilities detected across dependencies.",
    },
    {
      label: "License Issues",
      icon: FileWarning,
      count: 0,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description:
        "License compatibility issues and copyleft risks identified.",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Breadcrumb
        overrides={{
          "/workspaces": "Workspaces",
          [`/workspaces/${workspaceId}`]: workspace?.name || "Loading…",
          [`/workspaces/${workspaceId}/modules/${moduleId}`]:
            module?.name || "Loading…",
        }}
      />

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <PackageOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {module?.name || "Loading…"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {module?.ecosystem || ""}{module?.rootPath ? ` · ${module.rootPath}` : ""}
          </p>
        </div>
      </div>

      {/* Tab-like cards */}
      <div className="grid gap-6">
        {tabs.map((tab) => (
          <Card
            key={tab.label}
            className="border bg-card shadow-sm"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${tab.bg}`}
                  >
                    <tab.icon className={`h-5 w-5 ${tab.color}`} />
                  </div>
                  <CardTitle className="text-lg">{tab.label}</CardTitle>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">
                  {tab.count}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tab.description}
              </p>
              <div className="mt-4 p-8 border-2 border-dashed rounded-lg bg-muted/10 text-center text-muted-foreground text-sm">
                No data available yet. Run a scan to populate this section.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
