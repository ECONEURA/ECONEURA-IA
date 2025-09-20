import { User } from '../entities/user.entity.js';
import { UserRepository } from '../repositories/user.repository.js';
import { OrganizationRepository } from '../repositories/organization.repository.js';
export declare class UserDomainService {
    private userRepository;
    private organizationRepository;
    constructor(userRepository: UserRepository, organizationRepository: OrganizationRepository);
    canCreateUser(email: string, organizationId: string, role: string): Promise<{
        canCreate: boolean;
        reason?: string;
    }>;
    canUpdateUserRole(userId: string, newRole: string, updatedBy: string): Promise<{
        canUpdate: boolean;
        reason?: string;
    }>;
    canDeleteUser(userId: string, deletedBy: string): Promise<{
        canDelete: boolean;
        reason?: string;
    }>;
    isEmailUnique(email: string, organizationId: string): Promise<boolean>;
    isEmailAvailable(email: string): Promise<boolean>;
    canAccessOrganization(userId: string, organizationId: string): Promise<boolean>;
    hasRole(userId: string, role: string): Promise<boolean>;
    hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
    isUserActive(userId: string): Promise<boolean>;
    canUserLogin(userId: string): Promise<{
        canLogin: boolean;
        reason?: string;
    }>;
    getOrganizationUserCount(organizationId: string): Promise<number>;
    getOrganizationUserLimit(organizationId: string): Promise<number>;
    canOrganizationAddUser(organizationId: string): Promise<boolean>;
    searchUsersInOrganization(organizationId: string, query: string): Promise<User[]>;
    getUsersByRoleInOrganization(organizationId: string, role: string): Promise<User[]>;
    getActiveUsersInOrganization(organizationId: string): Promise<User[]>;
    canBulkUpdateUsers(userIds: string[], updatedBy: string): Promise<{
        canUpdate: boolean;
        reason?: string;
    }>;
    canBulkDeleteUsers(userIds: string[], deletedBy: string): Promise<{
        canDelete: boolean;
        reason?: string;
    }>;
}
//# sourceMappingURL=user.domain.service.d.ts.map