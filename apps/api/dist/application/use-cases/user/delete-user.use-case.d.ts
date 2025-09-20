import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
export interface DeleteUserRequest {
    userId: string;
    deletedBy: string;
}
export interface DeleteUserResponse {
    success: boolean;
    error?: string;
}
export declare class DeleteUserUseCase {
    private userRepository;
    private userDomainService;
    constructor(userRepository: UserRepository, userDomainService: UserDomainService);
    execute(request: DeleteUserRequest): Promise<DeleteUserResponse>;
    private validateRequest;
}
//# sourceMappingURL=delete-user.use-case.d.ts.map