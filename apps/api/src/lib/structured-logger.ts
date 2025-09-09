// Structured Logger for ECONEURA
import { logger } from './logger.js';

export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  organizationId?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  private requestId: string = '';

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  private formatLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        requestId: context?.requestId || this.requestId
      }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    if (metadata) {
      entry.metadata = metadata;
    }

    return entry;
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('debug', message, context, undefined, metadata);
    logger.debug(JSON.stringify(entry));
  }

  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('info', message, context, undefined, metadata);
    logger.info(JSON.stringify(entry));
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('warn', message, context, undefined, metadata);
    logger.warn(JSON.stringify(entry));
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('error', message, context, error, metadata);
    logger.error(JSON.stringify(entry));
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('fatal', message, context, error, metadata);
    logger.error(JSON.stringify(entry));
  }

  // Business-specific logging methods
  audit(action: string, context: LogContext, metadata?: Record<string, unknown>): void {
    this.info(`AUDIT: ${action}`, { ...context, operation: 'audit' }, metadata);
  }

  security(event: string, context: LogContext, metadata?: Record<string, unknown>): void {
    this.warn(`SECURITY: ${event}`, { ...context, operation: 'security' }, metadata);
  }

  performance(operation: string, duration: number, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.info(`PERFORMANCE: ${operation}`, { ...context, operation, duration }, metadata);
  }

  apiCall(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `API: ${method} ${endpoint} - ${statusCode}`;

    this[level](message, { ...context, operation: 'api_call' }, {
      method,
      endpoint,
      statusCode,
      duration
    });
  }

  database(operation: string, table: string, duration: number, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.info(`DATABASE: ${operation} on ${table}`, { ...context, operation: 'database' }, {
      table,
      duration,
      ...metadata
    });
  }

  cache(operation: string, key: string, hit: boolean, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.debug(`CACHE: ${operation} ${key} - ${hit ? 'HIT' : 'MISS'}`, { ...context, operation: 'cache' }, {
      key,
      hit,
      ...metadata
    });
  }

  // Request lifecycle logging
  requestStart(method: string, endpoint: string, context?: LogContext): void {
    this.info(`REQUEST START: ${method} ${endpoint}`, { ...context, operation: 'request_start' });
  }

  requestEnd(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this[level](`REQUEST END: ${method} ${endpoint} - ${statusCode}`, { ...context, operation: 'request_end' }, {
      statusCode,
      duration
    });
  }

  // Error logging with context
  logError(error: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.error(`ERROR: ${error.message}`, error, context, metadata);
  }

  // Business event logging
  userAction(action: string, userId: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.info(`USER ACTION: ${action}`, { ...context, userId, operation: 'user_action' }, metadata);
  }

  systemEvent(event: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.info(`SYSTEM EVENT: ${event}`, { ...context, operation: 'system_event' }, metadata);
  }

  // Metrics logging
  metric(name: string, value: number, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.info(`METRIC: ${name} = ${value}`, { ...context, operation: 'metric' }, {
      metricName: name,
      metricValue: value,
      ...metadata
    });
  }

  // Health check logging
  healthCheck(service: string, status: 'healthy' | 'unhealthy' | 'degraded', context?: LogContext, metadata?: Record<string, unknown>): void {
    const level = status === 'healthy' ? 'info' : 'warn';
    this[level](`HEALTH CHECK: ${service} is ${status}`, { ...context, operation: 'health_check' }, {
      service,
      status,
      ...metadata
    });
  }
}

export const structuredLogger = StructuredLogger.getInstance();
