import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/api/authApi";
import { authStore } from "@/features/auth/store/authStore";
import type { LoginRequest } from "@/features/auth/types";

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      const body = response.data;
      if (body.success && body.data) {
        authStore.setAuth(body.data);
        navigate("/dashboard");
      }
    },
  });
}
