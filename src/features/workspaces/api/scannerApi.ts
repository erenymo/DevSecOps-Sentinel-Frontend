import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Component } from "../types";

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
};
