import type { Organization } from '../models/org.js';
import type { Customer } from '../models/customer.js';
export interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
}
export interface ListResponse<T> extends ApiResponse {
    data: T[];
    meta: PaginationMeta;
}
export type GetOrganizationResponse = ApiResponse<Organization>;
export type ListOrganizationsResponse = ListResponse<Organization>;
export type GetCustomerResponse = ApiResponse<Customer>;
export type ListCustomersResponse = ListResponse<Customer>;
export interface ApiKeyResponse {
    id: string;
    name: string;
    key: string;
    prefix: string;
    expiresAt?: Date;
    createdAt: Date;
    scopes: string[];
}
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    checks: {
        [key: string]: {
            status: 'up' | 'down';
            latency?: number;
            message?: string;
            lastChecked: Date;
        };
    };
}
//# sourceMappingURL=responses.d.ts.map