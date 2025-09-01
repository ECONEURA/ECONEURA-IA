import type { Organization } from '../models/org';
import type { Customer } from '../models/customer';

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Base API Response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

/**
 * API Error Response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * List Response
 */
export interface ListResponse<T> extends ApiResponse {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Organization Responses
 */
export type GetOrganizationResponse = ApiResponse<Organization>;
export type ListOrganizationsResponse = ListResponse<Organization>;

/**
 * Customer Responses
 */
export type GetCustomerResponse = ApiResponse<Customer>;
export type ListCustomersResponse = ListResponse<Customer>;

/**
 * API Key Response
 */
export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only returned on creation
  prefix: string;
  expiresAt?: Date;
  createdAt: Date;
  scopes: string[];
}

/**
 * Health Check Response
 */
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
