import { User } from '../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
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
export declare class UpdateUserUseCase {
    private userRepository;
    private userDomainService;
    constructor(userRepository: UserRepository, userDomainService: UserDomainService);
    execute(request: UpdateUserRequest): Promise<UpdateUserResponse>;
    private validateRequest;
}
//# sourceMappingURL=update-user.use-case.d.ts.map