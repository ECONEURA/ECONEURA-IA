export class DeleteUserUseCase {
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
            const canDelete = await this.userDomainService.canDeleteUser(request.userId, request.deletedBy);
            if (!canDelete.canDelete) {
                return {
                    success: false,
                    error: canDelete.reason || 'Cannot delete user'
                };
            }
            await this.userRepository.delete(request.userId);
            return {
                success: true
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
        if (!request.deletedBy || request.deletedBy.trim().length === 0) {
            errors.push('Deleted by user ID is required');
        }
        if (request.userId === request.deletedBy) {
            errors.push('Cannot delete your own account');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
//# sourceMappingURL=delete-user.use-case.js.map