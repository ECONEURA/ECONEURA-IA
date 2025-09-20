import { Request, Response, NextFunction } from 'express';
import { TenantRLSContext } from '../services/rls-tenant-policies.service.js';
export interface TenantRLSRequest extends Request {
    tenantId?: string;
    organizationId?: string;
    userId?: string;
    role?: string;
    permissions?: string[];
    sessionId?: string;
    rlsContext?: TenantRLSContext;
}
export declare function tenantRLSMiddleware(req: TenantRLSRequest, res: Response, next: NextFunction): void;
export declare function tenantRLSAccessControlMiddleware(resource: string, action: string): (req: TenantRLSRequest, res: Response, next: NextFunction) => Promise<void>;
export declare function tenantRLSDataSanitizationMiddleware(table: string): (req: TenantRLSRequest, res: Response, next: NextFunction) => void;
export declare function tenantRLSResponseValidationMiddleware(table: string): (req: TenantRLSRequest, res: Response, next: NextFunction) => void;
export declare function tenantRLSCleanupMiddleware(req: TenantRLSRequest, res: Response, next: NextFunction): void;
export declare function tenantIsolationMiddleware(req: TenantRLSRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=rls-tenant.middleware.d.ts.map