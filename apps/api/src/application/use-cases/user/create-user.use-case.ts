import { User } from '../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { Email } from '../../../domain/value-objects/email.vo.js';

// ============================================================================
// CREATE USER USE CASE
// ============================================================================

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  organizationId: string;
  createdBy: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private userDomainService: UserDomainService
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      // Validate input
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check if user can be created
      const canCreate = await this.userDomainService.canCreateUser(
        request.email,
        request.organizationId,
        request.role
      );

      if (!canCreate.canCreate) {
        return {
          success: false,
          error: canCreate.reason || 'Cannot create user'
        };
      }

      // Create email value object
      const email = Email.create(request.email);

      // Hash password (in real implementation, use proper password hashing)
      const passwordHash = await this.hashPassword(request.password);

      // Create user entity
      const user = User.create({
        organizationId: request.organizationId,
        email,
        passwordHash: passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        role: request.role,
        status: 'active',
        isEmailVerified: false,
        mfaEnabled: false
      });

      // Save user
      const savedUser = await this.userRepository.save(user);

      return {
        success: true,
        user: savedUser
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateRequest(request: CreateUserRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate email
    if (!request.email || !Email.isValid(request.email)) {
      errors.push('Valid email is required');
    }

    // Validate password
    const passwordValidation = User.validatePassword(request.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Validate name
    if (!request.firstName || request.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!request.lastName || request.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'editor', 'viewer'];
    if (!validRoles.includes(request.role)) {
      errors.push('Invalid role');
    }

    // Validate organization ID
    if (!request.organizationId || request.organizationId.trim().length === 0) {
      errors.push('Organization ID is required');
    }

    // Validate created by
    if (!request.createdBy || request.createdBy.trim().length === 0) {
      errors.push('Created by user ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async hashPassword(password: string): Promise<string> {
    // In real implementation, use bcrypt or similar
    // For now, return a mock hash
    return `hashed_${password}_${Date.now()}`;
  }
}
