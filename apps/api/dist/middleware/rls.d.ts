import { Request, Response, NextFunction } from 'express';
import { RLSContext } from '../lib/rls.js';
export interface RLSRequest extends Request {
    organizationId?: string;
    userId?: string;
    role?: string;
    permissions?: string[];
    tenantId?: string;
    rlsContext?: RLSContext;
}
export declare function rlsMiddleware(req: RLSRequest, res: Response, next: NextFunction): void;
export declare function rlsAccessControlMiddleware(resource: string, action: string): (req: RLSRequest, res: Response, next: NextFunction) => void;
export declare function rlsDataSanitizationMiddleware(table: string): (req: RLSRequest, res: Response, next: NextFunction) => void;
export declare function rlsResponseValidationMiddleware(table: string): (req: RLSRequest, res: Response, next: NextFunction) => void;
export declare function rlsCleanupMiddleware(req: RLSRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=rls.d.ts.map