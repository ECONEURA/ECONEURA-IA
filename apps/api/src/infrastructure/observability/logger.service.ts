import { createLogger, format, transports, Logger } from 'winston';
import { Request, Response } from 'express';

// ============================================================================
// LOGGER SERVICE
// ============================================================================

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  service?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
  VERBOSE: 'verbose';
}

export class LoggerService {
  private logger: Logger;
  private serviceName: string;

  constructor(serviceName: string = 'econeura-api') {
    this.serviceName = serviceName;
    this.logger = this.createLogger();
  }

  // ========================================================================
  // LOGGER CREATION
  // ========================================================================

  private createLogger(): Logger {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, service, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: service || this.serviceName,
          message,
          ...meta
        });
      })
    );

    const consoleFormat = format.combine(
      format.colorize(),
      format.timestamp({ format: 'HH:mm:ss.SSS' }),
      format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${service || this.serviceName}: ${message}${metaStr}`;
      })
    );

    return createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: this.serviceName },
      transports: [
        new transports.Console({
          format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
        }),
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ],
      exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' })
      ],
      rejectionHandlers: [
        new transports.File({ filename: 'logs/rejections.log' })
      ]
    });
  }

  // ========================================================================
  // LOGGING METHODS
  // ========================================================================

  error(message: string, context?: LogContext): void {
    this.logger.error(message, this.buildLogContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.buildLogContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.buildLogContext(context));
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.buildLogContext(context));
  }

  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, this.buildLogContext(context));
  }

  // ========================================================================
  // SPECIALIZED LOGGING
  // ========================================================================

  logRequest(req: Request, res: Response, duration: number): void {
    const context: LogContext = {
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      service: this.serviceName,
      operation: `${req.method} ${req.path}`,
      duration,
      statusCode: res.statusCode,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        body: this.sanitizeBody(req.body),
        query: req.query,
        params: req.params
      }
    };

    if (res.statusCode >= 400) {
      this.error(`Request failed: ${req.method} ${req.path}`, context);
    } else {
      this.info(`Request completed: ${req.method} ${req.path}`, context);
    }
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      error,
      stack: error.stack
    });
  }

  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger.log(level, `Performance: ${operation}`, {
      ...this.buildLogContext(context),
      operation,
      duration,
      performance: {
        operation,
        duration,
        threshold: 1000,
        exceeded: duration > 1000
      }
    });
  }

  logSecurity(event: string, context?: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      security: {
        event,
        timestamp: new Date().toISOString(),
        severity: 'medium'
      }
    });
  }

  logBusiness(operation: string, context?: LogContext): void {
    this.info(`Business operation: ${operation}`, {
      ...context,
      business: {
        operation,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ========================================================================
  // CONTEXT BUILDING
  // ========================================================================

  private buildLogContext(context?: LogContext): Record<string, any> {
    if (!context) return {};

    const logContext: Record<string, any> = {};

    if (context.requestId) logContext.requestId = context.requestId;
    if (context.userId) logContext.userId = context.userId;
    if (context.organizationId) logContext.organizationId = context.organizationId;
    if (context.service) logContext.service = context.service;
    if (context.operation) logContext.operation = context.operation;
    if (context.duration !== undefined) logContext.duration = context.duration;
    if (context.statusCode) logContext.statusCode = context.statusCode;
    if (context.error) logContext.error = context.error;
    if (context.metadata) logContext.metadata = context.metadata;

    return logContext;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  // ========================================================================
  // CHILD LOGGER
  // ========================================================================

  child(context: LogContext): LoggerService {
    const childLogger = new LoggerService(this.serviceName);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  setLevel(level: string): void {
    this.logger.level = level;
  }

  getLevel(): string {
    return this.logger.level;
  }

  isLevelEnabled(level: string): boolean {
    return this.logger.isLevelEnabled(level);
  }

  // ========================================================================
  // METRICS INTEGRATION
  // ========================================================================

  logMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.info(`Metric: ${name}`, {
      metric: {
        name,
        value,
        tags: tags || {},
        timestamp: new Date().toISOString()
      }
    });
  }

  logCounter(name: string, increment: number = 1, tags?: Record<string, string>): void {
    this.info(`Counter: ${name}`, {
      counter: {
        name,
        increment,
        tags: tags || {},
        timestamp: new Date().toISOString()
      }
    });
  }

  logGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.info(`Gauge: ${name}`, {
      gauge: {
        name,
        value,
        tags: tags || {},
        timestamp: new Date().toISOString()
      }
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const logger = new LoggerService();
