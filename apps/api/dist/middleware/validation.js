import { z } from 'zod';
import { ValidationError } from '../lib/error-handler.js';
import { structuredLogger } from '../lib/structured-logger.js';
export class ValidationMiddleware {
    static validate(options) {
        return (req, res, next) => {
            try {
                const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
                structuredLogger.setRequestId(requestId);
                if (options.body) {
                    const bodyResult = options.body.safeParse(req.body);
                    if (!bodyResult.success) {
                        throw new ValidationError('Invalid request body', {
                            errors: bodyResult.error.errors,
                            field: 'body'
                        });
                    }
                    req.body = options.stripUnknown ? bodyResult.data : req.body;
                }
                if (options.query) {
                    const queryResult = options.query.safeParse(req.query);
                    if (!queryResult.success) {
                        throw new ValidationError('Invalid query parameters', {
                            errors: queryResult.error.errors,
                            field: 'query'
                        });
                    }
                    req.query = options.stripUnknown ? queryResult.data : req.query;
                }
                if (options.params) {
                    const paramsResult = options.params.safeParse(req.params);
                    if (!paramsResult.success) {
                        throw new ValidationError('Invalid route parameters', {
                            errors: paramsResult.error.errors,
                            field: 'params'
                        });
                    }
                    req.params = options.stripUnknown ? paramsResult.data : req.params;
                }
                if (options.headers) {
                    const headersResult = options.headers.safeParse(req.headers);
                    if (!headersResult.success) {
                        throw new ValidationError('Invalid headers', {
                            errors: headersResult.error.errors,
                            field: 'headers'
                        });
                    }
                }
                if (options.sanitize) {
                    req.body = ValidationMiddleware.sanitizeObject(req.body);
                    req.query = ValidationMiddleware.sanitizeObject(req.query);
                    req.params = ValidationMiddleware.sanitizeObject(req.params);
                }
                structuredLogger.debug('Request validation successful', {
                    requestId,
                    operation: 'validation'
                });
                next();
            }
            catch (error) {
                if (error instanceof ValidationError) {
                    structuredLogger.warn('Request validation failed', {
                        requestId: req.headers['x-request-id'],
                        operation: 'validation',
                        error: error.message
                    });
                    return res.status(400).json({
                        success: false,
                        error: {
                            message: error.message,
                            details: error.context,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
                next(error);
            }
        };
    }
    static sanitizeObject(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return ValidationMiddleware.sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => ValidationMiddleware.sanitizeObject(item));
        }
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = ValidationMiddleware.sanitizeString(key);
                sanitized[sanitizedKey] = ValidationMiddleware.sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    }
    static sanitizeString(str) {
        if (typeof str !== 'string') {
            return str;
        }
        return str
            .trim()
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/script/gi, '')
            .replace(/eval/gi, '')
            .replace(/expression/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/[\x00-\x1F\x7F]/g, '');
    }
    static schemas = {
        uuid: z.string().uuid('Invalid UUID format'),
        email: z.string().email('Invalid email format'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password must be less than 128 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
        phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
        date: z.string().datetime('Invalid date format'),
        pagination: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(10),
            sort: z.string().optional(),
            order: z.enum(['asc', 'desc']).default('asc')
        }),
        search: z.object({
            q: z.string().min(1).max(100).optional(),
            filters: z.record(z.any()).optional()
        }),
        headers: z.object({
            'x-request-id': z.string().optional(),
            'x-user-id': z.string().optional(),
            'x-organization-id': z.string().optional(),
            'authorization': z.string().optional(),
            'content-type': z.string().optional(),
            'user-agent': z.string().optional()
        }),
        apiKey: z.string().min(32, 'API key must be at least 32 characters'),
        organizationId: z.string().uuid('Invalid organization ID'),
        userId: z.string().uuid('Invalid user ID'),
        policyId: z.string().regex(/^policy_\d+_[a-z0-9]+$/, 'Invalid policy ID format'),
        deploymentId: z.string().regex(/^deploy_\d+_[a-z0-9]+$/, 'Invalid deployment ID format'),
        templateId: z.string().regex(/^[a-z_]+_policy$/, 'Invalid template ID format'),
        environment: z.enum(['development', 'staging', 'production', 'test']),
        strategy: z.enum(['blue-green', 'canary', 'rolling', 'feature-flag']),
        policyType: z.enum(['select', 'insert', 'update', 'delete', 'all']),
        validationType: z.enum(['syntax', 'semantic', 'performance', 'security', 'compliance']),
        gdprRequestType: z.enum(['export', 'erase', 'rectification', 'portability']),
        dataCategory: z.enum(['personal_info', 'financial_data', 'sepa_transactions', 'crm_data', 'audit_logs']),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        breachType: z.enum(['confidentiality', 'integrity', 'availability']),
        legalHoldType: z.enum(['litigation', 'regulatory', 'investigation', 'custom']),
        cicdProvider: z.enum(['github', 'gitlab', 'jenkins', 'azure-devops']),
        fileFormat: z.enum(['zip', 'json', 'csv', 'pdf']),
        eraseType: z.enum(['soft', 'hard', 'anonymize', 'pseudonymize'])
    };
    static common = {
        uuidParam: (paramName) => ValidationMiddleware.validate({
            params: z.object({
                [paramName]: ValidationMiddleware.schemas.uuid
            })
        }),
        pagination: ValidationMiddleware.validate({
            query: ValidationMiddleware.schemas.pagination
        }),
        search: ValidationMiddleware.validate({
            query: ValidationMiddleware.schemas.search
        }),
        headers: ValidationMiddleware.validate({
            headers: ValidationMiddleware.schemas.headers
        }),
        apiKey: ValidationMiddleware.validate({
            headers: z.object({
                'x-api-key': ValidationMiddleware.schemas.apiKey
            })
        }),
        userAuth: ValidationMiddleware.validate({
            headers: z.object({
                'x-user-id': ValidationMiddleware.schemas.userId,
                'authorization': z.string().min(1)
            })
        }),
        organization: ValidationMiddleware.validate({
            headers: z.object({
                'x-organization-id': ValidationMiddleware.schemas.organizationId
            })
        })
    };
}
//# sourceMappingURL=validation.js.map