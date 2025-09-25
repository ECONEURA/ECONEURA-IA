import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UserRepository } from '../repositories/user.repository.js';
import { OrganizationRepository } from '../repositories/organization.repository.js';
import { User } from '../domain/entities/user.entity.js';
import { Organization } from '../domain/entities/organization.entity.js';

import { UserDomainService } from './user.domain.service.js';

// ============================================================================
// USER DOMAIN SERVICE TESTS
// ============================================================================

describe('UserDomainService', () => {
  let userDomainService: UserDomainService;
  let mockUserRepository: vi.Mocked<UserRepository>;
  let mockOrganizationRepository: vi.Mocked<OrganizationRepository>;

  // Mock entities
  let mockUser: vi.Mocked<User>;
  let mockOrganization: vi.Mocked<Organization>;
  let mockAdminUser: vi.Mocked<User>;
  let mockManagerUser: vi.Mocked<User>;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      countByOrganization: vi.fn(),
      search: vi.fn(),
      findByOrganizationAndRole: vi.fn(),
      findByOrganizationAndStatus: vi.fn(),
    } as vi.Mocked<UserRepository>;

    mockOrganizationRepository = {
      findById: vi.fn(),
    } as vi.Mocked<OrganizationRepository>;

    // Create mock entities
    mockUser = {
      id: { value: 'user-123' },
      organizationId: 'org-123',
      isActive: vi.fn().mockReturnValue(true),
      canManageUsers: vi.fn().mockReturnValue(false),
      canAccessOrganization: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(false),
      hasAnyRole: vi.fn().mockReturnValue(false),
      isAdmin: vi.fn().mockReturnValue(false),
      isEmailVerified: true,
    } as vi.Mocked<User>;

    mockAdminUser = {
      id: { value: 'admin-123' },
      organizationId: 'org-123',
      isActive: vi.fn().mockReturnValue(true),
      canManageUsers: vi.fn().mockReturnValue(true),
      canAccessOrganization: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(true),
      hasAnyRole: vi.fn().mockReturnValue(true),
      isAdmin: vi.fn().mockReturnValue(true),
      isEmailVerified: true,
    } as vi.Mocked<User>;

    mockManagerUser = {
      id: { value: 'manager-123' },
      organizationId: 'org-123',
      isActive: vi.fn().mockReturnValue(true),
      canManageUsers: vi.fn().mockReturnValue(true),
      canAccessOrganization: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(false),
      hasAnyRole: vi.fn().mockReturnValue(false),
      isAdmin: vi.fn().mockReturnValue(false),
      isEmailVerified: true,
    } as vi.Mocked<User>;

    mockOrganization = {
      id: { value: 'org-123' },
      isActive: vi.fn().mockReturnValue(true),
      getMaxUsers: vi.fn().mockReturnValue(100),
      canAddUsers: vi.fn().mockReturnValue(true),
    } as vi.Mocked<Organization>;

    userDomainService = new UserDomainService(
      mockUserRepository,
      mockOrganizationRepository
    );
  });

  describe('canCreateUser', () => {
    it('should allow user creation when all conditions are met', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.countByOrganization.mockResolvedValue(50);

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny user creation when organization does not exist', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Organization not found');
    });

    it('should deny user creation when organization is not active', async () => {
      mockOrganization.isActive.mockReturnValue(false);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Organization is not active');
    });

    it('should deny user creation when user already exists', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('User with this email already exists');
    });

    it('should deny user creation when organization user limit is reached', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.countByOrganization.mockResolvedValue(100);
      mockOrganization.getMaxUsers.mockReturnValue(100);

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Organization user limit reached');
    });

    it('should deny user creation when organization cannot add users', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.countByOrganization.mockResolvedValue(50);
      mockOrganization.canAddUsers.mockReturnValue(false);

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Organization cannot add more users');
    });

    it('should handle errors gracefully', async () => {
      mockOrganizationRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canCreateUser('test@example.com', 'org-123', 'user');

      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Error checking user creation permissions');
    });
  });

  describe('canUpdateUserRole', () => {
    it('should allow role update when all conditions are met', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(mockManagerUser); // updater
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockManagerUser.canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.canUpdateUserRole('user-123', 'manager', 'manager-123');

      expect(result.canUpdate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny role update when target user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      const result = await userDomainService.canUpdateUserRole('user-123', 'manager', 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('User not found');
    });

    it('should deny role update when updater does not exist', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(null); // updater

      const result = await userDomainService.canUpdateUserRole('user-123', 'manager', 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Updater not found');
    });

    it('should deny role update when updater lacks permissions', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(mockUser); // updater without permissions
      mockUser.canManageUsers.mockReturnValue(false);

      const result = await userDomainService.canUpdateUserRole('user-123', 'manager', 'user-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Insufficient permissions to change user role');
    });

    it('should deny role update when users are in different organizations', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(mockManagerUser); // updater
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockManagerUser.canAccessOrganization.mockReturnValue(false);

      const result = await userDomainService.canUpdateUserRole('user-123', 'manager', 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Cannot update user from different organization');
    });

    it('should deny role update when non-admin tries to change admin role', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockAdminUser) // target admin user
        .mockResolvedValueOnce(mockManagerUser); // non-admin updater
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockManagerUser.canAccessOrganization.mockReturnValue(true);
      mockAdminUser.isAdmin.mockReturnValue(true);
      mockManagerUser.isAdmin.mockReturnValue(false);

      const result = await userDomainService.canUpdateUserRole('admin-123', 'user', 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Only admins can change admin roles');
    });

    it('should allow admin to change admin role', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockAdminUser) // target admin user
        .mockResolvedValueOnce(mockAdminUser); // admin updater
      mockAdminUser.canManageUsers.mockReturnValue(true);
      mockAdminUser.canAccessOrganization.mockReturnValue(true);
      mockAdminUser.isAdmin.mockReturnValue(true);

      const result = await userDomainService.canUpdateUserRole('admin-123', 'user', 'admin-123');

      expect(result.canUpdate).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canUpdateUserRole('user-123', 'manager', 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Error checking role update permissions');
    });
  });

  describe('canDeleteUser', () => {
    it('should allow user deletion when all conditions are met', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(mockManagerUser); // deleter
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockManagerUser.canAccessOrganization.mockReturnValue(true);
      mockUser.isAdmin.mockReturnValue(false);

      const result = await userDomainService.canDeleteUser('user-123', 'manager-123');

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny user deletion when target user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      const result = await userDomainService.canDeleteUser('user-123', 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('User not found');
    });

    it('should deny user deletion when deleter does not exist', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(null); // deleter

      const result = await userDomainService.canDeleteUser('user-123', 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Deleter not found');
    });

    it('should deny user deletion when deleter lacks permissions', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(mockUser); // deleter without permissions
      mockUser.canManageUsers.mockReturnValue(false);

      const result = await userDomainService.canDeleteUser('user-123', 'user-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Insufficient permissions to delete user');
    });

    it('should deny user deletion when users are in different organizations', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockUser) // target user
        .mockResolvedValueOnce(mockManagerUser); // deleter
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockManagerUser.canAccessOrganization.mockReturnValue(false);

      const result = await userDomainService.canDeleteUser('user-123', 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Cannot delete user from different organization');
    });

    it('should deny user deletion when trying to delete self', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.canManageUsers.mockReturnValue(true);
      mockUser.canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.canDeleteUser('user-123', 'user-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Cannot delete your own account');
    });

    it('should deny user deletion when non-admin tries to delete admin', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockAdminUser) // target admin user
        .mockResolvedValueOnce(mockManagerUser); // non-admin deleter
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockManagerUser.canAccessOrganization.mockReturnValue(true);
      mockAdminUser.isAdmin.mockReturnValue(true);
      mockManagerUser.isAdmin.mockReturnValue(false);

      const result = await userDomainService.canDeleteUser('admin-123', 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Only admins can delete admin accounts');
    });

    it('should allow admin to delete admin', async () => {
      const targetAdmin = { ...mockAdminUser };
      const deleterAdmin = { ...mockAdminUser };
      targetAdmin.id = { value: 'target-admin-123' };
      deleterAdmin.id = { value: 'deleter-admin-123' };

      mockUserRepository.findById
        .mockResolvedValueOnce(targetAdmin as vi.Mocked<User>) // target admin user
        .mockResolvedValueOnce(deleterAdmin as vi.Mocked<User>); // admin deleter
      (targetAdmin as vi.Mocked<User>).isAdmin.mockReturnValue(true);
      (deleterAdmin as vi.Mocked<User>).isAdmin.mockReturnValue(true);
      (targetAdmin as vi.Mocked<User>).canManageUsers.mockReturnValue(true);
      (deleterAdmin as vi.Mocked<User>).canManageUsers.mockReturnValue(true);
      (targetAdmin as vi.Mocked<User>).canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.canDeleteUser('target-admin-123', 'deleter-admin-123');

      expect(result.canDelete).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canDeleteUser('user-123', 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Error checking user deletion permissions');
    });
  });

  describe('isEmailUnique', () => {
    it('should return true when email does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userDomainService.isEmailUnique('test@example.com', 'org-123');

      expect(result).toBe(true);
    });

    it('should return true when user exists but in different organization', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.canAccessOrganization.mockReturnValue(false);

      const result = await userDomainService.isEmailUnique('test@example.com', 'org-456');

      expect(result).toBe(true);
    });

    it('should return false when user exists in same organization', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.isEmailUnique('test@example.com', 'org-123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.isEmailUnique('test@example.com', 'org-123');

      expect(result).toBe(false);
    });
  });

  describe('isEmailAvailable', () => {
    it('should return true when email does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userDomainService.isEmailAvailable('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userDomainService.isEmailAvailable('test@example.com');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.isEmailAvailable('test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('canAccessOrganization', () => {
    it('should return true when user exists and can access organization', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.canAccessOrganization('user-123', 'org-123');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.canAccessOrganization('user-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should return false when user cannot access organization', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.canAccessOrganization.mockReturnValue(false);

      const result = await userDomainService.canAccessOrganization('user-123', 'org-456');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canAccessOrganization('user-123', 'org-123');

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user exists and has role', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.hasRole.mockReturnValue(true);

      const result = await userDomainService.hasRole('user-123', 'admin');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });

    it('should return false when user exists but does not have role', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.hasRole.mockReturnValue(false);

      const result = await userDomainService.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user exists and has any of the roles', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.hasAnyRole.mockReturnValue(true);

      const result = await userDomainService.hasAnyRole('user-123', ['admin', 'manager']);

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.hasAnyRole('user-123', ['admin', 'manager']);

      expect(result).toBe(false);
    });

    it('should return false when user exists but has none of the roles', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.hasAnyRole.mockReturnValue(false);

      const result = await userDomainService.hasAnyRole('user-123', ['admin', 'manager']);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.hasAnyRole('user-123', ['admin', 'manager']);

      expect(result).toBe(false);
    });
  });

  describe('isUserActive', () => {
    it('should return true when user exists and is active', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.isActive.mockReturnValue(true);

      const result = await userDomainService.isUserActive('user-123');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.isUserActive('user-123');

      expect(result).toBe(false);
    });

    it('should return false when user exists but is not active', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.isActive.mockReturnValue(false);

      const result = await userDomainService.isUserActive('user-123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.isUserActive('user-123');

      expect(result).toBe(false);
    });
  });

  describe('canUserLogin', () => {
    it('should allow login when user is active and email is verified', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.isActive.mockReturnValue(true);
      mockUser.isEmailVerified = true;

      const result = await userDomainService.canUserLogin('user-123');

      expect(result.canLogin).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny login when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.canUserLogin('user-123');

      expect(result.canLogin).toBe(false);
      expect(result.reason).toBe('User not found');
    });

    it('should deny login when user is not active', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.isActive.mockReturnValue(false);

      const result = await userDomainService.canUserLogin('user-123');

      expect(result.canLogin).toBe(false);
      expect(result.reason).toBe('User account is not active');
    });

    it('should deny login when email is not verified', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.isActive.mockReturnValue(true);
      mockUser.isEmailVerified = false;

      const result = await userDomainService.canUserLogin('user-123');

      expect(result.canLogin).toBe(false);
      expect(result.reason).toBe('Email not verified');
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canUserLogin('user-123');

      expect(result.canLogin).toBe(false);
      expect(result.reason).toBe('Error checking login permissions');
    });
  });

  describe('getOrganizationUserCount', () => {
    it('should return user count when successful', async () => {
      mockUserRepository.countByOrganization.mockResolvedValue(42);

      const result = await userDomainService.getOrganizationUserCount('org-123');

      expect(result).toBe(42);
    });

    it('should return 0 on error', async () => {
      mockUserRepository.countByOrganization.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.getOrganizationUserCount('org-123');

      expect(result).toBe(0);
    });
  });

  describe('getOrganizationUserLimit', () => {
    it('should return organization user limit when organization exists', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganization.getMaxUsers.mockReturnValue(100);

      const result = await userDomainService.getOrganizationUserLimit('org-123');

      expect(result).toBe(100);
    });

    it('should return 0 when organization does not exist', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      const result = await userDomainService.getOrganizationUserLimit('org-123');

      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      mockOrganizationRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.getOrganizationUserLimit('org-123');

      expect(result).toBe(0);
    });
  });

  describe('canOrganizationAddUser', () => {
    it('should return true when current count is below limit', async () => {
      mockUserRepository.countByOrganization.mockResolvedValue(50);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganization.getMaxUsers.mockReturnValue(100);

      const result = await userDomainService.canOrganizationAddUser('org-123');

      expect(result).toBe(true);
    });

    it('should return false when current count equals limit', async () => {
      mockUserRepository.countByOrganization.mockResolvedValue(100);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganization.getMaxUsers.mockReturnValue(100);

      const result = await userDomainService.canOrganizationAddUser('org-123');

      expect(result).toBe(false);
    });

    it('should return false when current count exceeds limit', async () => {
      mockUserRepository.countByOrganization.mockResolvedValue(150);
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganization.getMaxUsers.mockReturnValue(100);

      const result = await userDomainService.canOrganizationAddUser('org-123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockUserRepository.countByOrganization.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canOrganizationAddUser('org-123');

      expect(result).toBe(false);
    });
  });

  describe('searchUsersInOrganization', () => {
    it('should return users when search is successful', async () => {
      const mockUsers = [mockUser, mockAdminUser];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const result = await userDomainService.searchUsersInOrganization('org-123', 'john');

      expect(result).toEqual(mockUsers);
    });

    it('should return empty array on error', async () => {
      mockUserRepository.search.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.searchUsersInOrganization('org-123', 'john');

      expect(result).toEqual([]);
    });
  });

  describe('getUsersByRoleInOrganization', () => {
    it('should return users when query is successful', async () => {
      const mockUsers = [mockAdminUser];
      mockUserRepository.findByOrganizationAndRole.mockResolvedValue(mockUsers);

      const result = await userDomainService.getUsersByRoleInOrganization('org-123', 'admin');

      expect(result).toEqual(mockUsers);
    });

    it('should return empty array on error', async () => {
      mockUserRepository.findByOrganizationAndRole.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.getUsersByRoleInOrganization('org-123', 'admin');

      expect(result).toEqual([]);
    });
  });

  describe('getActiveUsersInOrganization', () => {
    it('should return active users when query is successful', async () => {
      const mockUsers = [mockUser, mockAdminUser];
      mockUserRepository.findByOrganizationAndStatus.mockResolvedValue(mockUsers);

      const result = await userDomainService.getActiveUsersInOrganization('org-123');

      expect(result).toEqual(mockUsers);
    });

    it('should return empty array on error', async () => {
      mockUserRepository.findByOrganizationAndStatus.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.getActiveUsersInOrganization('org-123');

      expect(result).toEqual([]);
    });
  });

  describe('canBulkUpdateUsers', () => {
    it('should allow bulk update when all conditions are met', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // updater
        .mockResolvedValueOnce(mockUser); // first user
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockUser.canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.canBulkUpdateUsers(['user-123'], 'manager-123');

      expect(result.canUpdate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny bulk update when updater does not exist', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      const result = await userDomainService.canBulkUpdateUsers(['user-123'], 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Updater not found');
    });

    it('should deny bulk update when updater lacks permissions', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser);
      mockUser.canManageUsers.mockReturnValue(false);

      const result = await userDomainService.canBulkUpdateUsers(['user-123'], 'user-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Insufficient permissions for bulk update');
    });

    it('should deny bulk update when one user does not exist', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // updater
        .mockResolvedValueOnce(null); // user not found
      mockManagerUser.canManageUsers.mockReturnValue(true);

      const result = await userDomainService.canBulkUpdateUsers(['user-999'], 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('User user-999 not found');
    });

    it('should deny bulk update when users are in different organizations', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // updater
        .mockResolvedValueOnce(mockUser); // user in different org
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockUser.canAccessOrganization.mockReturnValue(false);

      const result = await userDomainService.canBulkUpdateUsers(['user-123'], 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Cannot update users from different organization');
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canBulkUpdateUsers(['user-123'], 'manager-123');

      expect(result.canUpdate).toBe(false);
      expect(result.reason).toBe('Error checking bulk update permissions');
    });
  });

  describe('canBulkDeleteUsers', () => {
    it('should allow bulk delete when all conditions are met', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // deleter
        .mockResolvedValueOnce(mockUser); // first user
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockUser.canAccessOrganization.mockReturnValue(true);
      mockUser.isAdmin.mockReturnValue(false);

      const result = await userDomainService.canBulkDeleteUsers(['user-123'], 'manager-123');

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny bulk delete when deleter does not exist', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      const result = await userDomainService.canBulkDeleteUsers(['user-123'], 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Deleter not found');
    });

    it('should deny bulk delete when deleter lacks permissions', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser);
      mockUser.canManageUsers.mockReturnValue(false);

      const result = await userDomainService.canBulkDeleteUsers(['user-123'], 'user-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Insufficient permissions for bulk delete');
    });

    it('should deny bulk delete when trying to delete self', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUser.canManageUsers.mockReturnValue(true);
      mockUser.canAccessOrganization.mockReturnValue(true);

      const result = await userDomainService.canBulkDeleteUsers(['user-123'], 'user-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Cannot delete your own account');
    });

    it('should deny bulk delete when one user does not exist', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // deleter
        .mockResolvedValueOnce(null); // user not found
      mockManagerUser.canManageUsers.mockReturnValue(true);

      const result = await userDomainService.canBulkDeleteUsers(['user-999'], 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('User user-999 not found');
    });

    it('should deny bulk delete when users are in different organizations', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // deleter
        .mockResolvedValueOnce(mockUser); // user in different org
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockUser.canAccessOrganization.mockReturnValue(false);

      const result = await userDomainService.canBulkDeleteUsers(['user-123'], 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Cannot delete users from different organization');
    });

    it('should deny bulk delete when non-admin tries to delete admin', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockManagerUser) // deleter
        .mockResolvedValueOnce(mockAdminUser); // admin user
      mockManagerUser.canManageUsers.mockReturnValue(true);
      mockAdminUser.canAccessOrganization.mockReturnValue(true);
      mockAdminUser.isAdmin.mockReturnValue(true);
      mockManagerUser.isAdmin.mockReturnValue(false);

      const result = await userDomainService.canBulkDeleteUsers(['admin-123'], 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Only admins can delete admin accounts');
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await userDomainService.canBulkDeleteUsers(['user-123'], 'manager-123');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Error checking bulk delete permissions');
    });
  });
});
