import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add token if exists logic here
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor wrapper to extract data generically
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Optionally automatically unwrap "response.data.data"
    // For now, we return the whole BaseResponse so callers can check `success`
    return response;
  },
  (error) => {
    // Handle global API errors (e.g. 401 Unauthorized -> clear token, redirect)
    return Promise.reject(error);
  }
);

export default apiClient;
