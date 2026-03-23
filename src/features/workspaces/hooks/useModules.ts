import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moduleApi } from "../api/moduleApi";
import type { ModuleRequest } from "../types";

export const useModulesByWorkspace = (workspaceId: string) => {
  return useQuery({
    queryKey: ["modules", workspaceId],
    queryFn: () => moduleApi.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: ModuleRequest;
    }) => moduleApi.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => moduleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
};
