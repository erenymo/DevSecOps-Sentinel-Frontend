import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { CreateModuleModal } from "@/features/workspaces/components/CreateModuleModal";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useModulesByWorkspace, useDeleteModule } from "@/features/workspaces/hooks/useModules";
import { Button } from "@/components/ui/button";
import {
  Boxes,
  ShieldAlert,
  FileWarning,
  Clock,
  PackageOpen,
  ChevronRight,
  Loader2,
  Trash2
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
  
  const deleteModuleMutation = useDeleteModule();

  const handleDeleteModule = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this module?")) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const lastScanDates = modules.map(m => m.lastScanDate).filter(Boolean);
  const latestScanDate = lastScanDates.length > 0
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(Math.max(...lastScanDates.map(d => new Date(d!).getTime()))))
    : "—";

  const wsThreatScore = workspace?.threatScore !== undefined && workspace?.threatScore !== null
    ? workspace.threatScore
    : (modules.length > 0 && modules.some(m => m.threatScore !== undefined && m.threatScore !== null)
        ? Math.max(...modules.map(m => m.threatScore || 0).filter(Boolean)) 
        : -1);

  const wsLicenseScore = workspace?.licenseScore !== undefined && workspace?.licenseScore !== null
    ? workspace.licenseScore
    : (modules.length > 0 && modules.some(m => m.licenseScore !== undefined && m.licenseScore !== null)
        ? Math.min(...modules.map(m => m.licenseScore ?? 100)) 
        : -1);

  const wsThreatScoreVal = wsThreatScore >= 0 ? `${wsThreatScore.toFixed(1)}/10` : "—";
  const wsLicenseScoreVal = (wsLicenseScore >= 0 && wsLicenseScore <= 100) ? `${wsLicenseScore}%` : "—";

  const summaryCards = [
    {
      label: "Total Modules",
      value: modules.length,
      icon: Boxes,
      iconColor: "text-blue-500",
      bg: "bg-blue-500/10",
      valColor: "text-foreground",
    },
    {
      label: "Vulnerabilities",
      value: modules.reduce((acc, m) => acc + (m.vulnerabilityCount || 0), 0),
      icon: ShieldAlert,
      iconColor: "text-red-500",
      bg: "bg-red-500/10",
      valColor: "text-foreground",
    },
    {
      label: "License Issues",
      value: modules.reduce((acc, m) => acc + (m.licenseIssueCount || 0), 0),
      icon: FileWarning,
      iconColor: "text-amber-500",
      bg: "bg-amber-500/10",
      valColor: "text-foreground",
    },
    {
      label: "Threat Score",
      value: wsThreatScoreVal,
      icon: ShieldAlert,
      iconColor: wsThreatScore >= 7.0 ? "text-red-500" : wsThreatScore >= 4.0 ? "text-amber-500" : wsThreatScore >= 0 ? "text-green-500" : "text-muted-foreground",
      bg: wsThreatScore >= 7.0 ? "bg-red-500/10" : wsThreatScore >= 4.0 ? "bg-amber-500/10" : wsThreatScore >= 0 ? "bg-green-500/10" : "bg-muted/10",
      valColor: wsThreatScore >= 7.0 ? "text-red-600 dark:text-red-400" : wsThreatScore >= 4.0 ? "text-amber-600 dark:text-amber-400" : wsThreatScore >= 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
    },
    {
      label: "Compliance Score",
      value: wsLicenseScoreVal,
      icon: FileWarning,
      iconColor: wsLicenseScore >= 80 ? "text-green-500" : wsLicenseScore >= 50 ? "text-amber-500" : wsLicenseScore >= 0 ? "text-red-500" : "text-muted-foreground",
      bg: wsLicenseScore >= 80 ? "bg-green-500/10" : wsLicenseScore >= 50 ? "bg-amber-500/10" : wsLicenseScore >= 0 ? "bg-red-500/10" : "bg-muted/10",
      valColor: wsLicenseScore >= 80 ? "text-green-600 dark:text-green-400" : wsLicenseScore >= 50 ? "text-amber-600 dark:text-amber-400" : wsLicenseScore >= 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
    },
    {
      label: "Last Scan",
      value: latestScanDate,
      icon: Clock,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
      valColor: "text-foreground",
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.bg}`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold truncate ${card.valColor}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{card.label}</p>
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
                    <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap sm:flex-nowrap">
                      <div className="text-center min-w-[36px]">
                        <p className="text-base font-bold text-foreground">{mod.dependencyCount || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          Deps
                        </p>
                      </div>
                      <div className="text-center min-w-[36px]">
                        <p className="text-base font-bold text-red-500">{mod.vulnerabilityCount || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          Vulns
                        </p>
                      </div>
                      <div className="text-center min-w-[36px]">
                        <p className="text-base font-bold text-amber-500">{mod.licenseIssueCount || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          License
                        </p>
                      </div>

                      {mod.threatScore !== undefined && mod.threatScore !== null && (
                        <div className="text-center bg-red-500/5 dark:bg-red-500/10 rounded-md px-2 py-0.5 border border-red-500/20 min-w-[50px] shrink-0">
                          <p className={`text-xs font-black ${
                            mod.threatScore >= 7.0 ? "text-red-600 dark:text-red-400" :
                            mod.threatScore >= 4.0 ? "text-amber-600 dark:text-amber-400" :
                            "text-green-600 dark:text-green-400"
                          }`}>
                            {mod.threatScore.toFixed(1)}/10
                          </p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">
                            Threat
                          </p>
                        </div>
                      )}

                      {mod.licenseScore !== undefined && mod.licenseScore !== null && (
                        <div className="text-center bg-emerald-500/5 dark:bg-emerald-500/10 rounded-md px-2 py-0.5 border border-emerald-500/20 min-w-[50px] shrink-0">
                          <p className={`text-xs font-black ${
                            mod.licenseScore >= 80 ? "text-green-600 dark:text-green-400" :
                            mod.licenseScore >= 50 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          }`}>
                            {mod.licenseScore}%
                          </p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">
                            Compliance
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hidden sm:flex"
                          onClick={(e) => handleDeleteModule(e, mod.id)}
                          disabled={deleteModuleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors hidden sm:block" />
                      </div>
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
