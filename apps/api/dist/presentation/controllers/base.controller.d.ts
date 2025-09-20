import { Request, Response, NextFunction } from 'express';
export declare abstract class BaseController {
    protected sendSuccessResponse<T>(res: Response, data: T, message?: string, statusCode?: number): void;
    protected sendListResponse<T>(res: Response, data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, message?: string): void;
    protected sendErrorResponse(res: Response, message: string, statusCode?: number, details?: any): void;
    protected sendNotFoundResponse(res: Response, resource?: string): void;
    protected sendValidationErrorResponse(res: Response, message: string, details?: any): void;
    protected sendUnauthorizedResponse(res: Response, message?: string): void;
    protected sendForbiddenResponse(res: Response, message?: string): void;
    protected sendInternalErrorResponse(res: Response, message?: string): void;
    protected getUserId(req: Request): string | undefined;
    protected getOrganizationId(req: Request): string | undefined;
    protected validateRequiredFields(data: any, requiredFields: string[]): {
        isValid: boolean;
        missingFields: string[];
    };
    protected sanitizeString(value: string): string;
    protected generatePagination(page: number, limit: number, total: number): {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    protected handleAsync<T>(fn: () => Promise<T>, res: Response, next: NextFunction): Promise<void>;
    protected validateId(id: string, fieldName?: string): void;
    protected validateOrganizationId(organizationId: string): void;
    protected validatePaginationParams(page: number, limit: number): void;
    protected transformEntityToResponse<T extends {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
    }>(entity: T): any;
    protected transformEntityListToResponse<T extends {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
    }>(entities: T[]): any[];
}
//# sourceMappingURL=base.controller.d.ts.map