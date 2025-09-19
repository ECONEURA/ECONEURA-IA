export var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION_ERROR";
    ErrorType["NOT_FOUND"] = "NOT_FOUND_ERROR";
    ErrorType["CONFLICT"] = "CONFLICT_ERROR";
    ErrorType["UNAUTHORIZED"] = "UNAUTHORIZED_ERROR";
    ErrorType["FORBIDDEN"] = "FORBIDDEN_ERROR";
    ErrorType["INTERNAL"] = "INTERNAL_ERROR";
    ErrorType["EXTERNAL"] = "EXTERNAL_ERROR";
    ErrorType["TIMEOUT"] = "TIMEOUT_ERROR";
    ErrorType["RATE_LIMIT"] = "RATE_LIMIT_ERROR";
    ErrorType["BUSINESS"] = "BUSINESS_ERROR";
})(ErrorType || (ErrorType = {}));
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["INVALID_INPUT"] = 1001] = "INVALID_INPUT";
    ErrorCode[ErrorCode["MISSING_REQUIRED_FIELD"] = 1002] = "MISSING_REQUIRED_FIELD";
    ErrorCode[ErrorCode["INVALID_FORMAT"] = 1003] = "INVALID_FORMAT";
    ErrorCode[ErrorCode["INVALID_RANGE"] = 1004] = "INVALID_RANGE";
    ErrorCode[ErrorCode["INVALID_ENUM"] = 1005] = "INVALID_ENUM";
    ErrorCode[ErrorCode["ENTITY_NOT_FOUND"] = 2001] = "ENTITY_NOT_FOUND";
    ErrorCode[ErrorCode["USER_NOT_FOUND"] = 2002] = "USER_NOT_FOUND";
    ErrorCode[ErrorCode["ORGANIZATION_NOT_FOUND"] = 2003] = "ORGANIZATION_NOT_FOUND";
    ErrorCode[ErrorCode["COMPANY_NOT_FOUND"] = 2004] = "COMPANY_NOT_FOUND";
    ErrorCode[ErrorCode["CONTACT_NOT_FOUND"] = 2005] = "CONTACT_NOT_FOUND";
    ErrorCode[ErrorCode["DUPLICATE_ENTITY"] = 3001] = "DUPLICATE_ENTITY";
    ErrorCode[ErrorCode["DUPLICATE_EMAIL"] = 3002] = "DUPLICATE_EMAIL";
    ErrorCode[ErrorCode["DUPLICATE_NAME"] = 3003] = "DUPLICATE_NAME";
    ErrorCode[ErrorCode["DUPLICATE_SLUG"] = 3004] = "DUPLICATE_SLUG";
    ErrorCode[ErrorCode["UNAUTHORIZED_ACCESS"] = 4001] = "UNAUTHORIZED_ACCESS";
    ErrorCode[ErrorCode["INVALID_TOKEN"] = 4002] = "INVALID_TOKEN";
    ErrorCode[ErrorCode["EXPIRED_TOKEN"] = 4003] = "EXPIRED_TOKEN";
    ErrorCode[ErrorCode["INSUFFICIENT_PERMISSIONS"] = 4004] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode[ErrorCode["BUSINESS_RULE_VIOLATION"] = 5001] = "BUSINESS_RULE_VIOLATION";
    ErrorCode[ErrorCode["QUOTA_EXCEEDED"] = 5002] = "QUOTA_EXCEEDED";
    ErrorCode[ErrorCode["INVALID_OPERATION"] = 5003] = "INVALID_OPERATION";
    ErrorCode[ErrorCode["DEPENDENCY_CONFLICT"] = 5004] = "DEPENDENCY_CONFLICT";
    ErrorCode[ErrorCode["EXTERNAL_API_ERROR"] = 6001] = "EXTERNAL_API_ERROR";
    ErrorCode[ErrorCode["DATABASE_ERROR"] = 6002] = "DATABASE_ERROR";
    ErrorCode[ErrorCode["CACHE_ERROR"] = 6003] = "CACHE_ERROR";
    ErrorCode[ErrorCode["EMAIL_SERVICE_ERROR"] = 6004] = "EMAIL_SERVICE_ERROR";
    ErrorCode[ErrorCode["INTERNAL_SERVER_ERROR"] = 7001] = "INTERNAL_SERVER_ERROR";
    ErrorCode[ErrorCode["SERVICE_UNAVAILABLE"] = 7002] = "SERVICE_UNAVAILABLE";
    ErrorCode[ErrorCode["TIMEOUT_ERROR"] = 7003] = "TIMEOUT_ERROR";
    ErrorCode[ErrorCode["RATE_LIMIT_EXCEEDED"] = 7004] = "RATE_LIMIT_EXCEEDED";
})(ErrorCode || (ErrorCode = {}));
export class AppError extends Error {
    type;
    code;
    details;
    timestamp;
    requestId;
    userId;
    organizationId;
    constructor(type, code, message, details, requestId, userId, organizationId) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
        this.requestId = requestId;
        this.userId = userId;
        this.organizationId = organizationId;
    }
}
export class ValidationAppError extends AppError {
    field;
    value;
    errors;
    constructor(message, field, value, errors, requestId, userId, organizationId) {
        super(ErrorType.VALIDATION, ErrorCode.INVALID_INPUT, message, undefined, requestId, userId, organizationId);
        this.field = field;
        this.value = value;
        this.errors = errors;
    }
}
export class NotFoundAppError extends AppError {
    entity;
    id;
    constructor(entity, id, requestId, userId, organizationId) {
        super(ErrorType.NOT_FOUND, ErrorCode.ENTITY_NOT_FOUND, `${entity} not found`, undefined, requestId, userId, organizationId);
        this.entity = entity;
        this.id = id;
    }
}
export class ConflictAppError extends AppError {
    entity;
    field;
    value;
    constructor(entity, message, field, value, requestId, userId, organizationId) {
        super(ErrorType.CONFLICT, ErrorCode.DUPLICATE_ENTITY, message, undefined, requestId, userId, organizationId);
        this.entity = entity;
        this.field = field;
        this.value = value;
    }
}
export class BusinessAppError extends AppError {
    rule;
    context;
    constructor(rule, message, context, requestId, userId, organizationId) {
        super(ErrorType.BUSINESS, ErrorCode.BUSINESS_RULE_VIOLATION, message, undefined, requestId, userId, organizationId);
        this.rule = rule;
        this.context = context;
    }
}
export class ExternalAppError extends AppError {
    service;
    endpoint;
    statusCode;
    constructor(service, message, endpoint, statusCode, requestId, userId, organizationId) {
        super(ErrorType.EXTERNAL, ErrorCode.EXTERNAL_API_ERROR, message, undefined, requestId, userId, organizationId);
        this.service = service;
        this.endpoint = endpoint;
        this.statusCode = statusCode;
    }
}
export const createValidationError = (message, field, value, errors, requestId, userId, organizationId) => {
    return new ValidationAppError(message, field, value, errors, requestId, userId, organizationId);
};
export const createNotFoundError = (entity, id, requestId, userId, organizationId) => {
    return new NotFoundAppError(entity, id, requestId, userId, organizationId);
};
export const createConflictError = (entity, message, field, value, requestId, userId, organizationId) => {
    return new ConflictAppError(entity, message, field, value, requestId, userId, organizationId);
};
export const createBusinessError = (rule, message, context, requestId, userId, organizationId) => {
    return new BusinessAppError(rule, message, context, requestId, userId, organizationId);
};
export const createExternalError = (service, message, endpoint, statusCode, requestId, userId, organizationId) => {
    return new ExternalAppError(service, message, endpoint, statusCode, requestId, userId, organizationId);
};
export const isAppError = (error) => {
    return error instanceof AppError;
};
export const isValidationError = (error) => {
    return error instanceof ValidationAppError;
};
export const isNotFoundError = (error) => {
    return error instanceof NotFoundAppError;
};
export const isConflictError = (error) => {
    return error instanceof ConflictAppError;
};
export const isBusinessError = (error) => {
    return error instanceof BusinessAppError;
};
export const isExternalError = (error) => {
    return error instanceof ExternalAppError;
};
export const getErrorType = (error) => {
    if (isAppError(error)) {
        return error.type;
    }
    return ErrorType.INTERNAL;
};
export const getErrorCode = (error) => {
    if (isAppError(error)) {
        return error.code;
    }
    return ErrorCode.INTERNAL_SERVER_ERROR;
};
export const getErrorMessage = (error) => {
    if (isAppError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
export const getErrorDetails = (error) => {
    if (isAppError(error)) {
        return error.details;
    }
    return undefined;
};
export const logError = (error, context) => {
    const errorInfo = {
        type: getErrorType(error),
        code: getErrorCode(error),
        message: getErrorMessage(error),
        details: getErrorDetails(error),
        context,
        timestamp: new Date().toISOString(),
        stack: error.stack
    };
    switch (errorInfo.type) {
        case ErrorType.VALIDATION:
            console.warn('Validation Error:', errorInfo);
            break;
        case ErrorType.NOT_FOUND:
            console.warn('Not Found Error:', errorInfo);
            break;
        case ErrorType.CONFLICT:
            console.warn('Conflict Error:', errorInfo);
            break;
        case ErrorType.UNAUTHORIZED:
        case ErrorType.FORBIDDEN:
            console.warn('Authorization Error:', errorInfo);
            break;
        case ErrorType.BUSINESS:
            console.warn('Business Error:', errorInfo);
            break;
        case ErrorType.EXTERNAL:
            console.error('External Service Error:', errorInfo);
            break;
        case ErrorType.INTERNAL:
        default:
            console.error('Internal Error:', errorInfo);
            break;
    }
};
export const createErrorResponse = (error, requestId) => {
    return {
        success: false,
        error: {
            type: getErrorType(error),
            code: getErrorCode(error),
            message: getErrorMessage(error),
            details: getErrorDetails(error),
            timestamp: new Date().toISOString(),
            requestId
        }
    };
};
export const isRecoverableError = (error) => {
    if (isAppError(error)) {
        switch (error.type) {
            case ErrorType.EXTERNAL:
            case ErrorType.TIMEOUT:
            case ErrorType.RATE_LIMIT:
                return true;
            default:
                return false;
        }
    }
    return false;
};
export const getRetryDelay = (error, attempt) => {
    if (isAppError(error)) {
        switch (error.type) {
            case ErrorType.RATE_LIMIT:
                return Math.min(1000 * Math.pow(2, attempt), 30000);
            case ErrorType.TIMEOUT:
                return Math.min(1000 * attempt, 10000);
            case ErrorType.EXTERNAL:
                return Math.min(500 * Math.pow(2, attempt), 5000);
            default:
                return 0;
        }
    }
    return 0;
};
export const aggregateErrors = (errors) => {
    if (errors.length === 0) {
        return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, 'No errors to aggregate');
    }
    if (errors.length === 1) {
        return errors[0] instanceof AppError ? errors[0] : new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, errors[0].message);
    }
    const messages = errors.map(error => getErrorMessage(error));
    const aggregatedMessage = `Multiple errors occurred: ${messages.join('; ')}`;
    return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, aggregatedMessage, { errors });
};
export const addErrorContext = (error, context) => {
    if (isAppError(error)) {
        return new AppError(error.type, error.code, error.message, { ...error.details, context }, error.requestId, error.userId, error.organizationId);
    }
    return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, getErrorMessage(error), { context });
};
export const addRequestContext = (error, requestId, userId, organizationId) => {
    if (isAppError(error)) {
        return new AppError(error.type, error.code, error.message, error.details, requestId, userId, organizationId);
    }
    return new AppError(ErrorType.INTERNAL, ErrorCode.INTERNAL_SERVER_ERROR, getErrorMessage(error), undefined, requestId, userId, organizationId);
};
//# sourceMappingURL=error.utils.js.map