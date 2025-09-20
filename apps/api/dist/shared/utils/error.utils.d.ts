export declare enum ErrorType {
    VALIDATION = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND_ERROR",
    CONFLICT = "CONFLICT_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED_ERROR",
    FORBIDDEN = "FORBIDDEN_ERROR",
    INTERNAL = "INTERNAL_ERROR",
    EXTERNAL = "EXTERNAL_ERROR",
    TIMEOUT = "TIMEOUT_ERROR",
    RATE_LIMIT = "RATE_LIMIT_ERROR",
    BUSINESS = "BUSINESS_ERROR"
}
export declare enum ErrorCode {
    INVALID_INPUT = 1001,
    MISSING_REQUIRED_FIELD = 1002,
    INVALID_FORMAT = 1003,
    INVALID_RANGE = 1004,
    INVALID_ENUM = 1005,
    ENTITY_NOT_FOUND = 2001,
    USER_NOT_FOUND = 2002,
    ORGANIZATION_NOT_FOUND = 2003,
    COMPANY_NOT_FOUND = 2004,
    CONTACT_NOT_FOUND = 2005,
    DUPLICATE_ENTITY = 3001,
    DUPLICATE_EMAIL = 3002,
    DUPLICATE_NAME = 3003,
    DUPLICATE_SLUG = 3004,
    UNAUTHORIZED_ACCESS = 4001,
    INVALID_TOKEN = 4002,
    EXPIRED_TOKEN = 4003,
    INSUFFICIENT_PERMISSIONS = 4004,
    BUSINESS_RULE_VIOLATION = 5001,
    QUOTA_EXCEEDED = 5002,
    INVALID_OPERATION = 5003,
    DEPENDENCY_CONFLICT = 5004,
    EXTERNAL_API_ERROR = 6001,
    DATABASE_ERROR = 6002,
    CACHE_ERROR = 6003,
    EMAIL_SERVICE_ERROR = 6004,
    INTERNAL_SERVER_ERROR = 7001,
    SERVICE_UNAVAILABLE = 7002,
    TIMEOUT_ERROR = 7003,
    RATE_LIMIT_EXCEEDED = 7004
}
export interface BaseError {
    type: ErrorType;
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: Date;
    requestId?: string;
    userId?: string;
    organizationId?: string;
}
export interface ValidationError extends BaseError {
    type: ErrorType.VALIDATION;
    field?: string;
    value?: any;
    errors?: string[];
}
export interface NotFoundError extends BaseError {
    type: ErrorType.NOT_FOUND;
    entity: string;
    id?: string;
}
export interface ConflictError extends BaseError {
    type: ErrorType.CONFLICT;
    entity: string;
    field?: string;
    value?: any;
}
export interface BusinessError extends BaseError {
    type: ErrorType.BUSINESS;
    rule: string;
    context?: any;
}
export interface ExternalError extends BaseError {
    type: ErrorType.EXTERNAL;
    service: string;
    endpoint?: string;
    statusCode?: number;
}
export declare class AppError extends Error {
    readonly type: ErrorType;
    readonly code: ErrorCode;
    readonly details?: any;
    readonly timestamp: Date;
    readonly requestId?: string;
    readonly userId?: string;
    readonly organizationId?: string;
    constructor(type: ErrorType, code: ErrorCode, message: string, details?: any, requestId?: string, userId?: string, organizationId?: string);
}
export declare class ValidationAppError extends AppError {
    readonly field?: string;
    readonly value?: any;
    readonly errors?: string[];
    constructor(message: string, field?: string, value?: any, errors?: string[], requestId?: string, userId?: string, organizationId?: string);
}
export declare class NotFoundAppError extends AppError {
    readonly entity: string;
    readonly id?: string;
    constructor(entity: string, id?: string, requestId?: string, userId?: string, organizationId?: string);
}
export declare class ConflictAppError extends AppError {
    readonly entity: string;
    readonly field?: string;
    readonly value?: any;
    constructor(entity: string, message: string, field?: string, value?: any, requestId?: string, userId?: string, organizationId?: string);
}
export declare class BusinessAppError extends AppError {
    readonly rule: string;
    readonly context?: any;
    constructor(rule: string, message: string, context?: any, requestId?: string, userId?: string, organizationId?: string);
}
export declare class ExternalAppError extends AppError {
    readonly service: string;
    readonly endpoint?: string;
    readonly statusCode?: number;
    constructor(service: string, message: string, endpoint?: string, statusCode?: number, requestId?: string, userId?: string, organizationId?: string);
}
export declare const createValidationError: (message: string, field?: string, value?: any, errors?: string[], requestId?: string, userId?: string, organizationId?: string) => ValidationAppError;
export declare const createNotFoundError: (entity: string, id?: string, requestId?: string, userId?: string, organizationId?: string) => NotFoundAppError;
export declare const createConflictError: (entity: string, message: string, field?: string, value?: any, requestId?: string, userId?: string, organizationId?: string) => ConflictAppError;
export declare const createBusinessError: (rule: string, message: string, context?: any, requestId?: string, userId?: string, organizationId?: string) => BusinessAppError;
export declare const createExternalError: (service: string, message: string, endpoint?: string, statusCode?: number, requestId?: string, userId?: string, organizationId?: string) => ExternalAppError;
export declare const isAppError: (error: any) => error is AppError;
export declare const isValidationError: (error: any) => error is ValidationAppError;
export declare const isNotFoundError: (error: any) => error is NotFoundAppError;
export declare const isConflictError: (error: any) => error is ConflictAppError;
export declare const isBusinessError: (error: any) => error is BusinessAppError;
export declare const isExternalError: (error: any) => error is ExternalAppError;
export declare const getErrorType: (error: any) => ErrorType;
export declare const getErrorCode: (error: any) => ErrorCode;
export declare const getErrorMessage: (error: any) => string;
export declare const getErrorDetails: (error: any) => any;
export declare const logError: (error: any, context?: any) => void;
export interface ErrorResponse {
    success: false;
    error: {
        type: ErrorType;
        code: ErrorCode;
        message: string;
        details?: any;
        timestamp: string;
        requestId?: string;
    };
}
export declare const createErrorResponse: (error: any, requestId?: string) => ErrorResponse;
export declare const isRecoverableError: (error: any) => boolean;
export declare const getRetryDelay: (error: any, attempt: number) => number;
export declare const aggregateErrors: (errors: any[]) => AppError;
export declare const addErrorContext: (error: any, context: any) => AppError;
export declare const addRequestContext: (error: any, requestId: string, userId?: string, organizationId?: string) => AppError;
//# sourceMappingURL=error.utils.d.ts.map