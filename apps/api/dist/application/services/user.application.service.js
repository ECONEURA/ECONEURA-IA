import { CreateUserUseCase } from '../use-cases/user/create-user.use-case.js';
import { UpdateUserUseCase } from '../use-cases/user/update-user.use-case.js';
import { DeleteUserUseCase } from '../use-cases/user/delete-user.use-case.js';
export class UserApplicationService {
    userRepository;
    userDomainService;
    createUserUseCase;
    updateUserUseCase;
    deleteUserUseCase;
    constructor(userRepository, userDomainService) {
        this.userRepository = userRepository;
        this.userDomainService = userDomainService;
        this.createUserUseCase = new CreateUserUseCase(userRepository, userDomainService);
        this.updateUserUseCase = new UpdateUserUseCase(userRepository, userDomainService);
        this.deleteUserUseCase = new DeleteUserUseCase(userRepository, userDomainService);
    }
    async createUser(request) {
        return this.createUserUseCase.execute(request);
    }
    async updateUser(request) {
        return this.updateUserUseCase.execute(request);
    }
    async deleteUser(request) {
        return this.deleteUserUseCase.execute(request);
    }
    async getUserById(userId) {
        try {
            return await this.userRepository.findById(userId);
        }
        catch (error) {
            return null;
        }
    }
    async getUserByEmail(email) {
        try {
            return await this.userRepository.findByEmail(email);
        }
        catch (error) {
            return null;
        }
    }
    async getUsersByOrganization(organizationId) {
        try {
            return await this.userRepository.findByOrganizationId(organizationId);
        }
        catch (error) {
            return [];
        }
    }
    async searchUsers(options) {
        try {
            const page = options.page || 1;
            const limit = options.limit || 20;
            const offset = (page - 1) * limit;
            const filters = {};
            if (options.role)
                filters.role = options.role;
            if (options.status)
                filters.status = options.status;
            const result = await this.userRepository.findPaginated(options.organizationId, page, limit, filters);
            return {
                users: result.data,
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                hasNext: result.hasNext,
                hasPrevious: result.hasPrevious
            };
        }
        catch (error) {
            return {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false
            };
        }
    }
    async getUserStats(organizationId) {
        try {
            const users = await this.userRepository.findByOrganizationId(organizationId);
            const stats = {
                total: users.length,
                byRole: {},
                byStatus: {},
                active: 0,
                inactive: 0,
                lastLogin: {
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0
                }
            };
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            for (const user of users) {
                const role = user.role.value;
                stats.byRole[role] = (stats.byRole[role] || 0) + 1;
                const status = user.status.value;
                stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
                if (user.isActive()) {
                    stats.active++;
                }
                else {
                    stats.inactive++;
                }
                if (user.lastLoginAt) {
                    if (user.lastLoginAt >= today) {
                        stats.lastLogin.today++;
                    }
                    if (user.lastLoginAt >= thisWeek) {
                        stats.lastLogin.thisWeek++;
                    }
                    if (user.lastLoginAt >= thisMonth) {
                        stats.lastLogin.thisMonth++;
                    }
                }
            }
            return stats;
        }
        catch (error) {
            return {
                total: 0,
                byRole: {},
                byStatus: {},
                active: 0,
                inactive: 0,
                lastLogin: {
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0
                }
            };
        }
    }
    async validateUserAccess(userId, organizationId) {
        return this.userDomainService.canAccessOrganization(userId, organizationId);
    }
    async validateUserRole(userId, role) {
        return this.userDomainService.hasRole(userId, role);
    }
    async validateUserPermissions(userId, permissions) {
        return this.userDomainService.hasAnyRole(userId, permissions);
    }
    async bulkUpdateUsers(userIds, updates, updatedBy) {
        try {
            const canBulkUpdate = await this.userDomainService.canBulkUpdateUsers(userIds, updatedBy);
            if (!canBulkUpdate.canUpdate) {
                return {
                    success: false,
                    results: [],
                    error: canBulkUpdate.reason
                };
            }
            const results = [];
            for (const userId of userIds) {
                const result = await this.updateUser({
                    ...updates,
                    userId,
                    updatedBy
                });
                results.push(result);
            }
            const allSuccessful = results.every(result => result.success);
            return {
                success: allSuccessful,
                results
            };
        }
        catch (error) {
            return {
                success: false,
                results: [],
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async bulkDeleteUsers(userIds, deletedBy) {
        try {
            const canBulkDelete = await this.userDomainService.canBulkDeleteUsers(userIds, deletedBy);
            if (!canBulkDelete.canDelete) {
                return {
                    success: false,
                    results: [],
                    error: canBulkDelete.reason
                };
            }
            const results = [];
            for (const userId of userIds) {
                const result = await this.deleteUser({
                    userId,
                    deletedBy
                });
                results.push(result);
            }
            const allSuccessful = results.every(result => result.success);
            return {
                success: allSuccessful,
                results
            };
        }
        catch (error) {
            return {
                success: false,
                results: [],
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async getOrganizationUserCount(organizationId) {
        return this.userDomainService.getOrganizationUserCount(organizationId);
    }
    async getOrganizationUserLimit(organizationId) {
        return this.userDomainService.getOrganizationUserLimit(organizationId);
    }
    async canOrganizationAddUser(organizationId) {
        return this.userDomainService.canOrganizationAddUser(organizationId);
    }
    async recordUserLogin(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            user.recordLogin();
            await this.userRepository.update(user);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async updateUserLastActivity(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            user.recordLogin();
            await this.userRepository.update(user);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=user.application.service.js.map