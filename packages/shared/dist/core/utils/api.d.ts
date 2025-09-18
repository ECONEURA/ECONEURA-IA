export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiResponseMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}
export interface ApiResponseMeta {
    page?: number;
    perPage?: number;
    total?: number;
    took?: number;
}
export declare function createSuccessResponse<T>(data: T, meta?: ApiResponseMeta): ApiResponse<T>;
export declare function createErrorResponse(code: string, message: string, details?: unknown): ApiResponse;
export declare function createPaginatedResponse<T>(data: T[], page: number, perPage: number, total: number, took?: number): ApiResponse<T[]>;
//# sourceMappingURL=api.d.ts.map