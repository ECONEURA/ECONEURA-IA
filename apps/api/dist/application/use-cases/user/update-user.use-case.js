export class UpdateUserUseCase {
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
            const user = await this.userRepository.findById(request.userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            if (request.role) {
                const canUpdateRole = await this.userDomainService.canUpdateUserRole(request.userId, request.role, request.updatedBy);
                if (!canUpdateRole.canUpdate) {
                    return {
                        success: false,
                        error: canUpdateRole.reason || 'Cannot update user role'
                    };
                }
            }
            if (request.firstName || request.lastName) {
                user.updateProfile(request.firstName || user.firstName, request.lastName || user.lastName);
            }
            if (request.role) {
                user.updateRole(request.role);
            }
            if (request.status) {
                user.updateStatus(request.status);
            }
            const updatedUser = await this.userRepository.update(user);
            return {
                success: true,
                user: updatedUser
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
        if (!request.userId || request.userId.trim().length === 0) {
            errors.push('User ID is required');
        }
        if (!request.updatedBy || request.updatedBy.trim().length === 0) {
            errors.push('Updated by user ID is required');
        }
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
        if (request.role !== undefined) {
            const validRoles = ['admin', 'manager', 'editor', 'viewer'];
            if (!validRoles.includes(request.role)) {
                errors.push('Invalid role');
            }
        }
        if (request.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
            if (!validStatuses.includes(request.status)) {
                errors.push('Invalid status');
            }
        }
        if (!request.firstName && !request.lastName && !request.role && !request.status) {
            errors.push('At least one field must be provided for update');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
//# sourceMappingURL=update-user.use-case.js.map