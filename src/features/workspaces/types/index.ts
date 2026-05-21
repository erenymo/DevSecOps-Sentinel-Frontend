export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  threatScore?: number;
  licenseScore?: number;
}

export interface WorkspaceRequest {
  name: string;
  description?: string;
}

export interface Module {
  id: string;
  name: string;
  ecosystem: string;
  rootPath: string;
  workspaceId: string;
  createdAt: string;
  dependencyCount?: number;
  vulnerabilityCount?: number;
  licenseIssueCount?: number;
  lastScanDate?: string;
  threatScore?: number;
  licenseScore?: number;
}

export interface ModuleRequest {
  name: string;
  ecosystem: string;
  rootPath: string;
}

export interface ComponentVulnerability {
  externalId: string;
  vulnerabilityId?: string;
  severityType?: string;
  severityScore?: number;
  severityLevel?: string;
  status: string;
  currentVersion?: string;
  fixedVersion?: string;
}

export interface PackageLicenseInsight {
  riskExplanationForManagement: string;
  problematicUseCasesJson?: string;
  safeUseCasesJson?: string;
  recommendedAlternativesJson: string;
}

// ─── Vulnerability AI Insight types ──────────────────────────────────────────

export interface VulnerabilityAlternativePackage {
  packageName: string;
  licenseType: string;
  reason: string;
  popularity: string;
}

export interface PackageVulnerabilityInsight {
  packageName: string;
  /** Yonetimsel duzey risk ozeti, tum CVE'leri kapsayan, Turkce */
  aiRiskSummaryForManagement: string;
  /** Tavsiye edilen guvenli surumu */
  fixedVersionRecommendation: string;
  /** AI VEX tavsiyesi — sadece gorunum amacli */
  recommendedVexStatus: string;
  alternatives: VulnerabilityAlternativePackage[];
}

export interface VulnerabilityAiInsight {
  /** CTO/CISO için 2-3 cümlelik üst düzey özet (Türkçe) */
  executiveActionPlan: string;
  /** Genel sistem tehdit skoru (0-10) */
  systemCriticalityScore: number;
  packageInsights: PackageVulnerabilityInsight[];
}

export interface Component {
  id: string;
  name: string;
  version: string;
  purl?: string;
  isTransitive: boolean;
  parentName?: string;
  dependencyPath?: string;
  licenseNames?: string[];
  vulnerabilities?: ComponentVulnerability[];
  aiInsight?: PackageLicenseInsight;
}
