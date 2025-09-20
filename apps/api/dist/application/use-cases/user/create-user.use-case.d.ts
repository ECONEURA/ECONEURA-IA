import { User } from '../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
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
export declare class CreateUserUseCase {
    private userRepository;
    private userDomainService;
    constructor(userRepository: UserRepository, userDomainService: UserDomainService);
    execute(request: CreateUserRequest): Promise<CreateUserResponse>;
    private validateRequest;
    private hashPassword;
}
//# sourceMappingURL=create-user.use-case.d.ts.map