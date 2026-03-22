import type { ApiResponse } from "@/types/api";
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokenResponse,
} from "@/features/auth/types";
import apiClient from "@/lib/axios";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<TokenResponse>>("/api/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<string>>("/api/auth/register", data),

  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<ApiResponse<TokenResponse>>("/api/auth/refresh-token", data),
};
