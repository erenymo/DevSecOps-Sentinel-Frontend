import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Component, VulnerabilityAiInsight } from "../types";

export const scannerApi = {
  uploadSbom: (moduleId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post<ApiResponse<string>>(`/api/scanner/upload/${moduleId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
  },

  getComponentsByModuleId: (moduleId: string) =>
    apiClient
      .get<ApiResponse<Component[]>>(`/api/components/module/${moduleId}`)
      .then((res) => res.data),

  updateVexStatus: (data: { componentId: string; externalId: string; status: string }) =>
    apiClient
      .put<ApiResponse<boolean>>("/api/components/vex-status", data)
      .then((res) => res.data),

  getScanStatus: (moduleId: string) =>
    apiClient
      .get<ApiResponse<{ isDependenciesParsed: boolean; isVulnEnrichmentCompleted: boolean; isLicenseEnrichmentCompleted: boolean }>>(`/api/scanner/status/${moduleId}`)
      .then((res) => res.data),

  analyzeLicenseInsights: (moduleId: string) =>
    apiClient
      .post<ApiResponse<{ success: boolean; message: string }>>(`/api/insights/license/${moduleId}/analyze`)
      .then((res) => res.data),

  getVulnerabilityInsights: (moduleId: string) =>
    apiClient
      .get<ApiResponse<VulnerabilityAiInsight>>(`/api/insights/vulnerability/${moduleId}/insights`)
      .then((res) => res.data),

  analyzeVulnerabilityInsights: (moduleId: string) =>
    apiClient
      .post<ApiResponse<VulnerabilityAiInsight>>(`/api/insights/vulnerability/${moduleId}/analyze`)
      .then((res) => res.data),
};
