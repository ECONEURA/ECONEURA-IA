import { User } from '../../domain/entities/user.entity.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../domain/services/user.domain.service.js';
import { CreateUserRequest, CreateUserResponse } from '../use-cases/user/create-user.use-case.js';
import { UpdateUserRequest, UpdateUserResponse } from '../use-cases/user/update-user.use-case.js';
import { DeleteUserRequest, DeleteUserResponse } from '../use-cases/user/delete-user.use-case.js';
export interface UserSearchOptions {
    organizationId: string;
    query?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
    sortOrder?: 'asc' | 'desc';
}
export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export interface UserStatsResponse {
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    active: number;
    inactive: number;
    lastLogin: {
        today: number;
        thisWeek: number;
        thisMonth: number;
    };
}
export declare class UserApplicationService {
    private userRepository;
    private userDomainService;
    private createUserUseCase;
    private updateUserUseCase;
    private deleteUserUseCase;
    constructor(userRepository: UserRepository, userDomainService: UserDomainService);
    createUser(request: CreateUserRequest): Promise<CreateUserResponse>;
    updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse>;
    deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse>;
    getUserById(userId: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getUsersByOrganization(organizationId: string): Promise<User[]>;
    searchUsers(options: UserSearchOptions): Promise<UserListResponse>;
    getUserStats(organizationId: string): Promise<UserStatsResponse>;
    validateUserAccess(userId: string, organizationId: string): Promise<boolean>;
    validateUserRole(userId: string, role: string): Promise<boolean>;
    validateUserPermissions(userId: string, permissions: string[]): Promise<boolean>;
    bulkUpdateUsers(userIds: string[], updates: Partial<UpdateUserRequest>, updatedBy: string): Promise<{
        success: boolean;
        results: UpdateUserResponse[];
        error?: string;
    }>;
    bulkDeleteUsers(userIds: string[], deletedBy: string): Promise<{
        success: boolean;
        results: DeleteUserResponse[];
        error?: string;
    }>;
    getOrganizationUserCount(organizationId: string): Promise<number>;
    getOrganizationUserLimit(organizationId: string): Promise<number>;
    canOrganizationAddUser(organizationId: string): Promise<boolean>;
    recordUserLogin(userId: string): Promise<boolean>;
    updateUserLastActivity(userId: string): Promise<boolean>;
}
//# sourceMappingURL=user.application.service.d.ts.map