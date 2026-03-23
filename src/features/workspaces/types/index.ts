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
}

export interface ModuleRequest {
  name: string;
  ecosystem: string;
  rootPath: string;
}

export interface Component {
  id: string;
  name: string;
  version: string;
  purl?: string;
  isTransitive: boolean;
  parentName?: string;
  dependencyPath?: string;
  licenseName?: string;
}
