export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
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
}
