import { User } from '../../domain/entities/user.entity.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../domain/services/user.domain.service.js';
import { CreateUserUseCase, CreateUserRequest, CreateUserResponse } from '../use-cases/user/create-user.use-case.js';
import { UpdateUserUseCase, UpdateUserRequest, UpdateUserResponse } from '../use-cases/user/update-user.use-case.js';
import { DeleteUserUseCase, DeleteUserRequest, DeleteUserResponse } from '../use-cases/user/delete-user.use-case.js';

// ============================================================================
// USER APPLICATION SERVICE
// ============================================================================

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

export class UserApplicationService {
  private createUserUseCase: CreateUserUseCase;
  private updateUserUseCase: UpdateUserUseCase;
  private deleteUserUseCase: DeleteUserUseCase;

  constructor(
    private userRepository: UserRepository,
    private userDomainService: UserDomainService
  ) {
    this.createUserUseCase = new CreateUserUseCase(userRepository, userDomainService);
    this.updateUserUseCase = new UpdateUserUseCase(userRepository, userDomainService);
    this.deleteUserUseCase = new DeleteUserUseCase(userRepository, userDomainService);
  }

  // ========================================================================
  // USER MANAGEMENT
  // ========================================================================

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.createUserUseCase.execute(request);
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    return this.updateUserUseCase.execute(request);
  }

  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    return this.deleteUserUseCase.execute(request);
  }

  // ========================================================================
  // USER QUERIES
  // ========================================================================

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      return null;
    }
  }

  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    try {
      return await this.userRepository.findByOrganizationId(organizationId);
    } catch (error) {
      return [];
    }
  }

  async searchUsers(options: UserSearchOptions): Promise<UserListResponse> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      // Build filters
      const filters: any = {};
      if (options.role) filters.role = options.role;
      if (options.status) filters.status = options.status;

      // Get paginated results
      const result = await this.userRepository.findPaginated(
        options.organizationId,
        page,
        limit,
        filters
      );

      return {
        users: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      };
    } catch (error) {
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

  // ========================================================================
  // USER STATISTICS
  // ========================================================================

  async getUserStats(organizationId: string): Promise<UserStatsResponse> {
    try {
      const users = await this.userRepository.findByOrganizationId(organizationId);
      
      const stats: UserStatsResponse = {
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
        // Count by role
        const role = user.role.value;
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;

        // Count by status
        const status = user.status.value;
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Count active/inactive
        if (user.isActive()) {
          stats.active++;
        } else {
          stats.inactive++;
        }

        // Count last login
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
    } catch (error) {
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

  // ========================================================================
  // USER VALIDATION
  // ========================================================================

  async validateUserAccess(userId: string, organizationId: string): Promise<boolean> {
    return this.userDomainService.canAccessOrganization(userId, organizationId);
  }

  async validateUserRole(userId: string, role: string): Promise<boolean> {
    return this.userDomainService.hasRole(userId, role);
  }

  async validateUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
    return this.userDomainService.hasAnyRole(userId, permissions);
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<UpdateUserRequest>,
    updatedBy: string
  ): Promise<{ success: boolean; results: UpdateUserResponse[]; error?: string }> {
    try {
      // Check if bulk update is allowed
      const canBulkUpdate = await this.userDomainService.canBulkUpdateUsers(userIds, updatedBy);
      if (!canBulkUpdate.canUpdate) {
        return {
          success: false,
          results: [],
          error: canBulkUpdate.reason
        };
      }

      const results: UpdateUserResponse[] = [];

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
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async bulkDeleteUsers(
    userIds: string[],
    deletedBy: string
  ): Promise<{ success: boolean; results: DeleteUserResponse[]; error?: string }> {
    try {
      // Check if bulk delete is allowed
      const canBulkDelete = await this.userDomainService.canBulkDeleteUsers(userIds, deletedBy);
      if (!canBulkDelete.canDelete) {
        return {
          success: false,
          results: [],
          error: canBulkDelete.reason
        };
      }

      const results: DeleteUserResponse[] = [];

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
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ========================================================================
  // ORGANIZATION LIMITS
  // ========================================================================

  async getOrganizationUserCount(organizationId: string): Promise<number> {
    return this.userDomainService.getOrganizationUserCount(organizationId);
  }

  async getOrganizationUserLimit(organizationId: string): Promise<number> {
    return this.userDomainService.getOrganizationUserLimit(organizationId);
  }

  async canOrganizationAddUser(organizationId: string): Promise<boolean> {
    return this.userDomainService.canOrganizationAddUser(organizationId);
  }

  // ========================================================================
  // USER ACTIVITY
  // ========================================================================

  async recordUserLogin(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      user.recordLogin();
      await this.userRepository.update(user);
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateUserLastActivity(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      user.recordLogin(); // Using recordLogin as it updates the timestamp
      await this.userRepository.update(user);
      return true;
    } catch (error) {
      return false;
    }
  }
}
