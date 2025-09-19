import { Organization } from '../entities/organization.entity.js';
export interface OrganizationRepository {
    save(organization: Organization): Promise<Organization>;
    findById(id: string): Promise<Organization | null>;
    findBySlug(slug: string): Promise<Organization | null>;
    update(organization: Organization): Promise<Organization>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Organization[]>;
    findByStatus(status: string): Promise<Organization[]>;
    findBySubscriptionTier(tier: string): Promise<Organization[]>;
    findByTrialStatus(isTrial: boolean): Promise<Organization[]>;
    search(query: string): Promise<Organization[]>;
    searchByName(name: string): Promise<Organization[]>;
    searchBySlug(slug: string): Promise<Organization[]>;
    findPaginated(page: number, limit: number, filters?: OrganizationFilters): Promise<PaginatedResult<Organization>>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
    countBySubscriptionTier(tier: string): Promise<number>;
    countByTrialStatus(isTrial: boolean): Promise<number>;
    saveMany(organizations: Organization[]): Promise<Organization[]>;
    updateMany(organizations: Organization[]): Promise<Organization[]>;
    deleteMany(ids: string[]): Promise<void>;
    withTransaction<T>(callback: (repo: OrganizationRepository) => Promise<T>): Promise<T>;
}
export interface OrganizationFilters {
    status?: string;
    subscriptionTier?: string;
    isTrial?: boolean;
    isActive?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    trialEndsAfter?: Date;
    trialEndsBefore?: Date;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export interface OrganizationSearchOptions {
    query?: string;
    status?: string;
    subscriptionTier?: string;
    isTrial?: boolean;
    sortBy?: 'name' | 'slug' | 'createdAt' | 'trialEndsAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
//# sourceMappingURL=organization.repository.d.ts.map