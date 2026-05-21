import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scannerApi } from "../api/scannerApi";

export const useUploadSbom = (moduleId: string, onUploadSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => scannerApi.uploadSbom(moduleId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-components", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["scan-status", moduleId] });
      if (onUploadSuccess) onUploadSuccess();
    },
  });
};

export const useModuleComponents = (moduleId: string) => {
  return useQuery({
    queryKey: ["module-components", moduleId],
    queryFn: () => scannerApi.getComponentsByModuleId(moduleId),
    enabled: !!moduleId,
  });
};

export const useUpdateVexStatus = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { componentId: string; externalId: string; status: string }) =>
      scannerApi.updateVexStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-components", moduleId] });
    },
  });
};

export const useScanStatus = (moduleId: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["scan-status", moduleId],
    queryFn: () => scannerApi.getScanStatus(moduleId),
    enabled: !!moduleId,
    // Poll every 3 seconds if any enrichment is still incomplete
    refetchInterval: (query) => {
      const data = query.state?.data?.data;
      if (!data) return false; // Don't poll if API fails or hasn't returned
      
      // If there is no scan yet, don't poll
      if (!data.isDependenciesParsed) return false;

      // If there is a scan but enrichments are incomplete, poll
      if (!data.isVulnEnrichmentCompleted || !data.isLicenseEnrichmentCompleted) {
        // Also invalidate components so UI updates while it enriches
        queryClient.invalidateQueries({ queryKey: ["module-components", moduleId] });
        return 3000;
      }
      return false; // Stop polling when all done
    }
  });
};

export const useAnalyzeLicenseInsights = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scannerApi.analyzeLicenseInsights(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-components", moduleId] });
    },
  });
};
