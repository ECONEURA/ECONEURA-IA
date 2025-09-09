import pino, { Logger } from 'pino';
import { LogContext, AILogData, FlowLogData, WebhookLogData } from './index.js';

/**
 * Enhanced Logger with Environment-aware Configuration
 * Builds upon existing logging infrastructure with improved startup integration
 */

export interface EnhancedLogContext extends LogContext {
  service?: string;
  version?: string;
  environment?: string;
  startup_phase?: string;
  component?: string;
}

export class EnhancedEcoNeuraLogger {
  private logger: Logger;
  private service: string;
  private version: string;
  private environment: string;

  constructor(service: string = 'unknown', version: string = '1.0.0') {
    this.service = service;
    this.version = version;
    this.environment = process.env.NODE_ENV || 'development';

    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          ts: new Date().toISOString(),
          service: this.service,
          version: this.version,
          environment: this.environment,
          ...object,
        }),
      },
      redact: {
        paths: [
          'password', 
          'api_key', 
          'secret', 
          'token', 
          'authorization',
          'jwt_secret',
          'database_url',
          'redis_url'
        ],
        censor: '[REDACTED]',
      },
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
      // Enhanced transport for better development experience
      transport: this.environment === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'hostname,pid',
          translateTime: 'SYS:standard',
        }
      } : undefined,
    });
  }

  // Core logging methods with enhanced context
  info(msg: string, context?: EnhancedLogContext) {
    this.logger.info(this.enrichContext(context), msg);
  }

  warn(msg: string, context?: EnhancedLogContext) {
    this.logger.warn(this.enrichContext(context), msg);
  }

  error(msg: string, error?: Error, context?: EnhancedLogContext) {
    this.logger.error({ 
      err: error, 
      ...this.enrichContext(context) 
    }, msg);
  }

  debug(msg: string, context?: EnhancedLogContext) {
    this.logger.debug(this.enrichContext(context), msg);
  }

  // Startup and lifecycle logging
  logStartup(msg: string, context: { phase: string; config?: any; duration_ms?: number }) {
    this.logger.info({
      type: 'service_startup',
      startup_phase: context.phase,
      config: context.config ? this.sanitizeConfig(context.config) : undefined,
      duration_ms: context.duration_ms,
    }, msg);
  }

  logShutdown(msg: string, context: { reason?: string; duration_ms?: number }) {
    this.logger.info({
      type: 'service_shutdown',
      reason: context.reason,
      duration_ms: context.duration_ms,
    }, msg);
  }

  // Database and connection logging
  logDatabaseConnection(msg: string, context: { status: 'connecting' | 'connected' | 'disconnected' | 'error'; latency_ms?: number }) {
    this.logger.info({
      type: 'database_connection',
      component: 'database',
      status: context.status,
      latency_ms: context.latency_ms,
    }, msg);
  }

  logRedisConnection(msg: string, context: { status: 'connecting' | 'connected' | 'disconnected' | 'error'; latency_ms?: number }) {
    this.logger.info({
      type: 'redis_connection', 
      component: 'redis',
      status: context.status,
      latency_ms: context.latency_ms,
    }, msg);
  }

  // Queue and worker logging
  logQueueEvent(msg: string, context: { 
    queue_name: string;
    event: 'job_added' | 'job_completed' | 'job_failed' | 'queue_started' | 'queue_stopped';
    job_id?: string;
    duration_ms?: number;
  }) {
    this.logger.info({
      type: 'queue_event',
      component: 'queue',
      queue_name: context.queue_name,
      event: context.event,
      job_id: context.job_id,
      duration_ms: context.duration_ms,
    }, msg);
  }

  // Environment validation logging
  logEnvValidation(msg: string, context: { status: 'success' | 'warning' | 'error'; missing_vars?: string[]; warnings?: string[] }) {
    this.logger.info({
      type: 'env_validation',
      component: 'config',
      status: context.status,
      missing_vars: context.missing_vars,
      warnings: context.warnings,
    }, msg);
  }

  // Health check logging
  logHealthCheck(msg: string, context: {
    endpoint: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    latency_ms?: number;
    dependencies?: Record<string, 'up' | 'down'>;
  }) {
    this.logger.info({
      type: 'health_check',
      component: 'health',
      endpoint: context.endpoint,
      status: context.status,
      latency_ms: context.latency_ms,
      dependencies: context.dependencies,
    }, msg);
  }

  // Create child logger with additional context
  child(context: EnhancedLogContext) {
    const childLogger = new EnhancedEcoNeuraLogger(this.service, this.version);
    childLogger.logger = this.logger.child(this.enrichContext(context));
    return childLogger;
  }

  // Private helper methods
  private enrichContext(context?: EnhancedLogContext): EnhancedLogContext {
    return {
      service: this.service,
      version: this.version,
      environment: this.environment,
      ...context,
    };
  }

  private sanitizeConfig(config: any): any {
    // Remove sensitive configuration values for logging
    const sanitized = { ...config };
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'url'];
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Expose underlying logger for advanced usage
  get pinoLogger(): Logger {
    return this.logger;
  }
}

// Export singleton instances for different services
export const apiLogger = new EnhancedEcoNeuraLogger('api', process.env.npm_package_version || '1.0.0');
export const workerLogger = new EnhancedEcoNeuraLogger('workers', process.env.npm_package_version || '1.0.0');
export const webLogger = new EnhancedEcoNeuraLogger('web', process.env.npm_package_version || '1.0.0');

// Default export for backward compatibility
export default EnhancedEcoNeuraLogger;