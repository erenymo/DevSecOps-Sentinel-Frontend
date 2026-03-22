// Maps to Sentinel.Application.DTOs.Responses.BaseResponse<T>
export interface ApiResponse<T = any> {
  data: T | null;
  success: boolean;
  message: string | null;
  errors: string[] | null;
  timestamp: string;
}
