import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scannerApi } from "../api/scannerApi";

export const useUploadSbom = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => scannerApi.uploadSbom(moduleId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-components", moduleId] });
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
