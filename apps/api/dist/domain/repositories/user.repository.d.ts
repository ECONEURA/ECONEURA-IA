import { User } from '../entities/user.entity.js';
export interface UserRepository {
    save(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByOrganizationId(organizationId: string): Promise<User[]>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    findAll(): Promise<User[]>;
    findByRole(role: string): Promise<User[]>;
    findByStatus(status: string): Promise<User[]>;
    findByOrganizationAndRole(organizationId: string, role: string): Promise<User[]>;
    findByOrganizationAndStatus(organizationId: string, status: string): Promise<User[]>;
    search(query: string, organizationId: string): Promise<User[]>;
    searchByEmail(email: string, organizationId: string): Promise<User[]>;
    searchByName(name: string, organizationId: string): Promise<User[]>;
    findPaginated(organizationId: string, page: number, limit: number, filters?: UserFilters): Promise<PaginatedResult<User>>;
    countByOrganization(organizationId: string): Promise<number>;
    countByRole(role: string, organizationId: string): Promise<number>;
    countByStatus(status: string, organizationId: string): Promise<number>;
    saveMany(users: User[]): Promise<User[]>;
    updateMany(users: User[]): Promise<User[]>;
    deleteMany(ids: string[]): Promise<void>;
    withTransaction<T>(callback: (repo: UserRepository) => Promise<T>): Promise<T>;
}
export interface UserFilters {
    role?: string;
    status?: string;
    isEmailVerified?: boolean;
    mfaEnabled?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
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
export interface UserSearchOptions {
    organizationId: string;
    query?: string;
    role?: string;
    status?: string;
    sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
//# sourceMappingURL=user.repository.d.ts.map