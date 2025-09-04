// Error Handler and Retry Logic for ECONEURA
import { logger } from './logger.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export class ErrorHandler {
  private static defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and 5xx errors
      return error.message.includes('timeout') ||
             error.message.includes('ECONNRESET') ||
             error.message.includes('ENOTFOUND') ||
             error.message.includes('5');
    }
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryOptions, ...options };
    let lastError: Error;

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
      } catch (error) {
        lastError = error as Error;
        
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

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );

        logger.warn('Operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          delay,
          error: lastError.message
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  static async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = 'Operation timed out'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([operation, timeoutPromise]);
  }

  static handleAsyncError(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        logger.error('Async method error', {
          method: propertyKey,
          error: (error as Error).message,
          stack: (error as Error).stack
        });
        throw error;
      }
    };

    return descriptor;
  }

  static createErrorResponse(
    error: Error,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
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

  static isRetryableError(error: Error): boolean {
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

  static isClientError(error: Error): boolean {
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

  static isServerError(error: Error): boolean {
    const serverErrorPatterns = [
      /5\d\d/i,
      /internal server error/i,
      /database/i,
      /connection/i,
      /timeout/i
    ];

    return serverErrorPatterns.some(pattern => pattern.test(error.message));
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class CustomError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 404, true, context);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 401, true, context);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 403, true, context);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, true, context);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 429, true, context);
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 503, true, context);
  }
}
