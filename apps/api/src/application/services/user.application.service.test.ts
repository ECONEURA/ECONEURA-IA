import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../domain/services/user.domain.service.js';
import { User } from '../../domain/entities/user.entity.js';

import { UserApplicationService } from './user.application.service.js';

describe('UserApplicationService', () => {
  let userApplicationService: UserApplicationService;
  let mockUserRepository: vi.Mocked<UserRepository>;
  let mockUserDomainService: vi.Mocked<UserDomainService>;
  let mockUser: vi.Mocked<User>;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mocks
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByOrganizationId: vi.fn(),
      findPaginated: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as vi.Mocked<UserRepository>;

    mockUserDomainService = {
      canAccessOrganization: vi.fn(),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      canBulkUpdateUsers: vi.fn(),
      canBulkDeleteUsers: vi.fn(),
      getOrganizationUserCount: vi.fn(),
      getOrganizationUserLimit: vi.fn(),
      canOrganizationAddUser: vi.fn(),
    } as vi.Mocked<UserDomainService>;

    mockUser = {
      recordLogin: vi.fn(),
      isActive: vi.fn(),
      role: { value: 'admin' },
      status: { value: 'active' },
      lastLoginAt: new Date(),
    } as vi.Mocked<User>;

    // Create service instance
    userApplicationService = new UserApplicationService(
      mockUserRepository,
      mockUserDomainService
    );
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const request = {
        organizationId: 'org-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'admin' as const,
        createdBy: 'admin-123'
      };

      // Mock the use case execution through spying on the service method
      const createSpy = vi.spyOn(userApplicationService as any, 'createUserUseCase' as any, 'get');
      const mockUseCase = { execute: vi.fn().mockResolvedValue({ success: true, userId: 'user-123' }) };
      createSpy.mockReturnValue(mockUseCase);

      const result = await userApplicationService.createUser(request);

      expect(mockUseCase.execute).toHaveBeenCalledWith(request);
      expect(result.success).toBe(true);
    });

    it('should handle creation errors', async () => {
      const request = {
        organizationId: 'org-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'admin' as const,
        createdBy: 'admin-123'
      };

      const createSpy = vi.spyOn(userApplicationService as any, 'createUserUseCase' as any, 'get');
      const mockUseCase = { execute: vi.fn().mockResolvedValue({ success: false, error: 'Database error' }) };
      createSpy.mockReturnValue(mockUseCase);

      const result = await userApplicationService.createUser(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const request = {
        userId: 'user-123',
        firstName: 'Jane',
        updatedBy: 'admin-123'
      };

      const updateSpy = vi.spyOn(userApplicationService as any, 'updateUserUseCase' as any, 'get');
      const mockUseCase = { execute: vi.fn().mockResolvedValue({ success: true }) };
      updateSpy.mockReturnValue(mockUseCase);

      const result = await userApplicationService.updateUser(request);

      expect(mockUseCase.execute).toHaveBeenCalledWith(request);
      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      const request = {
        userId: 'user-123',
        firstName: 'Jane',
        updatedBy: 'admin-123'
      };

      const updateSpy = vi.spyOn(userApplicationService as any, 'updateUserUseCase' as any, 'get');
      const mockUseCase = { execute: vi.fn().mockResolvedValue({ success: false, error: 'Database error' }) };
      updateSpy.mockReturnValue(mockUseCase);

      const result = await userApplicationService.updateUser(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const request = {
        userId: 'user-123',
        deletedBy: 'admin-123'
      };

      const deleteSpy = vi.spyOn(userApplicationService as any, 'deleteUserUseCase' as any, 'get');
      const mockUseCase = { execute: vi.fn().mockResolvedValue({ success: true }) };
      deleteSpy.mockReturnValue(mockUseCase);

      const result = await userApplicationService.deleteUser(request);

      expect(mockUseCase.execute).toHaveBeenCalledWith(request);
      expect(result.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const request = {
        userId: 'user-123',
        deletedBy: 'admin-123'
      };

      const deleteSpy = vi.spyOn(userApplicationService as any, 'deleteUserUseCase' as any, 'get');
      const mockUseCase = { execute: vi.fn().mockResolvedValue({ success: false, error: 'Database error' }) };
      deleteSpy.mockReturnValue(mockUseCase);

      const result = await userApplicationService.deleteUser(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userApplicationService.getUserById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockRejectedValue(new Error('User not found'));

      const result = await userApplicationService.getUserById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userApplicationService.getUserByEmail(email);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const email = 'test@example.com';
      mockUserRepository.findByEmail.mockRejectedValue(new Error('User not found'));

      const result = await userApplicationService.getUserByEmail(email);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeNull();
    });
  });

  describe('getUsersByOrganization', () => {
    it('should return users when found', async () => {
      const organizationId = 'org-123';
      const users = [mockUser];
      mockUserRepository.findByOrganizationId.mockResolvedValue(users);

      const result = await userApplicationService.getUsersByOrganization(organizationId);

      expect(mockUserRepository.findByOrganizationId).toHaveBeenCalledWith(organizationId);
      expect(result).toEqual(users);
    });

    it('should return empty array when error occurs', async () => {
      const organizationId = 'org-123';
      mockUserRepository.findByOrganizationId.mockRejectedValue(new Error('Database error'));

      const result = await userApplicationService.getUsersByOrganization(organizationId);

      expect(mockUserRepository.findByOrganizationId).toHaveBeenCalledWith(organizationId);
      expect(result).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    it('should return paginated results with filters', async () => {
      const options = {
        organizationId: 'org-123',
        query: 'john',
        role: 'admin',
        status: 'active',
        page: 1,
        limit: 10,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const
      };

      const mockPaginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await userApplicationService.searchUsers(options);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(
        'org-123',
        1,
        10,
        { role: 'admin', status: 'active' }
      );
      expect(result).toEqual({
        users: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      });
    });

    it('should use default values when not provided', async () => {
      const options = {
        organizationId: 'org-123'
      };

      const mockPaginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await userApplicationService.searchUsers(options);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith('org-123', 1, 20, {});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should return empty result when error occurs', async () => {
      const options = {
        organizationId: 'org-123'
      };

      mockUserRepository.findPaginated.mockRejectedValue(new Error('Database error'));

      const result = await userApplicationService.searchUsers(options);

      expect(result).toEqual({
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    });
  });

  describe('getUserStats', () => {
    it('should return comprehensive user statistics', async () => {
      const organizationId = 'org-123';
      const users = [
        { ...mockUser, role: { value: 'admin' }, status: { value: 'active' }, isActive: vi.fn().mockReturnValue(true), lastLoginAt: new Date() },
        { ...mockUser, role: { value: 'user' }, status: { value: 'inactive' }, isActive: vi.fn().mockReturnValue(false), lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      ];

      mockUserRepository.findByOrganizationId.mockResolvedValue(users as User[]);

      const result = await userApplicationService.getUserStats(organizationId);

      expect(mockUserRepository.findByOrganizationId).toHaveBeenCalledWith(organizationId);
      expect(result.total).toBe(2);
      expect(result.byRole.admin).toBe(1);
      expect(result.byRole.user).toBe(1);
      expect(result.byStatus.active).toBe(1);
      expect(result.byStatus.inactive).toBe(1);
      expect(result.active).toBe(1);
      expect(result.inactive).toBe(1);
    });

    it('should return zero stats when error occurs', async () => {
      const organizationId = 'org-123';
      mockUserRepository.findByOrganizationId.mockRejectedValue(new Error('Database error'));

      const result = await userApplicationService.getUserStats(organizationId);

      expect(result.total).toBe(0);
      expect(result.active).toBe(0);
      expect(result.inactive).toBe(0);
    });
  });

  describe('validateUserAccess', () => {
    it('should delegate to domain service', async () => {
      const userId = 'user-123';
      const organizationId = 'org-123';

      mockUserDomainService.canAccessOrganization.mockResolvedValue(true);

      const result = await userApplicationService.validateUserAccess(userId, organizationId);

      expect(mockUserDomainService.canAccessOrganization).toHaveBeenCalledWith(userId, organizationId);
      expect(result).toBe(true);
    });
  });

  describe('validateUserRole', () => {
    it('should delegate to domain service', async () => {
      const userId = 'user-123';
      const role = 'admin';

      mockUserDomainService.hasRole.mockResolvedValue(true);

      const result = await userApplicationService.validateUserRole(userId, role);

      expect(mockUserDomainService.hasRole).toHaveBeenCalledWith(userId, role);
      expect(result).toBe(true);
    });
  });

  describe('validateUserPermissions', () => {
    it('should delegate to domain service', async () => {
      const userId = 'user-123';
      const permissions = ['read', 'write'];

      mockUserDomainService.hasAnyRole.mockResolvedValue(true);

      const result = await userApplicationService.validateUserPermissions(userId, permissions);

      expect(mockUserDomainService.hasAnyRole).toHaveBeenCalledWith(userId, permissions);
      expect(result).toBe(true);
    });
  });

  describe('bulkUpdateUsers', () => {
    it('should successfully update multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const updates = { firstName: 'Updated' };
      const updatedBy = 'admin-123';

      mockUserDomainService.canBulkUpdateUsers.mockResolvedValue({ canUpdate: true });
      vi.spyOn(userApplicationService, 'updateUser').mockResolvedValue({ success: true });

      const result = await userApplicationService.bulkUpdateUsers(userIds, updates, updatedBy);

      expect(mockUserDomainService.canBulkUpdateUsers).toHaveBeenCalledWith(userIds, updatedBy);
      expect(userApplicationService.updateUser).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should fail when bulk update not allowed', async () => {
      const userIds = ['user-1', 'user-2'];
      const updates = { firstName: 'Updated' };
      const updatedBy = 'admin-123';

      mockUserDomainService.canBulkUpdateUsers.mockResolvedValue({
        canUpdate: false,
        reason: 'Permission denied'
      });

      const result = await userApplicationService.bulkUpdateUsers(userIds, updates, updatedBy);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
      expect(result.results).toEqual([]);
    });

    it('should handle errors during bulk update', async () => {
      const userIds = ['user-1'];
      const updates = { firstName: 'Updated' };
      const updatedBy = 'admin-123';

      mockUserDomainService.canBulkUpdateUsers.mockResolvedValue({ canUpdate: true });
      vi.spyOn(userApplicationService, 'updateUser').mockRejectedValue(new Error('Update failed'));

      const result = await userApplicationService.bulkUpdateUsers(userIds, updates, updatedBy);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('bulkDeleteUsers', () => {
    it('should successfully delete multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const deletedBy = 'admin-123';

      mockUserDomainService.canBulkDeleteUsers.mockResolvedValue({ canDelete: true });
      vi.spyOn(userApplicationService, 'deleteUser').mockResolvedValue({ success: true });

      const result = await userApplicationService.bulkDeleteUsers(userIds, deletedBy);

      expect(mockUserDomainService.canBulkDeleteUsers).toHaveBeenCalledWith(userIds, deletedBy);
      expect(userApplicationService.deleteUser).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should fail when bulk delete not allowed', async () => {
      const userIds = ['user-1', 'user-2'];
      const deletedBy = 'admin-123';

      mockUserDomainService.canBulkDeleteUsers.mockResolvedValue({
        canDelete: false,
        reason: 'Permission denied'
      });

      const result = await userApplicationService.bulkDeleteUsers(userIds, deletedBy);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
      expect(result.results).toEqual([]);
    });
  });

  describe('getOrganizationUserCount', () => {
    it('should delegate to domain service', async () => {
      const organizationId = 'org-123';
      mockUserDomainService.getOrganizationUserCount.mockResolvedValue(42);

      const result = await userApplicationService.getOrganizationUserCount(organizationId);

      expect(mockUserDomainService.getOrganizationUserCount).toHaveBeenCalledWith(organizationId);
      expect(result).toBe(42);
    });
  });

  describe('getOrganizationUserLimit', () => {
    it('should delegate to domain service', async () => {
      const organizationId = 'org-123';
      mockUserDomainService.getOrganizationUserLimit.mockResolvedValue(100);

      const result = await userApplicationService.getOrganizationUserLimit(organizationId);

      expect(mockUserDomainService.getOrganizationUserLimit).toHaveBeenCalledWith(organizationId);
      expect(result).toBe(100);
    });
  });

  describe('canOrganizationAddUser', () => {
    it('should delegate to domain service', async () => {
      const organizationId = 'org-123';
      mockUserDomainService.canOrganizationAddUser.mockResolvedValue(true);

      const result = await userApplicationService.canOrganizationAddUser(organizationId);

      expect(mockUserDomainService.canOrganizationAddUser).toHaveBeenCalledWith(organizationId);
      expect(result).toBe(true);
    });
  });

  describe('recordUserLogin', () => {
    it('should record login successfully', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue();

      const result = await userApplicationService.recordUserLogin(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.recordLogin).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userApplicationService.recordUserLogin(userId);

      expect(result).toBe(false);
      expect(mockUser.recordLogin).not.toHaveBeenCalled();
    });

    it('should return false when error occurs', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userApplicationService.recordUserLogin(userId);

      expect(result).toBe(false);
    });
  });

  describe('updateUserLastActivity', () => {
    it('should update last activity successfully', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue();

      const result = await userApplicationService.updateUserLastActivity(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.recordLogin).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userApplicationService.updateUserLastActivity(userId);

      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userApplicationService.updateUserLastActivity(userId);

      expect(result).toBe(false);
    });
  });
});
