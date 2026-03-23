import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Workspace, WorkspaceRequest } from "../types";

export const workspaceApi = {
  getAll: () => 
    apiClient.get<ApiResponse<Workspace[]>>("/api/workspace/getAll").then(res => res.data),
  
  getById: (id: string) => 
    apiClient.get<ApiResponse<Workspace>>(`/api/workspace/${id}`).then(res => res.data),
  
  create: (data: WorkspaceRequest) => 
    apiClient.post<ApiResponse<string>>("/api/workspace/create", data).then(res => res.data),
  
  update: (id: string, data: WorkspaceRequest) => 
    apiClient.put<ApiResponse<boolean>>(`/api/workspace/${id}`, data).then(res => res.data),
  
  delete: (id: string) => 
    apiClient.delete<ApiResponse<boolean>>(`/api/workspace/${id}`).then(res => res.data),
};
