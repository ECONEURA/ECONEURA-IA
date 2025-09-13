import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';

// ============================================================================
// DELETE USER USE CASE
// ============================================================================

export interface DeleteUserRequest {
  userId: string;
  deletedBy: string;
}

export interface DeleteUserResponse {
  success: boolean;
  error?: string;
}

export class DeleteUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private userDomainService: UserDomainService
  ) {}

  async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    try {
      // Validate input
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check if user can be deleted
      const canDelete = await this.userDomainService.canDeleteUser(
        request.userId,
        request.deletedBy
      );

      if (!canDelete.canDelete) {
        return {
          success: false,
          error: canDelete.reason || 'Cannot delete user'
        };
      }

      // Delete user
      await this.userRepository.delete(request.userId);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateRequest(request: DeleteUserRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate user ID
    if (!request.userId || request.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    // Validate deleted by
    if (!request.deletedBy || request.deletedBy.trim().length === 0) {
      errors.push('Deleted by user ID is required');
    }

    // Check if trying to delete self
    if (request.userId === request.deletedBy) {
      errors.push('Cannot delete your own account');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
