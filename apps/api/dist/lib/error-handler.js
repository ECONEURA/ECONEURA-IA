import { logger } from './logger.js';
export class ErrorHandler {
    static defaultRetryOptions = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryCondition: (error) => {
            return error.message.includes('timeout') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('5');
        }
    };
    static async withRetry(operation, options = {}) {
        const config = { ...this.defaultRetryOptions, ...options };
        let lastError;
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 0) {
                    logger.info('Operation succeeded after retry', {
                        attempt: attempt + 1,
                        maxRetries: config.maxRetries
                    });
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (attempt === config.maxRetries) {
                    logger.error('Operation failed after all retries', {
                        attempts: attempt + 1,
                        maxRetries: config.maxRetries,
                        error: lastError.message
                    });
                    break;
                }
                if (config.retryCondition && !config.retryCondition(lastError)) {
                    logger.warn('Error not retryable', { error: lastError.message });
                    break;
                }
                const delay = Math.min(config.baseDelay * Math.pow(config.backoffFactor, attempt), config.maxDelay);
                logger.warn('Operation failed, retrying', {
                    attempt: attempt + 1,
                    maxRetries: config.maxRetries,
                    delay,
                    error: lastError.message
                });
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    static async withTimeout(operation, timeoutMs, timeoutMessage = 'Operation timed out') {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        });
        return Promise.race([operation, timeoutPromise]);
    }
    static handleAsyncError(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            try {
                return await originalMethod.apply(this, args);
            }
            catch (error) {
                logger.error('Async method error', {
                    method: propertyKey,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        };
        return descriptor;
    }
    static createErrorResponse(error, statusCode = 500, context) {
        const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger.error('API Error', {
            errorId,
            statusCode,
            message: error.message,
            stack: error.stack,
            context
        });
        return {
            success: false,
            error: {
                id: errorId,
                message: error.message,
                statusCode,
                timestamp: new Date().toISOString(),
                context
            }
        };
    }
    static isRetryableError(error) {
        const retryablePatterns = [
            /timeout/i,
            /ECONNRESET/i,
            /ENOTFOUND/i,
            /ECONNREFUSED/i,
            /ETIMEDOUT/i,
            /5\d\d/i
        ];
        return retryablePatterns.some(pattern => pattern.test(error.message));
    }
    static isClientError(error) {
        const clientErrorPatterns = [
            /4\d\d/i,
            /validation/i,
            /invalid/i,
            /not found/i,
            /unauthorized/i,
            /forbidden/i
        ];
        return clientErrorPatterns.some(pattern => pattern.test(error.message));
    }
    static isServerError(error) {
        const serverErrorPatterns = [
            /5\d\d/i,
            /internal server error/i,
            /database/i,
            /connection/i,
            /timeout/i
        ];
        return serverErrorPatterns.some(pattern => pattern.test(error.message));
    }
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export class CustomError extends Error {
    statusCode;
    isOperational;
    context;
    constructor(message, statusCode = 500, isOperational = true, context) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends CustomError {
    constructor(message, context) {
        super(message, 400, true, context);
    }
}
export class NotFoundError extends CustomError {
    constructor(message, context) {
        super(message, 404, true, context);
    }
}
export class UnauthorizedError extends CustomError {
    constructor(message, context) {
        super(message, 401, true, context);
    }
}
export class ForbiddenError extends CustomError {
    constructor(message, context) {
        super(message, 403, true, context);
    }
}
export class ConflictError extends CustomError {
    constructor(message, context) {
        super(message, 409, true, context);
    }
}
export class RateLimitError extends CustomError {
    constructor(message, context) {
        super(message, 429, true, context);
    }
}
export class ServiceUnavailableError extends CustomError {
    constructor(message, context) {
        super(message, 503, true, context);
    }
}
//# sourceMappingURL=error-handler.js.map