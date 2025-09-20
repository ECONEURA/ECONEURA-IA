import type { Request, Response, NextFunction } from 'express';
interface TokenPayload {
    userId: string;
    orgId: string;
    roles: string[];
}
declare class AuthService {
    private prisma;
    constructor(prisma: any);
    validateToken(token: string): Promise<TokenPayload>;
    validatePermissions(userId: string, resource: string, action: string): Promise<boolean>;
    setTenantContext(orgId: string): Promise<void>;
    clearTenantContext(): Promise<void>;
}
export declare const authenticate: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const authorize: (resource: string, action: string) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const prismaAuth: AuthService;
export {};
//# sourceMappingURL=auth.d.ts.map