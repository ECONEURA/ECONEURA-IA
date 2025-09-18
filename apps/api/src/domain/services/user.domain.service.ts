import { User } from '../entities/user.entity.js';
import { Organization } from '../entities/organization.entity.js';
import { UserRepository } from '../repositories/user.repository.js';
import { OrganizationRepository } from '../repositories/organization.repository.js';
import { Email } from '../value-objects/email.vo.js';

// ============================================================================
// USER DOMAIN SERVICE
// ============================================================================

export class UserDomainService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository
  ) {}

  // ========================================================================
  // BUSINESS RULES
  // ========================================================================

  async canCreateUser(
    email: string,
    organizationId: string,
    role: string
  ): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      // Check if organization exists and is active
      const organization = await this.organizationRepository.findById(organizationId);
      if (!organization) {
        return { canCreate: false, reason: 'Organization not found' };
      }

      if (!organization.isActive()) {
        return { canCreate: false, reason: 'Organization is not active' };
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return { canCreate: false, reason: 'User with this email already exists' };
      }

      // Check organization limits
      const userCount = await this.userRepository.countByOrganization(organizationId);
      const maxUsers = organization.getMaxUsers();

      if (userCount >= maxUsers) {
        return { canCreate: false, reason: 'Organization user limit reached' };
      }

      // Check if organization can add users
      if (!organization.canAddUsers()) {
        return { canCreate: false, reason: 'Organization cannot add more users' };
      }

      return { canCreate: true };
    } catch (error) {
      return { canCreate: false, reason: 'Error checking user creation permissions' };
    }
  }

  async canUpdateUserRole(
    userId: string,
    newRole: string,
    updatedBy: string
  ): Promise<{ canUpdate: boolean; reason?: string }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { canUpdate: false, reason: 'User not found' };
      }

      const updater = await this.userRepository.findById(updatedBy);
      if (!updater) {
        return { canUpdate: false, reason: 'Updater not found' };
      }

      // Check if updater has permission to change roles
      if (!updater.canManageUsers()) {
        return { canUpdate: false, reason: 'Insufficient permissions to change user role' };
      }

      // Check if updater is in the same organization
      if (!updater.canAccessOrganization(user.organizationId)) {
        return { canUpdate: false, reason: 'Cannot update user from different organization' };
      }

      // Check if trying to update admin role
      if (user.isAdmin() && newRole !== 'admin') {
        // Only another admin can change admin role
        if (!updater.isAdmin()) {
          return { canUpdate: false, reason: 'Only admins can change admin roles' };
        }
      }

      return { canUpdate: true };
    } catch (error) {
      return { canUpdate: false, reason: 'Error checking role update permissions' };
    }
  }

  async canDeleteUser(
    userId: string,
    deletedBy: string
  ): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { canDelete: false, reason: 'User not found' };
      }

      const deleter = await this.userRepository.findById(deletedBy);
      if (!deleter) {
        return { canDelete: false, reason: 'Deleter not found' };
      }

      // Check if deleter has permission to delete users
      if (!deleter.canManageUsers()) {
        return { canDelete: false, reason: 'Insufficient permissions to delete user' };
      }

      // Check if deleter is in the same organization
      if (!deleter.canAccessOrganization(user.organizationId)) {
        return { canDelete: false, reason: 'Cannot delete user from different organization' };
      }

      // Check if trying to delete self
      if (user.id.value === deleter.id.value) {
        return { canDelete: false, reason: 'Cannot delete your own account' };
      }

      // Check if trying to delete admin
      if (user.isAdmin()) {
        // Only another admin can delete admin
        if (!deleter.isAdmin()) {
          return { canDelete: false, reason: 'Only admins can delete admin accounts' };
        }
      }

      return { canDelete: true };
    } catch (error) {
      return { canDelete: false, reason: 'Error checking user deletion permissions' };
    }
  }

  // ========================================================================
  // EMAIL VALIDATION
  // ========================================================================

  async isEmailUnique(email: string, organizationId: string): Promise<boolean> {
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      if (!existingUser) {
        return true;
      }

      // Check if user is in the same organization
      return !existingUser.canAccessOrganization(organizationId);
    } catch (error) {
      return false;
    }
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      return !existingUser;
    } catch (error) {
      return false;
    }
  }

  // ========================================================================
  // ORGANIZATION VALIDATION
  // ========================================================================

  async canAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      return user.canAccessOrganization(organizationId);
    } catch (error) {
      return false;
    }
  }

  // ========================================================================
  // ROLE VALIDATION
  // ========================================================================

  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      return user.hasRole(role as any);
    } catch (error) {
      return false;
    }
  }

  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      return user.hasAnyRole(roles as any);
    } catch (error) {
      return false;
    }
  }

  // ========================================================================
  // USER STATUS VALIDATION
  // ========================================================================

  async isUserActive(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      return user.isActive();
    } catch (error) {
      return false;
    }
  }

  async canUserLogin(userId: string): Promise<{ canLogin: boolean; reason?: string }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { canLogin: false, reason: 'User not found' };
      }

      if (!user.isActive()) {
        return { canLogin: false, reason: 'User account is not active' };
      }

      // Check if email is verified (optional business rule)
      if (!user.isEmailVerified) {
        return { canLogin: false, reason: 'Email not verified' };
      }

      return { canLogin: true };
    } catch (error) {
      return { canLogin: false, reason: 'Error checking login permissions' };
    }
  }

  // ========================================================================
  // ORGANIZATION LIMITS
  // ========================================================================

  async getOrganizationUserCount(organizationId: string): Promise<number> {
    try {
      return await this.userRepository.countByOrganization(organizationId);
    } catch (error) {
      return 0;
    }
  }

  async getOrganizationUserLimit(organizationId: string): Promise<number> {
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      if (!organization) {
        return 0;
      }

      return organization.getMaxUsers();
    } catch (error) {
      return 0;
    }
  }

  async canOrganizationAddUser(organizationId: string): Promise<boolean> {
    try {
      const currentCount = await this.getOrganizationUserCount(organizationId);
      const limit = await this.getOrganizationUserLimit(organizationId);
      return currentCount < limit;
    } catch (error) {
      return false;
    }
  }

  // ========================================================================
  // USER SEARCH AND FILTERING
  // ========================================================================

  async searchUsersInOrganization(
    organizationId: string,
    query: string
  ): Promise<User[]> {
    try {
      return await this.userRepository.search(query, organizationId);
    } catch (error) {
      return [];
    }
  }

  async getUsersByRoleInOrganization(
    organizationId: string,
    role: string
  ): Promise<User[]> {
    try {
      return await this.userRepository.findByOrganizationAndRole(organizationId, role);
    } catch (error) {
      return [];
    }
  }

  async getActiveUsersInOrganization(organizationId: string): Promise<User[]> {
    try {
      return await this.userRepository.findByOrganizationAndStatus(organizationId, 'active');
    } catch (error) {
      return [];
    }
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async canBulkUpdateUsers(
    userIds: string[],
    updatedBy: string
  ): Promise<{ canUpdate: boolean; reason?: string }> {
    try {
      const updater = await this.userRepository.findById(updatedBy);
      if (!updater) {
        return { canUpdate: false, reason: 'Updater not found' };
      }

      if (!updater.canManageUsers()) {
        return { canUpdate: false, reason: 'Insufficient permissions for bulk update' };
      }

      // Check if all users are in the same organization
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
    } catch (error) {
      return { canUpdate: false, reason: 'Error checking bulk update permissions' };
    }
  }

  async canBulkDeleteUsers(
    userIds: string[],
    deletedBy: string
  ): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const deleter = await this.userRepository.findById(deletedBy);
      if (!deleter) {
        return { canDelete: false, reason: 'Deleter not found' };
      }

      if (!deleter.canManageUsers()) {
        return { canDelete: false, reason: 'Insufficient permissions for bulk delete' };
      }

      // Check if trying to delete self
      if (userIds.includes(deleter.id.value)) {
        return { canDelete: false, reason: 'Cannot delete your own account' };
      }

      // Check if all users are in the same organization
      for (const userId of userIds) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          return { canDelete: false, reason: `User ${userId} not found` };
        }

        if (!user.canAccessOrganization(deleter.organizationId)) {
          return { canDelete: false, reason: 'Cannot delete users from different organization' };
        }

        // Check if trying to delete admin
        if (user.isAdmin() && !deleter.isAdmin()) {
          return { canDelete: false, reason: 'Only admins can delete admin accounts' };
        }
      }

      return { canDelete: true };
    } catch (error) {
      return { canDelete: false, reason: 'Error checking bulk delete permissions' };
    }
  }
}
