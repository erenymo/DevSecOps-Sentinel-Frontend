import { useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useModulesByWorkspace } from "@/features/workspaces/hooks/useModules";
import { useUploadSbom, useModuleComponents } from "@/features/workspaces/hooks/useScanner";
import {
  PackageOpen,
  ShieldAlert,
  FileWarning,
  Layers,
  Loader2,
  Upload,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import type { Module, Component } from "@/features/workspaces/types";

export function ModuleDetailPage() {
  const { workspaceId, moduleId } = useParams<{
    workspaceId: string;
    moduleId: string;
  }>();

  const [file, setFile] = useState<File | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const uploadSbom = useUploadSbom(moduleId || "");
  const { data: componentsData, isLoading: isComponentsLoading } = useModuleComponents(moduleId || "");
  const components = componentsData?.data || [];

  const topLevelComponents = components.filter(
    (c) => !c.isTransitive || !c.parentName || !components.some((p) => p.name === c.parentName)
  );

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderComponentRow = (comp: Component, depth: number = 0) => {
    const children = components.filter((c) => c.parentName === comp.name && c.id !== comp.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedRows.has(comp.id);

    return (
      <Fragment key={`row-${comp.id}`}>
        <tr className="hover:bg-muted/50 transition-colors border-b">
          <td className="px-4 py-3 font-medium flex items-center">
            <div style={{ paddingLeft: `${depth * 1.5}rem` }} className="flex items-center">
              {hasChildren ? (
                <button 
                  onClick={(e) => toggleRow(comp.id, e)} 
                  className="mr-2 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-6 mr-2" />
              )}
              {comp.name}
            </div>
          </td>
          <td className="px-4 py-3">{comp.version}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${comp.isTransitive ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
              {comp.isTransitive ? 'Transitive' : 'Direct'}
            </span>
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            {comp.licenseName || "Unknown"}
          </td>
        </tr>
        {isExpanded && children.map((child) => renderComponentRow(child, depth + 1))}
      </Fragment>
    );
  };

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
      count: components.length,
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
          [`/workspaces/${workspaceId}/${moduleId}`]:
            module?.name || "Loading…",
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
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
        
        {/* Upload Action */}
        <div className="flex items-center gap-2">
          <Input 
            type="file" 
            accept=".json,.xml"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-[250px] cursor-pointer"
          />
          <Button 
            onClick={() => file && uploadSbom.mutate(file)}
            disabled={!file || uploadSbom.isPending}
            className="gap-2"
          >
            {uploadSbom.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Analyze
          </Button>
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
              <p className="text-sm text-muted-foreground mb-4">
                {tab.description}
              </p>
              
              {tab.label === "Dependencies" ? (
                isComponentsLoading ? (
                  <div className="p-8 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : components.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Version</th>
                          <th className="px-4 py-3 font-medium">Type</th>
                          <th className="px-4 py-3 font-medium">License</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {topLevelComponents.map((c) => renderComponentRow(c))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-lg bg-muted/10 text-center text-muted-foreground text-sm">
                    No dependencies found. Upload an SBOM & analyze.
                  </div>
                )
              ) : (
                <div className="p-8 border-2 border-dashed rounded-lg bg-muted/10 text-center text-muted-foreground text-sm">
                  No data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
