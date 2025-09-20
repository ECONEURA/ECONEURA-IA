/**
 * ECONEURA Centralized Logging System
 * Mediterranean CRM+ERP+AI System
 * Production-ready logging with Azure Application Insights integration
 */

import { createLogger, format, transports, Logger } from 'winston';

interface LogInfo {
  timestamp: string;
  level: string;
  message: string;
  [key: string]: any;
}
import * as appInsights from 'applicationinsights';
import { TelemetryClient } from 'applicationinsights';

export interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  sessionId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  method?: string;
  statusCode?: number;
  duration?: number;
  category?: 'CRM' | 'ERP' | 'AI' | 'AUTH' | 'WEBHOOK' | 'SYSTEM';
  error?: Error | Record<string, any>;
  performanceMetric?: string;
}

export interface BusinessLogEvent {
  event: string;
  category: 'CRM' | 'ERP' | 'AI' | 'AUTH' | 'WEBHOOK' | 'SYSTEM';
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  context: LogContext;
  data?: any;
  error?: Error;
}

export class EconeuraLogger {
  private logger!: Logger;
  private telemetryClient?: TelemetryClient;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.setupWinstonLogger();
    this.setupApplicationInsights();
  }

  private setupWinstonLogger(): void {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf((info: any) => {
        const { timestamp, level, message, ...meta } = info;
        return JSON.stringify({
          '@timestamp': timestamp,
          level: level.toUpperCase(),
          message,
          environment: this.environment,
          service: 'econeura',
          ...meta,
        });
      })
    );

    this.logger = createLogger({
      level: this.environment === 'production' ? 'info' : 'debug',
      format: logFormat,
      defaultMeta: {
        service: 'econeura',
        environment: this.environment,
        version: process.env.npm_package_version || '1.0.0',
      },
      transports: [
        // Console transport for development
        new transports.Console({
          format: this.environment === 'development' 
            ? format.combine(
                format.colorize(),
                format.simple(),
                format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                  return `${timestamp} [${level}]: ${message} ${metaStr}`;
                })
              )
            : logFormat
        }),

        // File transport for production
        ...(this.environment === 'production' ? [
          new transports.File({
            filename: '/app/logs/error.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new transports.File({
            filename: '/app/logs/combined.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
          }),
        ] : []),
      ],
      exceptionHandlers: [
        new transports.File({ filename: '/app/logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new transports.File({ filename: '/app/logs/rejections.log' }),
      ],
    });
  }

  private setupApplicationInsights(): void {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    
    if (connectionString) {
            appInsights.setup(connectionString)
        .setAutoCollectConsole(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectHeartbeat(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectRequests(true)
        .setAutoDependencyCorrelation(true)
        .setDistributedTracingMode(1)
        .start();

      this.telemetryClient = appInsights.defaultClient;
      
      // Add custom properties
      this.telemetryClient.addTelemetryProcessor((envelope) => {
        envelope.tags = envelope.tags || {};
        envelope.tags['ai.cloud.role'] = 'econeura';
        envelope.tags['ai.cloud.roleInstance'] = process.env.WEBSITE_INSTANCE_ID || 'local';
        return true;
      });

      this.info('Application Insights initialized', {
        category: 'SYSTEM',
        action: 'MONITORING_INIT'
      });
    }
  }

  // Core logging methods
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.enrichContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.enrichContext(context));
    this.telemetryClient?.trackTrace({
      message,
      severity: 'INFO',
      properties: context,
    });
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.logger.warn(message, this.enrichContext(context, error));
    this.telemetryClient?.trackTrace({
      message,
      severity: 'WARN',
      properties: context,
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, this.enrichContext(context, error));
    
    if (this.telemetryClient) {
      if (error) {
        this.telemetryClient.trackException({
          exception: error,
          properties: { message, ...context },
        });
      } else {
        this.telemetryClient.trackTrace({
          message,
          severity: 'ERROR',
          properties: context,
        });
      }
    }
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(`[CRITICAL] ${message}`, this.enrichContext(context, error));
    
    if (this.telemetryClient) {
      this.telemetryClient.trackException({
        exception: error || new Error(message),
        properties: { message, severity: 'CRITICAL', ...context },
      });
    }
  }

  // Business event logging
  logBusinessEvent(event: BusinessLogEvent): void {
    const logData = {
      businessEvent: event.event,
      category: event.category,
      severity: event.severity,
      ...event.context,
      ...(event.data && { data: event.data }),
      ...(event.error && { error: this.serializeError(event.error) }),
    };

    switch (event.severity) {
      case 'CRITICAL':
        this.critical(`[${event.category}] ${event.event}`, event.error, event.context);
        break;
      case 'ERROR':
        this.error(`[${event.category}] ${event.event}`, event.error, event.context);
        break;
      case 'WARN':
        this.warn(`[${event.category}] ${event.event}`, event.context, event.error);
        break;
      case 'INFO':
      default:
        this.info(`[${event.category}] ${event.event}`, event.context);
        break;
    }

    // Track business metrics
    if (this.telemetryClient) {
      this.telemetryClient.trackEvent({
        name: `${event.category}_${event.event}`,
        properties: logData,
      });
    }
  }

  // Performance monitoring
  trackPerformance(name: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${name} completed in ${duration}ms`, {
      ...context,
      action: 'PERFORMANCE_TRACK',
      duration,
      performanceMetric: name,
    });

    this.telemetryClient?.trackMetric({
      name: `performance_${name}`,
      value: duration,
      properties: context,
    });
  }

  // Dependency tracking
  trackDependency(
    type: string,
    name: string,
    data: string,
    duration: number,
    success: boolean,
    context?: LogContext
  ): void {
    this.telemetryClient?.trackDependency({
      dependencyTypeName: type,
      name,
      data,
      duration,
      success,
      properties: context,
    });
  }

  // Custom metrics
  trackMetric(name: string, value: number, properties?: Record<string, any>): void {
    this.telemetryClient?.trackMetric({
      name: `econeura_${name}`,
      value,
      properties,
    });
  }

  // User activity tracking
  trackUserActivity(userId: string, activity: string, properties?: Record<string, any>): void {
    this.logBusinessEvent({
      event: 'USER_ACTIVITY',
      category: 'SYSTEM',
      severity: 'INFO',
      context: {
        userId,
        action: activity,
        metadata: properties,
      },
    });
  }

  // Security event logging
  logSecurityEvent(
    event: string,
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    context: LogContext
  ): void {
    this.logBusinessEvent({
      event: `SECURITY_${event}`,
      category: 'AUTH',
      severity,
      context,
    });
  }

  // Private helper methods
  private enrichContext(context?: LogContext, error?: Error): any {
    const enriched = {
      ...context,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };

    if (error) {
      enriched.error = this.serializeError(error);
    }

    return enriched;
  }

  private serializeError(error: Error): any {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: error.cause } : {}),
    };
  }

  // Graceful shutdown
  flush(): Promise<void> {
    return new Promise((resolve) => {
      this.telemetryClient?.flush();
      
      // Wait for winston to finish writing
      const transports = this.logger.transports;
      let pending = transports.length;
      
      if (pending === 0) {
        resolve();
        return;
      }

      transports.forEach((transport) => {
        if (transport.close) {
          try {
            transport.close();
            pending--;
            if (pending === 0) resolve();
          } catch (error) {
            // Handle any errors during transport closure
            pending--;
            if (pending === 0) resolve();
          }
        } else {
          pending--;
          if (pending === 0) resolve();
        }
      });
    });
  }
}

// Singleton instance
export const logger = new EconeuraLogger();

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  
  // Log request start
  logger.info('HTTP Request Started', {
    requestId,
    action: 'HTTP_REQUEST_START',
    resource: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(this: any, ...args: any[]) {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request Completed', {
      requestId,
      action: 'HTTP_REQUEST_END',
      resource: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
    });

    logger.trackPerformance(`http_${req.method}_${req.route?.path || 'unknown'}`, duration, {
      requestId,
      statusCode: res.statusCode,
    });

    originalEnd.apply(this, args);
  };

  next();
};

export default logger;
