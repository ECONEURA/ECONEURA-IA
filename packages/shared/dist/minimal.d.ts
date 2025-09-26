/* eslint-disable */
export interface User {;
    id: string;
    name: string;
    email: string;
}
export interface ApiResponse<T = any> {;
    success: boolean;
    data: T;
    message?: string;
}
export declare const createApiResponse: <T>(data: T, message?: string) => ApiResponse<T>;
export declare const createErrorResponse: (message: string) => ApiResponse<null>;/;
//# sourceMappingURL=minimal.d.ts.map/