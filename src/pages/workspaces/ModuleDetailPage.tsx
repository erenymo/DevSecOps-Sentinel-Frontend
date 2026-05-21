import { useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useModulesByWorkspace } from "@/features/workspaces/hooks/useModules";
import { useUploadSbom, useModuleComponents, useUpdateVexStatus } from "@/features/workspaces/hooks/useScanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PackageOpen,
  ShieldAlert,
  FileWarning,
  Layers,
  Loader2,
  Upload,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Search
} from "lucide-react";
import type { Module, Component } from "@/features/workspaces/types";

const getLicenseRisk = (name: string): "high" | "medium" | "low" => {
  const upper = name.toUpperCase();
  if (upper.includes("GPL") && !upper.includes("LGPL")) return "high";
  if (upper.includes("LGPL") || upper.includes("MPL") || upper.includes("EPL") || upper.includes("CDDL")) return "medium";
  return "low";
};

const getLicenseColor = (name: string) => {
  const risk = getLicenseRisk(name);
  if (risk === "high") return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30";
  if (risk === "medium") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30";
  return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30";
};

const getSeverityColor = (severityLevel?: string) => {
  if (!severityLevel) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
  const upper = severityLevel.toUpperCase();
  if (upper === "CRITICAL" || upper === "HIGH") 
    return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30";
  if (upper === "MEDIUM") 
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30";
  if (upper === "LOW")
    return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
};

