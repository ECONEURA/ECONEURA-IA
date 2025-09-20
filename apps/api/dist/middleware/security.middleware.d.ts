import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        organizationId: string;
        email: string;
        role: string;
    };
    requestId?: string;
}
export declare const securityHeadersMiddleware: any;
export declare const inputValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const suspiciousActivityMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const auditMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const createRateLimitMiddleware: (options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const ipValidationMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const tokenValidationMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const permissionMiddleware: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const responseEncryptionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const commonValidators: {
    email: any;
    password: any;
    name: any;
    phone: any;
    url: any;
    uuid: any;
    organizationId: any;
    page: any;
    limit: any;
};
export {};
//# sourceMappingURL=security.middleware.d.ts.map