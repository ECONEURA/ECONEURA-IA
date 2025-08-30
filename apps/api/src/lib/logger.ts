interface LogContext {
  org?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  tokens?: number;
  cost?: number;
  userAgent?: string;
  ip?: string;
  statusCode?: number;
  error?: string;
  stack?: string;
  port?: number;
  environment?: string;
  aiModel?: string;
  aiProvider?: string;
  service?: string;
  status?: string;
  metricName?: string;
  metricValue?: number;
  metricLabels?: Record<string, string>;
  operation?: string;
  ruleId?: string;
  ruleName?: string;
  updates?: any;
  alertId?: string;
  acknowledgedBy?: string;
  alertCount?: number;
  alerts?: any[];
  // Cache fields
  key?: string;
  type?: string;
  ttl?: number;
  maxSize?: number;
  patternsCount?: number;
  warmupItems?: number;
  previousSize?: number;
  intervalMinutes?: number;
  // Rate limiting fields
  organizationId?: string;
  // Request fields
  path?: string;
  prompt?: string;
  query?: string;
  current?: number;
  // FinOps fields
  headers?: Record<string, string>;
  reason?: string;
  criticalAlerts?: number;
  costId?: string;
  budgetId?: string;
  daysToKeep?: number;
}

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: LogContext;
  traceId?: string;
  spanId?: string;
}

class StructuredLogger {
  private logLevel = process.env.LOG_LEVEL || 'info';
  private serviceName = 'api-express';
  private version = process.env.npm_package_version || '1.0.0';

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(level: string, message: string, context?: LogContext): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level as any,
      message,
      context,
      traceId: context?.requestId || this.generateTraceId(),
      spanId: this.generateSpanId()
    };

    return logEntry;
  }

  private outputLog(logEntry: LogEntry): void {
    const output = {
      ...logEntry,
      service: this.serviceName,
      version: this.version,
      environment: process.env.NODE_ENV || 'development'
    };

    // En desarrollo, formato legible
    if (process.env.NODE_ENV === 'development') {
      const color = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[35m'  // Magenta
      }[logEntry.level] || '\x1b[0m';

      console.log(`${color}[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}\x1b[0m`);
      if (logEntry.context) {
        console.log(`${color}  Context: ${JSON.stringify(logEntry.context, null, 2)}\x1b[0m`);
      }
    } else {
      // En producción, JSON estructurado
      console.log(JSON.stringify(output));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const logEntry = this.formatLog('error', message, context);
      this.outputLog(logEntry);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const logEntry = this.formatLog('warn', message, context);
      this.outputLog(logEntry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const logEntry = this.formatLog('info', message, context);
      this.outputLog(logEntry);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const logEntry = this.formatLog('debug', message, context);
      this.outputLog(logEntry);
    }
  }

  // Logging específico para requests HTTP
  request(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const message = `${method} ${path} - ${statusCode} (${duration}ms)`;
    
    this[level](message, {
      ...context,
      method,
      endpoint: path,
      statusCode,
      duration
    });
  }

  // Logging específico para IA
  aiRequest(model: string, provider: string, tokens: number, cost: number, duration: number, context?: LogContext): void {
    this.info(`AI Request: ${model} (${provider}) | Tokens: ${tokens} | Cost: €${cost.toFixed(4)} | Duration: ${duration}ms`, {
      ...context,
      tokens,
      cost,
      duration,
      aiModel: model,
      aiProvider: provider
    });
  }

  aiError(error: string, model: string, context?: LogContext): void {
    this.error(`AI Error: ${error} | Model: ${model}`, {
      ...context,
      aiModel: model,
      error
    });
  }

  // Logging específico para budget
  budgetWarning(org: string, current: number, limit: number, context?: LogContext): void {
    const percentage = (current / limit) * 100;
    this.warn(`Budget Warning: ${org} | Current: €${current.toFixed(2)} | Limit: €${limit.toFixed(2)} | Usage: ${percentage.toFixed(1)}%`, {
      ...context,
      org,
      current,
      limit,
      percentage
    });
  }

  // Logging específico para health checks
  healthCheck(service: string, status: 'ok' | 'error', duration: number, context?: LogContext): void {
    const level = status === 'ok' ? 'info' : 'error';
    this[level](`Health Check: ${service} - ${status} (${duration}ms)`, {
      ...context,
      service,
      status,
      duration
    });
  }

  // Logging específico para métricas
  metric(name: string, value: number, labels?: Record<string, string>, context?: LogContext): void {
    this.debug(`Metric: ${name} = ${value}`, {
      ...context,
      metricName: name,
      metricValue: value,
      metricLabels: labels
    });
  }

  // Logging específico para traces
  trace(operation: string, duration: number, context?: LogContext): void {
    this.debug(`Trace: ${operation} - ${duration}ms`, {
      ...context,
      operation,
      duration
    });
  }

  // Método para configurar el nivel de log
  setLogLevel(level: string): void {
    this.logLevel = level;
    this.info(`Log level changed to: ${level}`);
  }

  // Método para obtener estadísticas de logging
  getStats(): any {
    return {
      service: this.serviceName,
      version: this.version,
      logLevel: this.logLevel,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

export const logger = new StructuredLogger();
