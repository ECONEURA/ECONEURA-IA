/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base interface for multi-tenant entities
 */
export interface TenantEntity extends BaseEntity {
  orgId: string;
}

/**
 * Common status types
 */
export type Status = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * Common metadata type
 */
export type Metadata = Record<string, unknown>;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  search?: string;
  filters?: Record<string, unknown>;
  dateFrom?: Date;
  dateTo?: Date;
}
