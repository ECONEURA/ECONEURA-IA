import { Request, Response, NextFunction } from 'express';
import { UserApplicationService } from '../../application/services/user.application.service.js';
export declare class UserController {
    private userApplicationService;
    constructor(userApplicationService: UserApplicationService);
    createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserByEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUsersByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdateUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeleteUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOrganizationUserCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOrganizationUserLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
    canOrganizationAddUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    recordUserLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateUserLastActivity(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map