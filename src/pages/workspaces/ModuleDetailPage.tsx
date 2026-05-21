import { useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
import { useModulesByWorkspace } from "@/features/workspaces/hooks/useModules";
import { useUploadSbom, useModuleComponents, useUpdateVexStatus, useScanStatus, useAnalyzeLicenseInsights, useAnalyzeVulnerabilityInsights, useVulnerabilityInsights } from "@/features/workspaces/hooks/useScanner";
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
  Search,
  Sparkles,
  Info,
  ExternalLink
} from "lucide-react";
import type { Module, Component, VulnerabilityAiInsight, PackageVulnerabilityInsight } from "@/features/workspaces/types";

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
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
};


export function ModuleDetailPage() {
  const { workspaceId, moduleId } = useParams<{
    workspaceId: string;
    moduleId: string;
  }>();

  const [file, setFile] = useState<File | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [depSearchTerm, setDepSearchTerm] = useState("");
  const [depSort, setDepSort] = useState<{ key: "name" | "license", direction: "asc" | "desc" } | null>({ key: "name", direction: "asc" });

  const [vulnSearchTerm, setVulnSearchTerm] = useState("");
  const [vulnSeverityFilter, setVulnSeverityFilter] = useState<string>("all");
  const [vulnSort, setVulnSort] = useState<{ key: "component" | "severity" | "status", direction: "asc" | "desc" } | null>({ key: "severity", direction: "desc" });
  const [expandedVulnGroups, setExpandedVulnGroups] = useState<Set<string>>(new Set());
  const [expandedLicenseRows, setExpandedLicenseRows] = useState<Set<string>>(new Set());
  
  const uploadSbom = useUploadSbom(moduleId || "", () => {
    setFile(null);
  });
  const updateVexStatus = useUpdateVexStatus(moduleId || "");

  const handleStatusChange = (componentId: string, externalId: string, status: string) => {
    updateVexStatus.mutate({ componentId, externalId, status });
  };

  const { data: componentsData, isLoading: isComponentsLoading } = useModuleComponents(moduleId || "");
  const components = componentsData?.data || [];
  
  const { data: scanStatusResult } = useScanStatus(moduleId || "");
  const scanStatus = scanStatusResult?.data;
  const isEnrichingLicenses = scanStatus?.isDependenciesParsed ? !scanStatus.isLicenseEnrichmentCompleted : false;
  const isEnrichingVulns = scanStatus?.isDependenciesParsed ? !scanStatus.isVulnEnrichmentCompleted : false;

  const { data: vulnAiInsightResult } = useVulnerabilityInsights(moduleId || "");
  const vulnAiInsight = vulnAiInsightResult?.data;

  const analyzeLicenseInsights = useAnalyzeLicenseInsights(moduleId || "");
  const analyzeVulnerabilityInsights = useAnalyzeVulnerabilityInsights(moduleId || "");

  const renderLoadingUI = () => (
    <div className="p-12 flex flex-col justify-center items-center gap-4 max-w-md mx-auto mt-4">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
      </div>
      <div className="space-y-1 text-center w-full mt-2">
        <p className="text-sm font-semibold text-foreground">Fetching Data / Analysis in Progress</p>
        <p className="text-xs font-medium text-muted-foreground">Please wait while results are loading...</p>
      </div>
    </div>
  );

  const rawVulnerabilities = components.flatMap(c => 
    (c.vulnerabilities || []).map(v => ({
      componentId: c.id,
      componentName: c.name,
      componentVersion: c.version,
      ...v
    }))
  );

  const uniqueVulnsMapGlobal = new Map<string, typeof rawVulnerabilities[0]>();
  rawVulnerabilities.forEach(v => {
    const key = `${v.componentName}-${v.componentVersion}-${v.externalId}`;
    if (!uniqueVulnsMapGlobal.has(key)) {
      uniqueVulnsMapGlobal.set(key, v);
    }
  });

  const allVulnerabilities = Array.from(uniqueVulnsMapGlobal.values());

  const filteredVulnerabilities = allVulnerabilities.filter(v => {
    const matchesSearch = v.componentName.toLowerCase().includes(vulnSearchTerm.toLowerCase());
    const matchesSeverity = vulnSeverityFilter === "all" || v.severityLevel?.toUpperCase() === vulnSeverityFilter.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

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

  const toggleLicenseRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedLicenseRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
              ) : isEnrichingLicenses ? (
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
                  renderLoadingUI()
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
                    <div className="rounded-md border overflow-auto max-h-[620px] shadow-sm">
                      <table className="w-full min-w-[600px] text-sm text-left border-collapse">
                        <thead className="sticky top-0 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm text-muted-foreground z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
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
                isComponentsLoading || isEnrichingVulns ? (
                  renderLoadingUI()
                ) : groupedVulnerabilities.length > 0 ? (
                <div className="space-y-4">
                  {/* ─── AI Dashboard Card ──────────────────────────────── */}
                  {vulnAiInsight ? (
                    (() => {
                      const score = Math.min(10, Math.max(0, vulnAiInsight.systemCriticalityScore));
                      const radius = 28;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (score / 10) * circumference;
                      const scoreColor = score <= 3
                        ? 'text-green-500'
                        : score <= 6
                        ? 'text-amber-500'
                        : 'text-red-500';
                      const gradientFrom = score <= 3 ? 'from-green-500/10' : score <= 6 ? 'from-amber-500/10' : 'from-red-500/10';
                      return (
                        <Card className={`bg-gradient-to-r ${gradientFrom} via-red-500/5 to-purple-500/10 border-red-500/20 shadow-none`}>
                          <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                            {/* Score donut */}
                            <div className="w-full sm:w-[20%] border-b sm:border-b-0 sm:border-r border-red-500/20 p-4 flex flex-col items-center justify-center gap-2 bg-background/40">
                              <div className="relative w-20 h-20">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                                  <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
                                  <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className={`${scoreColor} transition-all duration-1000 ease-out`}
                                    strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className={`text-2xl font-black ${scoreColor}`}>{score.toFixed(1)}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Threat Score</span>
                            </div>
                             {/* Executive Plan */}
                            <div className="w-full sm:w-[80%] p-5 flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-5 h-5 text-red-500" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                                    AI Threat Analysis
                                    <span className="inline-flex items-center rounded-full bg-red-500/20 text-red-500 px-2 py-0.5 text-[10px] font-bold">CTO/CISO</span>
                                  </h4>
                                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                    {vulnAiInsight.executiveActionPlan}
                                  </p>
                                </div>
                                <div className="border-t border-red-500/10 pt-2.5">
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-500 px-2.5 py-0.5 text-[9px] font-bold border border-red-500/20">
                                      Total CVEs: {allVulnerabilities.length}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-500 px-2.5 py-0.5 text-[9px] font-bold border border-amber-500/20">
                                      Critical/High: {allVulnerabilities.filter(v => v.severityLevel?.toUpperCase() === "CRITICAL" || v.severityLevel?.toUpperCase() === "HIGH").length}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-500 px-2.5 py-0.5 text-[9px] font-bold border border-indigo-500/20">
                                      Vulnerable Packages: {groupedVulnerabilities.length}
                                    </span>
                                  </div>
                                  <div className="mt-3 space-y-1.5">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Vulnerability Distribution by Component</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {groupedVulnerabilities.map(g => (
                                        <span key={g.componentName} className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-foreground border border-border/40">
                                          {g.componentName} ({g.vulnerabilities.length})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between bg-gradient-to-r from-red-500/5 to-purple-500/5 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">AI Threat Analysis</p>
                          <p className="text-xs text-muted-foreground">Analyze all vulnerable packages to generate VEX triage recommendations and secure alternatives.</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white shrink-0"
                        onClick={() =>
                          analyzeVulnerabilityInsights.mutate()
                        }
                        disabled={analyzeVulnerabilityInsights.isPending}
                      >
                        {analyzeVulnerabilityInsights.isPending ? (
                          <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Analyzing...</>
                        ) : (
                          <><Sparkles className="w-3 h-3 mr-2" />Analyze</>
                        )}
                      </Button>
                    </div>
                  )}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-xl">
                      <div className="relative w-full sm:w-2/3">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search vulnerabilities by component..."
                          value={vulnSearchTerm}
                          onChange={(e) => setVulnSearchTerm(e.target.value)}
                          className="pl-9 h-9 w-full"
                        />
                      </div>
                      <div className="w-full sm:w-1/3">
                        <Select
                          value={vulnSeverityFilter}
                          onValueChange={(val) => setVulnSeverityFilter(val || "all")}
                        >
                          <SelectTrigger className="h-9 w-full bg-background border">
                            <SelectValue placeholder="All Severities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Severities</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        {group.componentName}
                                        {vulnAiInsight?.packageInsights?.some(pi => pi.packageName?.toLowerCase() === group.componentName?.toLowerCase()) && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-500 px-2 py-0.5 text-[9px] font-bold border border-red-500/20">
                                            <Sparkles className="w-2.5 h-2.5" /> AI Analysis Ready
                                          </span>
                                        )}
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
                                
                                {isExpanded && vulnAiInsight && (() => {
                                  const pkgInsight: PackageVulnerabilityInsight | undefined =
                                    vulnAiInsight.packageInsights?.find(
                                      (pi) => pi.packageName?.toLowerCase() === group.componentName?.toLowerCase()
                                    );
                                  if (!pkgInsight) return null;
                                  return (
                                    <tr className="bg-muted/5 dark:bg-muted/2 border-b">
                                      <td colSpan={6} className="px-6 py-5">
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                          <div className="bg-background rounded-lg border p-4 shadow-sm">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                              <Info className="w-4 h-4 text-indigo-500" /> Management Risk Summary
                                            </h5>
                                            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                              {pkgInsight.aiRiskSummaryForManagement}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                              {pkgInsight.fixedVersionRecommendation && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[11px] text-muted-foreground font-semibold">Recommended Fix:</span>
                                                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                                    v{pkgInsight.fixedVersionRecommendation}
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-muted-foreground font-semibold">AI VEX Recommendation:</span>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                                  pkgInsight.recommendedVexStatus === "Affected"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                    : pkgInsight.recommendedVexStatus === "Not_Affected"
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                }`}>
                                                  {pkgInsight.recommendedVexStatus}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/70 italic">(Advisory only)</span>
                                              </div>
                                            </div>
                                          </div>
                                          {pkgInsight.alternatives && pkgInsight.alternatives.length > 0 && (
                                            <div>
                                              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                <PackageOpen className="w-4 h-4 text-green-500" /> Recommended MIT / Apache Alternatives
                                              </h5>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {pkgInsight.alternatives.map((alt, i) => (
                                                  <Card key={i} className="bg-background shadow-sm border-dashed hover:border-green-500/30 transition-colors">
                                                    <CardContent className="p-4 flex flex-col gap-2">
                                                      <div className="flex justify-between items-start">
                                                        <span className="font-bold text-sm text-primary">{alt.packageName}</span>
                                                        <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                                          {alt.licenseType}
                                                        </span>
                                                      </div>
                                                      <p className="text-xs text-muted-foreground leading-relaxed">{alt.reason}</p>
                                                      {alt.popularity && (
                                                        <p className="text-[10px] text-muted-foreground/70 font-medium">📦 {alt.popularity}</p>
                                                      )}
                                                    </CardContent>
                                                  </Card>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })()}

                                {isExpanded && group.vulnerabilities.map((v) => (
                                  <tr key={`${v.componentId}-${v.externalId}`} className="bg-muted/5 dark:bg-muted/2 hover:bg-muted/10 transition-colors border-b text-muted-foreground text-xs">
                                    <td className="px-4 py-2.5 font-normal pl-12 flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-primary/40 mr-2" />
                                      <span className="text-xs">{group.componentName}</span>
                                    </td>
                                    <td className="px-4 py-2.5">{v.componentVersion}</td>
                                    <td className="px-4 py-2.5 font-medium">
                                      <div className="flex flex-col">
                                         <a
                                           href={`https://osv.dev/vulnerability/${v.externalId}`}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="text-red-500/90 hover:text-red-600 hover:underline font-semibold inline-flex items-center gap-1 group/link transition-colors"
                                         >
                                           {v.externalId}
                                           <ExternalLink className="w-3 h-3 opacity-60 group-hover/link:opacity-100 transition-opacity shrink-0" />
                                         </a>
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
                  
                  let score = 100;
                  licenseIssueComponents.forEach(comp => {
                    const isHighRisk = comp.licenseNames?.some(l => getLicenseRisk(l) === "high");
                    const isMediumRisk = comp.licenseNames?.some(l => getLicenseRisk(l) === "medium");
                    const penalty = isHighRisk ? 25 : (isMediumRisk ? 10 : 0);
                    const weight = comp.isTransitive ? 0.5 : 1.0;
                    score -= (penalty * weight);
                  });
                  score = Math.max(0, Math.min(100, Math.round(score)));
                  
                  const radius = 28;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (score / 100) * circumference;
                  const scoreColor = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
                  
                  return isComponentsLoading || isEnrichingLicenses ? (
                    renderLoadingUI()
                  ) : licenseIssueComponents.length > 0 ? (
                    <div className="space-y-4">
                      {/* AI Summary Card */}
                      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 shadow-none">
                        <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                          {/* 20% Section: Score */}
                          <div className="w-full sm:w-[20%] border-b sm:border-b-0 sm:border-r border-indigo-500/20 p-4 flex flex-col items-center justify-center gap-2 bg-background/40">
                            <div className="relative w-20 h-20">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                                <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
                                <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${scoreColor} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">License Score</span>
                          </div>
                          
                          {/* 80% Section: Content */}
                          <div className="w-full sm:w-[80%] p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                AI License Insights
                                <span className="inline-flex items-center rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold">Beta</span>
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                {score >= 80 
                                  ? "Your project's license compliance is in excellent standing. No critical legal or commercial risks were detected. Components analyzed by AI match your organizational policies."
                                  : score >= 50
                                  ? "Some copyleft or review-required licenses were detected in your project. It is advised to review the licensed packages in the table for commercial distribution or closed-source usage scenarios."
                                  : "High-risk licenses detected in your project's components! This can severely impact the commercial licensing or closed-source nature of your project. Take immediate action by reviewing alternatives."}
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground/80 font-medium">
                                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span> {licenseIssueComponents.filter(c => c.licenseNames?.some(l => getLicenseRisk(l) === "high")).length} High Risk</div>
                                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span> {licenseIssueComponents.filter(c => c.licenseNames?.some(l => getLicenseRisk(l) === "medium") && !c.licenseNames?.some(l => getLicenseRisk(l) === "high")).length} Medium Risk</div>
                                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span> {licenseIssueComponents.filter(c => c.aiInsight).length} AI Analysis Ready</div>
                              </div>
                              
                              {licenseIssueComponents.some(c => !c.aiInsight) && (
                                <div className="mt-4 flex items-center justify-between bg-background/50 border border-indigo-500/10 rounded-md p-3">
                                  <div className="text-xs text-muted-foreground">
                                    AI analysis pending for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{licenseIssueComponents.filter(c => !c.aiInsight).length} packages</span>.
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => analyzeLicenseInsights.mutate()}
                                    disabled={analyzeLicenseInsights.isPending}
                                  >
                                    {analyzeLicenseInsights.isPending ? (
                                      <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Analyzing...</>
                                    ) : (
                                      <><Sparkles className="w-3 h-3 mr-2" /> Analyze</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="rounded-md border overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm text-left">
                          <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3 font-medium w-12 text-center"></th>
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
                                <Fragment key={comp.id}>
                                <tr onClick={(e) => comp.aiInsight && toggleLicenseRow(comp.id, e)} className={`transition-colors border-b ${comp.aiInsight ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30"}`}>
                                  <td className="px-4 py-3 text-center w-12 align-middle">
                                    {comp.aiInsight ? (
                                      <button className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors mx-auto flex items-center justify-center">
                                        {expandedLicenseRows.has(comp.id) ? (
                                          <ChevronDown className="w-4 h-4 text-primary animate-in fade-in zoom-in duration-200" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-muted-foreground animate-in fade-in zoom-in duration-200" />
                                        )}
                                      </button>
                                    ) : (
                                      <span className="text-[9px] leading-tight font-semibold text-muted-foreground/60 select-none block text-center">Analysis<br/>Pending</span>
                                    )}
                                  </td>
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
                                {expandedLicenseRows.has(comp.id) && comp.aiInsight && (
                                  <tr className="bg-muted/5 dark:bg-muted/2 border-b">
                                    <td colSpan={7} className="px-6 py-5">
                                      <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="bg-background rounded-lg border p-4 shadow-sm">
                                          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                            <Info className="w-4 h-4 text-indigo-500" /> Management Risk Summary
                                          </h5>
                                          <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                            {comp.aiInsight.riskExplanationForManagement}
                                          </p>
                                        </div>
                                        <div>
                                          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            <PackageOpen className="w-4 h-4 text-green-500" /> Recommended MIT / Apache Alternatives
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(() => {
                                              try {
                                                const alts = JSON.parse(comp.aiInsight.recommendedAlternativesJson);
                                                return alts.map((alt: any, i: number) => (
                                                  <Card key={i} className="bg-background shadow-sm border-dashed">
                                                    <CardContent className="p-4 flex flex-col gap-2">
                                                      <div className="flex justify-between items-start">
                                                        <span className="font-bold text-sm text-primary">{alt.PackageName}</span>
                                                        <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">{alt.LicenseType}</span>
                                                      </div>
                                                      <p className="text-xs text-muted-foreground leading-relaxed">{alt.ReasonForRecommendation}</p>
                                                    </CardContent>
                                                  </Card>
                                                ));
                                              } catch (e) {
                                                return <div className="text-sm text-red-500">Failed to parse alternatives.</div>;
                                              }
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                </Fragment>
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
