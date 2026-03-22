import type { TokenResponse } from "@/features/auth/types";

const TOKEN_KEY = "sentinel_token";
const REFRESH_TOKEN_KEY = "sentinel_refresh_token";
const EXPIRATION_KEY = "sentinel_expiration";

export const authStore = {
  setAuth(tokens: TokenResponse) {
    localStorage.setItem(TOKEN_KEY, tokens.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(EXPIRATION_KEY, tokens.expiration);
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRATION_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiration = localStorage.getItem(EXPIRATION_KEY);
    if (!token || !expiration) return false;
    // Token expiry check
    return new Date(expiration) > new Date();
  },
};
