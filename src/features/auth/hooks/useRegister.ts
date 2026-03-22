import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/authApi";
import type { RegisterRequest } from "@/features/auth/types";

export function useRegister(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      if (response.data.success) {
        onSuccess?.();
      }
    },
  });
}
