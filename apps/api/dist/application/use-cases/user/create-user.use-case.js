import { User } from '../../../domain/entities/user.entity.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
export class CreateUserUseCase {
    userRepository;
    userDomainService;
    constructor(userRepository, userDomainService) {
        this.userRepository = userRepository;
        this.userDomainService = userDomainService;
    }
    async execute(request) {
        try {
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            const canCreate = await this.userDomainService.canCreateUser(request.email, request.organizationId, request.role);
            if (!canCreate.canCreate) {
                return {
                    success: false,
                    error: canCreate.reason || 'Cannot create user'
                };
            }
            const email = Email.create(request.email);
            const passwordHash = await this.hashPassword(request.password);
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
            const savedUser = await this.userRepository.save(user);
            return {
                success: true,
                user: savedUser
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.email || !Email.isValid(request.email)) {
            errors.push('Valid email is required');
        }
        const passwordValidation = User.validatePassword(request.password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }
        if (!request.firstName || request.firstName.trim().length < 2) {
            errors.push('First name must be at least 2 characters long');
        }
        if (!request.lastName || request.lastName.trim().length < 2) {
            errors.push('Last name must be at least 2 characters long');
        }
        const validRoles = ['admin', 'manager', 'editor', 'viewer'];
        if (!validRoles.includes(request.role)) {
            errors.push('Invalid role');
        }
        if (!request.organizationId || request.organizationId.trim().length === 0) {
            errors.push('Organization ID is required');
        }
        if (!request.createdBy || request.createdBy.trim().length === 0) {
            errors.push('Created by user ID is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async hashPassword(password) {
        return `hashed_${password}_${Date.now()}`;
    }
}
//# sourceMappingURL=create-user.use-case.js.map