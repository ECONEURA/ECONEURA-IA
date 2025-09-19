// ECONEURA Shared Package - Minimal Build
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export const createApiResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (message: string): ApiResponse<null> => ({
  success: false,
  data: null,
  message
});