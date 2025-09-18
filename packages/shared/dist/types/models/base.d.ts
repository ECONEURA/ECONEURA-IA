export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TenantEntity extends BaseEntity {
    orgId: string;
}
export type Status = 'active' | 'inactive' | 'pending' | 'suspended';
export type Metadata = Record<string, unknown>;
export interface PaginationParams {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FilterParams {
    search?: string;
    filters?: Record<string, unknown>;
    dateFrom?: Date;
    dateTo?: Date;
}
//# sourceMappingURL=base.d.ts.map