import { z } from 'zod';
export declare const ErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    traceId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    method: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodNumber;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    stack: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    path?: string;
    message?: string;
    timestamp?: string;
    traceId?: string;
    method?: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    stack?: string;
}, {
    code?: string;
    path?: string;
    message?: string;
    timestamp?: string;
    traceId?: string;
    method?: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    stack?: string;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        traceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        method: z.ZodOptional<z.ZodString>;
        statusCode: z.ZodNumber;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code?: string;
        path?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        method?: string;
        statusCode?: number;
        details?: Record<string, unknown>;
        stack?: string;
    }, {
        code?: string;
        path?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        method?: string;
        statusCode?: number;
        details?: Record<string, unknown>;
        stack?: string;
    }>;
    requestId: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error?: {
        code?: string;
        path?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        method?: string;
        statusCode?: number;
        details?: Record<string, unknown>;
        stack?: string;
    };
    success?: false;
    correlationId?: string;
    requestId?: string;
}, {
    error?: {
        code?: string;
        path?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        method?: string;
        statusCode?: number;
        details?: Record<string, unknown>;
        stack?: string;
    };
    success?: false;
    correlationId?: string;
    requestId?: string;
}>;
export type Error = z.infer<typeof ErrorSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export declare const ERROR_CODES: {
    readonly AUTH_REQUIRED: "AUTH_REQUIRED";
    readonly AUTH_INVALID: "AUTH_INVALID";
    readonly AUTH_EXPIRED: "AUTH_EXPIRED";
    readonly AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly VALIDATION_REQUIRED: "VALIDATION_REQUIRED";
    readonly VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT";
    readonly VALIDATION_OUT_OF_RANGE: "VALIDATION_OUT_OF_RANGE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR";
    readonly DATABASE_QUERY_ERROR: "DATABASE_QUERY_ERROR";
    readonly DATABASE_CONSTRAINT_ERROR: "DATABASE_CONSTRAINT_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly EXTERNAL_SERVICE_TIMEOUT: "EXTERNAL_SERVICE_TIMEOUT";
    readonly EXTERNAL_SERVICE_UNAVAILABLE: "EXTERNAL_SERVICE_UNAVAILABLE";
    readonly BUSINESS_LOGIC_ERROR: "BUSINESS_LOGIC_ERROR";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS";
    readonly OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly MAINTENANCE_MODE: "MAINTENANCE_MODE";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export declare const ERROR_MESSAGES: Record<ErrorCode, string>;
export declare const ERROR_STATUS_MAPPING: Record<ErrorCode, number>;
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    readonly traceId?: string;
    constructor(code: ErrorCode, message?: string, details?: Record<string, unknown>, traceId?: string);
    toJSON(): Error;
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>, traceId?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(code?: ErrorCode, message?: string, traceId?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, traceId?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: Record<string, unknown>, traceId?: string);
}
export declare class ExternalServiceError extends AppError {
    constructor(message: string, details?: Record<string, unknown>, traceId?: string);
}
export declare class BusinessLogicError extends AppError {
    constructor(message: string, details?: Record<string, unknown>, traceId?: string);
}
export declare class ResourceNotFoundError extends AppError {
    constructor(resource: string, traceId?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, details?: Record<string, unknown>, traceId?: string);
}
export declare function generateTraceId(): string;
export declare function isAppError(error: unknown): error is AppError;
export declare function isZodError(error: unknown): error is z.ZodError;
export declare function isDatabaseError(error: unknown): boolean;
export declare function isExternalServiceError(error: unknown): boolean;
export declare function mapZodErrorToAppError(zodError: z.ZodError, traceId?: string): ValidationError;
export declare function mapDatabaseErrorToAppError(error: unknown, operation: string, traceId?: string): DatabaseError;
export declare function mapExternalServiceErrorToAppError(error: unknown, service: string, traceId?: string): ExternalServiceError;
declare const _default: {
    ErrorSchema: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        traceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        method: z.ZodOptional<z.ZodString>;
        statusCode: z.ZodNumber;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code?: string;
        path?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        method?: string;
        statusCode?: number;
        details?: Record<string, unknown>;
        stack?: string;
    }, {
        code?: string;
        path?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        method?: string;
        statusCode?: number;
        details?: Record<string, unknown>;
        stack?: string;
    }>;
    ErrorResponseSchema: z.ZodObject<{
        success: z.ZodLiteral<false>;
        error: z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            traceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
            path: z.ZodOptional<z.ZodString>;
            method: z.ZodOptional<z.ZodString>;
            statusCode: z.ZodNumber;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            stack: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code?: string;
            path?: string;
            message?: string;
            timestamp?: string;
            traceId?: string;
            method?: string;
            statusCode?: number;
            details?: Record<string, unknown>;
            stack?: string;
        }, {
            code?: string;
            path?: string;
            message?: string;
            timestamp?: string;
            traceId?: string;
            method?: string;
            statusCode?: number;
            details?: Record<string, unknown>;
            stack?: string;
        }>;
        requestId: z.ZodOptional<z.ZodString>;
        correlationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error?: {
            code?: string;
            path?: string;
            message?: string;
            timestamp?: string;
            traceId?: string;
            method?: string;
            statusCode?: number;
            details?: Record<string, unknown>;
            stack?: string;
        };
        success?: false;
        correlationId?: string;
        requestId?: string;
    }, {
        error?: {
            code?: string;
            path?: string;
            message?: string;
            timestamp?: string;
            traceId?: string;
            method?: string;
            statusCode?: number;
            details?: Record<string, unknown>;
            stack?: string;
        };
        success?: false;
        correlationId?: string;
        requestId?: string;
    }>;
    ERROR_CODES: {
        readonly AUTH_REQUIRED: "AUTH_REQUIRED";
        readonly AUTH_INVALID: "AUTH_INVALID";
        readonly AUTH_EXPIRED: "AUTH_EXPIRED";
        readonly AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS";
        readonly VALIDATION_ERROR: "VALIDATION_ERROR";
        readonly VALIDATION_REQUIRED: "VALIDATION_REQUIRED";
        readonly VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT";
        readonly VALIDATION_OUT_OF_RANGE: "VALIDATION_OUT_OF_RANGE";
        readonly DATABASE_ERROR: "DATABASE_ERROR";
        readonly DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR";
        readonly DATABASE_QUERY_ERROR: "DATABASE_QUERY_ERROR";
        readonly DATABASE_CONSTRAINT_ERROR: "DATABASE_CONSTRAINT_ERROR";
        readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
        readonly EXTERNAL_SERVICE_TIMEOUT: "EXTERNAL_SERVICE_TIMEOUT";
        readonly EXTERNAL_SERVICE_UNAVAILABLE: "EXTERNAL_SERVICE_UNAVAILABLE";
        readonly BUSINESS_LOGIC_ERROR: "BUSINESS_LOGIC_ERROR";
        readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
        readonly RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS";
        readonly OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED";
        readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
        readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
        readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
        readonly MAINTENANCE_MODE: "MAINTENANCE_MODE";
    };
    ERROR_MESSAGES: Record<ErrorCode, string>;
    ERROR_STATUS_MAPPING: Record<ErrorCode, number>;
    AppError: typeof AppError;
    ValidationError: typeof ValidationError;
    AuthenticationError: typeof AuthenticationError;
    AuthorizationError: typeof AuthorizationError;
    DatabaseError: typeof DatabaseError;
    ExternalServiceError: typeof ExternalServiceError;
    BusinessLogicError: typeof BusinessLogicError;
    ResourceNotFoundError: typeof ResourceNotFoundError;
    RateLimitError: typeof RateLimitError;
    generateTraceId: typeof generateTraceId;
    isAppError: typeof isAppError;
    isZodError: typeof isZodError;
    isDatabaseError: typeof isDatabaseError;
    isExternalServiceError: typeof isExternalServiceError;
    mapZodErrorToAppError: typeof mapZodErrorToAppError;
    mapDatabaseErrorToAppError: typeof mapDatabaseErrorToAppError;
    mapExternalServiceErrorToAppError: typeof mapExternalServiceErrorToAppError;
};
export default _default;
//# sourceMappingURL=index.d.ts.map