export function ModuleDetailPage() {
  const { workspaceId, moduleId } = useParams<{
    workspaceId: string;
    moduleId: string;
  }>();

  const [file, setFile] = useState<File | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isEnriching, setIsEnriching] = useState<boolean>(false);
  
  const [depSearchTerm, setDepSearchTerm] = useState("");
  const [depSort, setDepSort] = useState<{ key: "name" | "license", direction: "asc" | "desc" } | null>({ key: "name", direction: "asc" });

  const [vulnSearchTerm, setVulnSearchTerm] = useState("");
  const [vulnSort, setVulnSort] = useState<{ key: "component" | "severity" | "status", direction: "asc" | "desc" } | null>({ key: "severity", direction: "desc" });
  const [expandedVulnGroups, setExpandedVulnGroups] = useState<Set<string>>(new Set());
  
  const uploadSbom = useUploadSbom(moduleId || "", () => {
    setIsEnriching(true);
    setFile(null);
    setTimeout(() => setIsEnriching(false), 30000); // 30 sn timeout
  });
  const updateVexStatus = useUpdateVexStatus(moduleId || "");

  const handleStatusChange = (componentId: string, externalId: string, status: string) => {
    updateVexStatus.mutate({ componentId, externalId, status });
  };

  const { data: componentsData, isLoading: isComponentsLoading } = useModuleComponents(moduleId || "", isEnriching);
  const components = componentsData?.data || [];

  const allVulnerabilities = components.flatMap(c => 
    (c.vulnerabilities || []).map(v => ({
      componentId: c.id,
      componentName: c.name,
      componentVersion: c.version,
      ...v
    }))
  );

  const filteredVulnerabilities = allVulnerabilities.filter(v => 
    v.componentName.toLowerCase().includes(vulnSearchTerm.toLowerCase())
  );

  // Group vulnerabilities by component name
  const groupedVulnsMap = new Map<string, {
    componentName: string;
    componentVersion: string;
    componentId: string;
    vulnerabilities: typeof allVulnerabilities;
    maxSeverityScore: number;
    maxSeverityLevel: string;
  }>();

  filteredVulnerabilities.forEach(v => {
    const key = v.componentName;
    const severityScore = v.severityScore ?? 0;
    const existing = groupedVulnsMap.get(key);
    
    if (existing) {
      existing.vulnerabilities.push(v);
      if (severityScore > existing.maxSeverityScore) {
        existing.maxSeverityScore = severityScore;
        existing.maxSeverityLevel = v.severityLevel || "UNKNOWN";
      }
    } else {
      groupedVulnsMap.set(key, {
        componentName: v.componentName,
        componentVersion: v.componentVersion || "",
        componentId: v.componentId || "",
        vulnerabilities: [v],
        maxSeverityScore: severityScore,
        maxSeverityLevel: v.severityLevel || "UNKNOWN"
      });
    }
  });

  const groupedVulnerabilities = Array.from(groupedVulnsMap.values());

  // Sort groups
  if (vulnSort) {
    groupedVulnerabilities.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (vulnSort.key === "component") {
        valA = a.componentName.toLowerCase();
        valB = b.componentName.toLowerCase();
      } else if (vulnSort.key === "severity") {
        valA = a.maxSeverityScore;
        valB = b.maxSeverityScore;
      } else if (vulnSort.key === "status") {
        valA = (a.vulnerabilities[0]?.status || "").toLowerCase();
        valB = (b.vulnerabilities[0]?.status || "").toLowerCase();
      }
      
      if (valA < valB) return vulnSort.direction === "asc" ? -1 : 1;
      if (valA > valB) return vulnSort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Sort internal vulnerabilities of each group by severityScore descending
  groupedVulnerabilities.forEach(group => {
    group.vulnerabilities.sort((a, b) => (b.severityScore ?? 0) - (a.severityScore ?? 0));
  });

  const topLevelComponents = components.filter(
    (c) => !c.isTransitive
  );

  let filteredTopLevelComponents = topLevelComponents.filter(c => {
    const directMatches = c.name.toLowerCase().includes(depSearchTerm.toLowerCase());
    const transitiveMatches = components.some(child => 
      child.isTransitive && 
      child.parentName === c.name && 
      child.name.toLowerCase().includes(depSearchTerm.toLowerCase())
    );
    return directMatches || transitiveMatches;
  });

  if (depSort) {
    filteredTopLevelComponents.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (depSort.key === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (depSort.key === "license") {
        valA = (a.licenseNames && a.licenseNames[0]) ? a.licenseNames[0].toLowerCase() : "z"; 
        valB = (b.licenseNames && b.licenseNames[0]) ? b.licenseNames[0].toLowerCase() : "z";
      }
      
      if (valA < valB) return depSort.direction === "asc" ? -1 : 1;
      if (valA > valB) return depSort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const handleDepSort = (key: "name" | "license") => {
    setDepSort(prev => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleVulnSort = (key: "component" | "severity" | "status") => {
    setVulnSort(prev => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

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

  const toggleVulnGroup = (compName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedVulnGroups((prev) => {
      const next = new Set(prev);
      if (next.has(compName)) next.delete(compName);
      else next.add(compName);
      return next;
    });
  };

  const renderComponentRow = (comp: Component, depth: number = 0) => {
    const children = components.filter((c) => 
      c.isTransitive && 
      c.parentName === comp.name &&
      (!depSearchTerm || 
        c.name.toLowerCase().includes(depSearchTerm.toLowerCase()) || 
        comp.name.toLowerCase().includes(depSearchTerm.toLowerCase())
      )
    );
    const hasChildren = children.length > 0;
    const isExpanded = expandedRows.has(comp.id) || (!!depSearchTerm && hasChildren);

    return (
      <Fragment key={`row-${comp.id}`}>
        <tr className={`transition-colors border-b ${comp.isTransitive ? 'bg-muted/20 dark:bg-muted/5 text-muted-foreground hover:bg-muted/30' : 'hover:bg-muted/50 font-medium'}`}>
          <td className="px-4 py-3 font-medium flex items-center">
            <div style={{ paddingLeft: `${depth * 1.5}rem` }} className="flex items-center">
              {hasChildren ? (
                <button 
                  onClick={(e) => toggleRow(comp.id, e)} 
                  className="mr-2 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-primary animate-in fade-in zoom-in duration-200" /> : <ChevronRight className="w-4 h-4 text-muted-foreground animate-in fade-in zoom-in duration-200" />}
                </button>
              ) : (
                <span className="w-6 mr-2" />
              )}
              <span className={comp.isTransitive ? 'font-normal text-xs' : 'text-sm font-semibold text-foreground'}>
                {comp.name}
              </span>
            </div>
          </td>
          <td className={`px-4 py-3 ${comp.isTransitive ? 'text-xs' : 'text-sm'}`}>{comp.version}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${comp.isTransitive ? 'bg-secondary/60 text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
              {comp.isTransitive ? 'Transitive' : 'Direct'}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {comp.licenseNames && comp.licenseNames.length > 0 ? (
                comp.licenseNames.map((l, i) => (
                  <span key={i} className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium ${getLicenseColor(l)}`}>
                    {l}
                  </span>
                ))
              ) : isEnriching ? (
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Unknown</span>
              )}
            </div>
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

  const licenseIssuesCount = components.filter(c => 
    c.licenseNames && c.licenseNames.some(l => getLicenseRisk(l) !== "low")
  ).length;

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
      count: allVulnerabilities.length,
      color: "text-red-500",
      bg: "bg-red-500/10",
      description:
        "Security vulnerabilities detected across dependencies.",
    },
    {
      label: "License Issues",
      icon: FileWarning,
      count: licenseIssuesCount,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <PackageOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight line-clamp-1">
              {module?.name || "Loading…"}
            </h1>
            <p className="text-muted-foreground text-sm line-clamp-1">
              {module?.ecosystem || ""}{module?.rootPath ? ` · ${module.rootPath}` : ""}
            </p>
          </div>
        </div>
        
        {/* Upload Action */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          <Input 
            type="file" 
            accept=".json,.xml"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full sm:w-[250px] cursor-pointer"
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 max-w-sm relative">
                      <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                      <Input
                        placeholder="Search dependencies..."
                        value={depSearchTerm}
                        onChange={(e) => setDepSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full min-w-[600px] text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">
                              <button onClick={() => handleDepSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                Name
                                <ArrowUpDown className={`w-3 h-3 ${depSort?.key === "name" ? "text-primary" : ""}`} />
                              </button>
                            </th>
                            <th className="px-4 py-3 font-medium">Version</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">
                              <button onClick={() => handleDepSort("license")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                License
                                <ArrowUpDown className={`w-3 h-3 ${depSort?.key === "license" ? "text-primary" : ""}`} />
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredTopLevelComponents.length > 0 ? (
                            filteredTopLevelComponents.map((c) => renderComponentRow(c))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                No dependencies match your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-lg bg-muted/10 text-center text-muted-foreground text-sm">
                    No dependencies found. Upload an SBOM & analyze.
                  </div>
                )
              ) : tab.label === "Vulnerabilities" ? (
                isComponentsLoading || isEnriching ? (
                  <div className="p-12 flex flex-col justify-center items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">The scanning process is ongoing.</p>
                  </div>
                ) : groupedVulnerabilities.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 max-w-sm relative">
                      <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                      <Input
                        placeholder="Search vulnerabilities by component..."
                        value={vulnSearchTerm}
                        onChange={(e) => setVulnSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full min-w-[600px] text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">
                              <button onClick={() => handleVulnSort("component")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                Component
                                <ArrowUpDown className={`w-3 h-3 ${vulnSort?.key === "component" ? "text-primary" : ""}`} />
                              </button>
                            </th>
                            <th className="px-4 py-3 font-medium">Version</th>
                            <th className="px-4 py-3 font-medium">Vulnerability ID</th>
                            <th className="px-4 py-3 font-medium">
                              <button onClick={() => handleVulnSort("severity")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                Severity
                                <ArrowUpDown className={`w-3 h-3 ${vulnSort?.key === "severity" ? "text-primary" : ""}`} />
                              </button>
                            </th>
                            <th className="px-4 py-3 font-medium">
                              <button onClick={() => handleVulnSort("status")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                Status
                                <ArrowUpDown className={`w-3 h-3 ${vulnSort?.key === "status" ? "text-primary" : ""}`} />
                              </button>
                            </th>
                            <th className="px-4 py-3 font-medium">Fixed In</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {groupedVulnerabilities.map((group) => {
                            const isExpanded = expandedVulnGroups.has(group.componentName) || (!!vulnSearchTerm);
                            return (
                              <Fragment key={group.componentName}>
                                <tr 
                                  onClick={(e) => toggleVulnGroup(group.componentName, e)}
                                  className="hover:bg-muted/20 transition-colors border-b cursor-pointer bg-muted/10 dark:bg-muted/5 font-semibold"
                                >
                                  <td className="px-4 py-3 font-semibold flex items-center">
                                    <div className="flex items-center">
                                      <button 
                                        onClick={(e) => toggleVulnGroup(group.componentName, e)} 
                                        className="mr-2 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-primary animate-in fade-in zoom-in duration-200" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-muted-foreground animate-in fade-in zoom-in duration-200" />
                                        )}
                                      </button>
                                      <span className="text-sm font-semibold text-foreground">
                                        {group.componentName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">{group.componentVersion}</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-2.5 py-0.5 text-xs font-semibold border border-red-200 dark:border-red-500/20">
                                      {group.vulnerabilities.length} {group.vulnerabilities.length === 1 ? "Vulnerability" : "Vulnerabilities"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${getSeverityColor(group.maxSeverityLevel)}`}>
                                      {group.maxSeverityLevel} {group.maxSeverityScore > 0 ? `(${group.maxSeverityScore})` : ""}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground font-normal">Expand to manage VEX</td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">-</td>
                                </tr>
                                
                                {isExpanded && group.vulnerabilities.map((v) => (
                                  <tr key={`${v.componentId}-${v.externalId}`} className="bg-muted/5 dark:bg-muted/2 hover:bg-muted/10 transition-colors border-b text-muted-foreground text-xs">
                                    <td className="px-4 py-2.5 font-normal pl-12 flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-primary/40 mr-2" />
                                      <span className="text-xs">{group.componentName} (Transitive)</span>
                                    </td>
                                    <td className="px-4 py-2.5">{v.componentVersion}</td>
                                    <td className="px-4 py-2.5 font-medium">
                                      <div className="flex flex-col">
                                        <span className="text-red-500/90 font-semibold">{v.externalId}</span>
                                        {v.vulnerabilityId && <span className="text-[10px] text-muted-foreground font-normal">{v.vulnerabilityId}</span>}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium ${getSeverityColor(v.severityLevel)}`}>
                                        {v.severityLevel || "UNKNOWN"} {v.severityScore !== undefined && v.severityScore !== null ? `(${v.severityScore})` : ""}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <Select
                                        value={v.status}
                                        onValueChange={(val) => handleStatusChange(v.componentId || "", v.externalId || "", val || "")}
                                        disabled={updateVexStatus.isPending}
                                      >
                                        <SelectTrigger className="w-[150px] h-7 text-[11px] py-0 px-2 bg-background border border-muted/80">
                                          <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Under Investigation" className="text-[11px]">Under Investigation</SelectItem>
                                          <SelectItem value="Affected" className="text-[11px]">Affected</SelectItem>
                                          <SelectItem value="Not Affected" className="text-[11px]">Not Affected</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-4 py-2.5 text-green-600 dark:text-green-500 font-medium">{v.fixedVersion || "-"}</td>
                                  </tr>
                                ))}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-lg bg-muted/10 text-center text-muted-foreground text-sm">
                    No vulnerabilities detected.
                  </div>
                )
              ) : tab.label === "License Issues" ? (
                (() => {
                  const licenseIssueComponents = components.filter(c => 
                    c.licenseNames && c.licenseNames.some(l => getLicenseRisk(l) !== "low")
                  );
                  
                  return isComponentsLoading || isEnriching ? (
                    <div className="p-12 flex flex-col justify-center items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm font-medium text-muted-foreground animate-pulse">The scanning process is ongoing.</p>
                    </div>
                  ) : licenseIssueComponents.length > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-md border overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm text-left">
                          <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3 font-medium">Component</th>
                              <th className="px-4 py-3 font-medium">Version</th>
                              <th className="px-4 py-3 font-medium">Type</th>
                              <th className="px-4 py-3 font-medium">License Name</th>
                              <th className="px-4 py-3 font-medium">Risk Level</th>
                              <th className="px-4 py-3 font-medium">Compliance Impact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {licenseIssueComponents.map((comp) => {
                              const highRiskLicenses = comp.licenseNames?.filter(l => getLicenseRisk(l) === "high") || [];
                              const isHighRisk = highRiskLicenses.length > 0;
                              const riskText = isHighRisk ? "High" : "Medium";
                              
                              return (
                                <tr key={comp.id} className="hover:bg-muted/50 transition-colors border-b">
                                  <td className="px-4 py-3 font-semibold text-foreground">{comp.name}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{comp.version}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${comp.isTransitive ? 'bg-secondary/60 text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
                                      {comp.isTransitive ? 'Transitive' : 'Direct'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {comp.licenseNames?.map((l, i) => (
                                        <span key={i} className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium ${getLicenseColor(l)}`}>
                                          {l}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold border ${
                                      isHighRisk 
                                        ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    }`}>
                                      {riskText}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    {isHighRisk ? (
                                      <span className="text-red-600 dark:text-red-400 font-medium">
                                        Copyleft - Commercial distribution requires open-sourcing derived works.
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        Weak Copyleft - Modifications to this library itself must be open-sourced.
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg bg-green-500/5 dark:bg-green-500/2 text-center text-green-600 dark:text-green-400 text-sm font-semibold flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Compliance Shield Clear</h4>
                        <p className="text-xs text-muted-foreground max-w-md font-normal mx-auto">
                          No copyleft or restrictive licenses detected. All dependency licenses comply with low-risk commercial policies.
                        </p>
                      </div>
                    </div>
                  );
                })()
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
