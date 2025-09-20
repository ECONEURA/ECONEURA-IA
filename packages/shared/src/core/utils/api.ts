/**
 * Base response interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiResponseMeta;
}

/**
 * Error response interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Response metadata interface
 */
export interface ApiResponseMeta {
  page?: number;
  perPage?: number;
  total?: number;
  took?: number;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T, 
  meta?: ApiResponseMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number,
  took?: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      perPage,
      total,
      took
    }
  };
}
