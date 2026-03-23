import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scannerApi } from "../api/scannerApi";

export const useUploadSbom = (moduleId: string, onUploadSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => scannerApi.uploadSbom(moduleId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-components", moduleId] });
      if (onUploadSuccess) onUploadSuccess();
    },
  });
};

export const useModuleComponents = (moduleId: string, isEnriching: boolean = false) => {
  return useQuery({
    queryKey: ["module-components", moduleId],
    queryFn: () => scannerApi.getComponentsByModuleId(moduleId),
    enabled: !!moduleId,
    refetchInterval: isEnriching ? 3000 : false,
  });
};
