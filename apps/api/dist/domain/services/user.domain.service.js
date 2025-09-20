export class UserDomainService {
    userRepository;
    organizationRepository;
    constructor(userRepository, organizationRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }
    async canCreateUser(email, organizationId, role) {
        try {
            const organization = await this.organizationRepository.findById(organizationId);
            if (!organization) {
                return { canCreate: false, reason: 'Organization not found' };
            }
            if (!organization.isActive()) {
                return { canCreate: false, reason: 'Organization is not active' };
            }
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                return { canCreate: false, reason: 'User with this email already exists' };
            }
            const userCount = await this.userRepository.countByOrganization(organizationId);
            const maxUsers = organization.getMaxUsers();
            if (userCount >= maxUsers) {
                return { canCreate: false, reason: 'Organization user limit reached' };
            }
            if (!organization.canAddUsers()) {
                return { canCreate: false, reason: 'Organization cannot add more users' };
            }
            return { canCreate: true };
        }
        catch (error) {
            return { canCreate: false, reason: 'Error checking user creation permissions' };
        }
    }
    async canUpdateUserRole(userId, newRole, updatedBy) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return { canUpdate: false, reason: 'User not found' };
            }
            const updater = await this.userRepository.findById(updatedBy);
            if (!updater) {
                return { canUpdate: false, reason: 'Updater not found' };
            }
            if (!updater.canManageUsers()) {
                return { canUpdate: false, reason: 'Insufficient permissions to change user role' };
            }
            if (!updater.canAccessOrganization(user.organizationId)) {
                return { canUpdate: false, reason: 'Cannot update user from different organization' };
            }
            if (user.isAdmin() && newRole !== 'admin') {
                if (!updater.isAdmin()) {
                    return { canUpdate: false, reason: 'Only admins can change admin roles' };
                }
            }
            return { canUpdate: true };
        }
        catch (error) {
            return { canUpdate: false, reason: 'Error checking role update permissions' };
        }
    }
    async canDeleteUser(userId, deletedBy) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return { canDelete: false, reason: 'User not found' };
            }
            const deleter = await this.userRepository.findById(deletedBy);
            if (!deleter) {
                return { canDelete: false, reason: 'Deleter not found' };
            }
            if (!deleter.canManageUsers()) {
                return { canDelete: false, reason: 'Insufficient permissions to delete user' };
            }
            if (!deleter.canAccessOrganization(user.organizationId)) {
                return { canDelete: false, reason: 'Cannot delete user from different organization' };
            }
            if (user.id.value === deleter.id.value) {
                return { canDelete: false, reason: 'Cannot delete your own account' };
            }
            if (user.isAdmin()) {
                if (!deleter.isAdmin()) {
                    return { canDelete: false, reason: 'Only admins can delete admin accounts' };
                }
            }
            return { canDelete: true };
        }
        catch (error) {
            return { canDelete: false, reason: 'Error checking user deletion permissions' };
        }
    }
    async isEmailUnique(email, organizationId) {
        try {
            const existingUser = await this.userRepository.findByEmail(email);
            if (!existingUser) {
                return true;
            }
            return !existingUser.canAccessOrganization(organizationId);
        }
        catch (error) {
            return false;
        }
    }
    async isEmailAvailable(email) {
        try {
            const existingUser = await this.userRepository.findByEmail(email);
            return !existingUser;
        }
        catch (error) {
            return false;
        }
    }
    async canAccessOrganization(userId, organizationId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            return user.canAccessOrganization(organizationId);
        }
        catch (error) {
            return false;
        }
    }
    async hasRole(userId, role) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            return user.hasRole(role);
        }
        catch (error) {
            return false;
        }
    }
    async hasAnyRole(userId, roles) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            return user.hasAnyRole(roles);
        }
        catch (error) {
            return false;
        }
    }
    async isUserActive(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            return user.isActive();
        }
        catch (error) {
            return false;
        }
    }
    async canUserLogin(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return { canLogin: false, reason: 'User not found' };
            }
            if (!user.isActive()) {
                return { canLogin: false, reason: 'User account is not active' };
            }
            if (!user.isEmailVerified) {
                return { canLogin: false, reason: 'Email not verified' };
            }
            return { canLogin: true };
        }
        catch (error) {
            return { canLogin: false, reason: 'Error checking login permissions' };
        }
    }
    async getOrganizationUserCount(organizationId) {
        try {
            return await this.userRepository.countByOrganization(organizationId);
        }
        catch (error) {
            return 0;
        }
    }
    async getOrganizationUserLimit(organizationId) {
        try {
            const organization = await this.organizationRepository.findById(organizationId);
            if (!organization) {
                return 0;
            }
            return organization.getMaxUsers();
        }
        catch (error) {
            return 0;
        }
    }
    async canOrganizationAddUser(organizationId) {
        try {
            const currentCount = await this.getOrganizationUserCount(organizationId);
            const limit = await this.getOrganizationUserLimit(organizationId);
            return currentCount < limit;
        }
        catch (error) {
            return false;
        }
    }
    async searchUsersInOrganization(organizationId, query) {
        try {
            return await this.userRepository.search(query, organizationId);
        }
        catch (error) {
            return [];
        }
    }
    async getUsersByRoleInOrganization(organizationId, role) {
        try {
            return await this.userRepository.findByOrganizationAndRole(organizationId, role);
        }
        catch (error) {
            return [];
        }
    }
    async getActiveUsersInOrganization(organizationId) {
        try {
            return await this.userRepository.findByOrganizationAndStatus(organizationId, 'active');
        }
        catch (error) {
            return [];
        }
    }
    async canBulkUpdateUsers(userIds, updatedBy) {
        try {
            const updater = await this.userRepository.findById(updatedBy);
            if (!updater) {
                return { canUpdate: false, reason: 'Updater not found' };
            }
            if (!updater.canManageUsers()) {
                return { canUpdate: false, reason: 'Insufficient permissions for bulk update' };
            }
            for (const userId of userIds) {
                const user = await this.userRepository.findById(userId);
                if (!user) {
                    return { canUpdate: false, reason: `User ${userId} not found` };
                }
                if (!user.canAccessOrganization(updater.organizationId)) {
                    return { canUpdate: false, reason: 'Cannot update users from different organization' };
                }
            }
            return { canUpdate: true };
        }
        catch (error) {
            return { canUpdate: false, reason: 'Error checking bulk update permissions' };
        }
    }
    async canBulkDeleteUsers(userIds, deletedBy) {
        try {
            const deleter = await this.userRepository.findById(deletedBy);
            if (!deleter) {
                return { canDelete: false, reason: 'Deleter not found' };
            }
            if (!deleter.canManageUsers()) {
                return { canDelete: false, reason: 'Insufficient permissions for bulk delete' };
            }
            if (userIds.includes(deleter.id.value)) {
                return { canDelete: false, reason: 'Cannot delete your own account' };
            }
            for (const userId of userIds) {
                const user = await this.userRepository.findById(userId);
                if (!user) {
                    return { canDelete: false, reason: `User ${userId} not found` };
                }
                if (!user.canAccessOrganization(deleter.organizationId)) {
                    return { canDelete: false, reason: 'Cannot delete users from different organization' };
                }
                if (user.isAdmin() && !deleter.isAdmin()) {
                    return { canDelete: false, reason: 'Only admins can delete admin accounts' };
                }
            }
            return { canDelete: true };
        }
        catch (error) {
            return { canDelete: false, reason: 'Error checking bulk delete permissions' };
        }
    }
}
//# sourceMappingURL=user.domain.service.js.map