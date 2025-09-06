import { User } from '../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';

// ============================================================================
// UPDATE USER USE CASE
// ============================================================================

export interface UpdateUserRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'manager' | 'editor' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  updatedBy: string;
}

export interface UpdateUserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export class UpdateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private userDomainService: UserDomainService
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      // Validate input
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Find user
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if user can be updated
      if (request.role) {
        const canUpdateRole = await this.userDomainService.canUpdateUserRole(
          request.userId,
          request.role,
          request.updatedBy
        );

        if (!canUpdateRole.canUpdate) {
          return {
            success: false,
            error: canUpdateRole.reason || 'Cannot update user role'
          };
        }
      }

      // Update user
      if (request.firstName || request.lastName) {
        user.updateProfile(
          request.firstName || user.firstName,
          request.lastName || user.lastName
        );
      }

      if (request.role) {
        user.updateRole({ value: request.role });
      }

      if (request.status) {
        user.updateStatus({ value: request.status });
      }

      // Save updated user
      const updatedUser = await this.userRepository.update(user);

      return {
        success: true,
        user: updatedUser
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateRequest(request: UpdateUserRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate user ID
    if (!request.userId || request.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    // Validate updated by
    if (!request.updatedBy || request.updatedBy.trim().length === 0) {
      errors.push('Updated by user ID is required');
    }

    // Validate name if provided
    if (request.firstName !== undefined) {
      if (!request.firstName || request.firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters long');
      }
    }

    if (request.lastName !== undefined) {
      if (!request.lastName || request.lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters long');
      }
    }

    // Validate role if provided
    if (request.role !== undefined) {
      const validRoles = ['admin', 'manager', 'editor', 'viewer'];
      if (!validRoles.includes(request.role)) {
        errors.push('Invalid role');
      }
    }

    // Validate status if provided
    if (request.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
      if (!validStatuses.includes(request.status)) {
        errors.push('Invalid status');
      }
    }

    // Check if at least one field is being updated
    if (!request.firstName && !request.lastName && !request.role && !request.status) {
      errors.push('At least one field must be provided for update');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
