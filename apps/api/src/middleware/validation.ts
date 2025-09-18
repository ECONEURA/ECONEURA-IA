// Input Validation and Sanitization Middleware
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../lib/error-handler.js';
import { structuredLogger } from '../lib/structured-logger.js';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
  sanitize?: boolean;
  stripUnknown?: boolean;
}

export class ValidationMiddleware {
  static validate(options: ValidationOptions) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
        structuredLogger.setRequestId(requestId);

        // Validate body
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

        // Validate query parameters
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

        // Validate route parameters
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

        // Validate headers
        if (options.headers) {
          const headersResult = options.headers.safeParse(req.headers);
          if (!headersResult.success) {
            throw new ValidationError('Invalid headers', {
              errors: headersResult.error.errors,
              field: 'headers'
            });
          }
        }

        // Sanitize input if requested
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
      } catch (error) {
        if (error instanceof ValidationError) {
          structuredLogger.warn('Request validation failed', {
            requestId: req.headers['x-request-id'] as string,
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

  static sanitizeObject(obj: any): any {
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
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = ValidationMiddleware.sanitizeString(key);
        sanitized[sanitizedKey] = ValidationMiddleware.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  static sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .replace(/eval/gi, '') // Remove eval
      .replace(/expression/gi, '') // Remove CSS expressions
      .replace(/vbscript:/gi, '') // Remove vbscript protocol
      .replace(/data:/gi, '') // Remove data protocol
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }

  // Common validation schemas
  static readonly schemas = {
    // UUID validation
    uuid: z.string().uuid('Invalid UUID format'),
    
    // Email validation
    email: z.string().email('Invalid email format'),
    
    // Password validation
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
    // Phone number validation
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
    
    // Date validation
    date: z.string().datetime('Invalid date format'),
    
    // Pagination validation
    pagination: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).default('asc')
    }),
    
    // Search validation
    search: z.object({
      q: z.string().min(1).max(100).optional(),
      filters: z.record(z.any()).optional()
    }),
    
    // Common headers
    headers: z.object({
      'x-request-id': z.string().optional(),
      'x-user-id': z.string().optional(),
      'x-organization-id': z.string().optional(),
      'authorization': z.string().optional(),
      'content-type': z.string().optional(),
      'user-agent': z.string().optional()
    }),
    
    // API key validation
    apiKey: z.string().min(32, 'API key must be at least 32 characters'),
    
    // Organization ID validation
    organizationId: z.string().uuid('Invalid organization ID'),
    
    // User ID validation
    userId: z.string().uuid('Invalid user ID'),
    
    // Policy ID validation
    policyId: z.string().regex(/^policy_\d+_[a-z0-9]+$/, 'Invalid policy ID format'),
    
    // Deployment ID validation
    deploymentId: z.string().regex(/^deploy_\d+_[a-z0-9]+$/, 'Invalid deployment ID format'),
    
    // Template ID validation
    templateId: z.string().regex(/^[a-z_]+_policy$/, 'Invalid template ID format'),
    
    // Environment validation
    environment: z.enum(['development', 'staging', 'production', 'test']),
    
    // Strategy validation
    strategy: z.enum(['blue-green', 'canary', 'rolling', 'feature-flag']),
    
    // Policy type validation
    policyType: z.enum(['select', 'insert', 'update', 'delete', 'all']),
    
    // Validation type validation
    validationType: z.enum(['syntax', 'semantic', 'performance', 'security', 'compliance']),
    
    // GDPR request type validation
    gdprRequestType: z.enum(['export', 'erase', 'rectification', 'portability']),
    
    // Data category validation
    dataCategory: z.enum(['personal_info', 'financial_data', 'sepa_transactions', 'crm_data', 'audit_logs']),
    
    // Priority validation
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    
    // Status validation
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    
    // Severity validation
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    
    // Breach type validation
    breachType: z.enum(['confidentiality', 'integrity', 'availability']),
    
    // Legal hold type validation
    legalHoldType: z.enum(['litigation', 'regulatory', 'investigation', 'custom']),
    
    // CI/CD provider validation
    cicdProvider: z.enum(['github', 'gitlab', 'jenkins', 'azure-devops']),
    
    // File format validation
    fileFormat: z.enum(['zip', 'json', 'csv', 'pdf']),
    
    // Erase type validation
    eraseType: z.enum(['soft', 'hard', 'anonymize', 'pseudonymize'])
  };

  // Predefined validation middleware for common endpoints
  static readonly common = {
    // UUID parameter validation
    uuidParam: (paramName: string) => ValidationMiddleware.validate({
      params: z.object({
        [paramName]: ValidationMiddleware.schemas.uuid
      })
    }),
    
    // Pagination query validation
    pagination: ValidationMiddleware.validate({
      query: ValidationMiddleware.schemas.pagination
    }),
    
    // Search query validation
    search: ValidationMiddleware.validate({
      query: ValidationMiddleware.schemas.search
    }),
    
    // Common headers validation
    headers: ValidationMiddleware.validate({
      headers: ValidationMiddleware.schemas.headers
    }),
    
    // API key validation
    apiKey: ValidationMiddleware.validate({
      headers: z.object({
        'x-api-key': ValidationMiddleware.schemas.apiKey
      })
    }),
    
    // User authentication validation
    userAuth: ValidationMiddleware.validate({
      headers: z.object({
        'x-user-id': ValidationMiddleware.schemas.userId,
        'authorization': z.string().min(1)
      })
    }),
    
    // Organization validation
    organization: ValidationMiddleware.validate({
      headers: z.object({
        'x-organization-id': ValidationMiddleware.schemas.organizationId
      })
    })
  };
}
