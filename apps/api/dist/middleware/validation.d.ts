import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export interface ValidationOptions {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
    headers?: ZodSchema;
    sanitize?: boolean;
    stripUnknown?: boolean;
}
export declare class ValidationMiddleware {
    static validate(options: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    static sanitizeObject(obj: any): any;
    static sanitizeString(str: string): string;
    static readonly schemas: {
        uuid: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodString;
        date: z.ZodString;
        pagination: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        }, "strip", z.ZodTypeAny, {
            sort?: string;
            page?: number;
            limit?: number;
            order?: "asc" | "desc";
        }, {
            sort?: string;
            page?: number;
            limit?: number;
            order?: "asc" | "desc";
        }>;
        search: z.ZodObject<{
            q: z.ZodOptional<z.ZodString>;
            filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            q?: string;
            filters?: Record<string, any>;
        }, {
            q?: string;
            filters?: Record<string, any>;
        }>;
        headers: z.ZodObject<{
            'x-request-id': z.ZodOptional<z.ZodString>;
            'x-user-id': z.ZodOptional<z.ZodString>;
            'x-organization-id': z.ZodOptional<z.ZodString>;
            authorization: z.ZodOptional<z.ZodString>;
            'content-type': z.ZodOptional<z.ZodString>;
            'user-agent': z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            'x-request-id'?: string;
            'x-user-id'?: string;
            'x-organization-id'?: string;
            authorization?: string;
            'content-type'?: string;
            'user-agent'?: string;
        }, {
            'x-request-id'?: string;
            'x-user-id'?: string;
            'x-organization-id'?: string;
            authorization?: string;
            'content-type'?: string;
            'user-agent'?: string;
        }>;
        apiKey: z.ZodString;
        organizationId: z.ZodString;
        userId: z.ZodString;
        policyId: z.ZodString;
        deploymentId: z.ZodString;
        templateId: z.ZodString;
        environment: z.ZodEnum<["development", "staging", "production", "test"]>;
        strategy: z.ZodEnum<["blue-green", "canary", "rolling", "feature-flag"]>;
        policyType: z.ZodEnum<["select", "insert", "update", "delete", "all"]>;
        validationType: z.ZodEnum<["syntax", "semantic", "performance", "security", "compliance"]>;
        gdprRequestType: z.ZodEnum<["export", "erase", "rectification", "portability"]>;
        dataCategory: z.ZodEnum<["personal_info", "financial_data", "sepa_transactions", "crm_data", "audit_logs"]>;
        priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
        status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        breachType: z.ZodEnum<["confidentiality", "integrity", "availability"]>;
        legalHoldType: z.ZodEnum<["litigation", "regulatory", "investigation", "custom"]>;
        cicdProvider: z.ZodEnum<["github", "gitlab", "jenkins", "azure-devops"]>;
        fileFormat: z.ZodEnum<["zip", "json", "csv", "pdf"]>;
        eraseType: z.ZodEnum<["soft", "hard", "anonymize", "pseudonymize"]>;
    };
    static readonly common: {
        uuidParam: (paramName: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        pagination: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        search: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        headers: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        apiKey: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        userAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
        organization: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    };
}
//# sourceMappingURL=validation.d.ts.map