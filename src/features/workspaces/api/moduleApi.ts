import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Module, ModuleRequest } from "../types";

export const moduleApi = {
  getByWorkspace: (workspaceId: string) =>
    apiClient
      .get<ApiResponse<Module[]>>(`/api/module/getByWorkspace/${workspaceId}`)
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Module>>(`/api/module/${id}`)
      .then((res) => res.data),

  create: (workspaceId: string, data: ModuleRequest) =>
    apiClient
      .post<ApiResponse<string>>("/api/module/create", {
        workspaceId,
        module: data,
      })
      .then((res) => res.data),

  delete: (id: string) =>
    apiClient
      .delete<ApiResponse<boolean>>(`/api/module/${id}`)
      .then((res) => res.data),
};
