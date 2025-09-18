interface LogContext {
  // Contexto organizacional
  org?: string;
  orgTier?: string;
  orgFeatures?: string[];

  // Contexto de usuario
  userId?: string;
  userRole?: string;
  userPermissions?: string[];

  // Contexto de request
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  endpoint?: string;
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  queryJson?: string;

  // Métricas de rendimiento
  duration?: number;
  startTime?: number;
  endTime?: number;

  // Métricas de IA
  tokens?: number;
  cost?: number;
  aiModel?: string;
  aiProvider?: string;
  promptTokens?: number;
  completionTokens?: number;

  // Contexto técnico
  userAgent?: string;
  ip?: string;
  statusCode?: number;
  error?: string;
  stack?: string;
  port?: number;
  environment?: string;
  version?: string;

  // Contexto de negocio
  businessUnit?: string;
  operationType?: string;
  resourceType?: string;

  // Flags y estados
  isRetry?: boolean;
  isCached?: boolean;
  isDegraded?: boolean;
  isRateLimited?: boolean;
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
  prompt?: string;
  current?: number;
  // note: `path` and `query` are declared above in 'Contexto de request' to avoid duplicates
  // FinOps fields
  headers?: Record<string, string>;
  reason?: string;
  criticalAlerts?: number;
  costId?: string;
  budgetId?: string;
  daysToKeep?: number;
  // Additional fields used across the codebase
  stats?: any;
  age?: number;
  accessCount?: number;
  cacheSize?: number;
  totalItems?: number;
  score?: number;
  flagId?: string;
  variablesCount?: number;
  valueType?: string;
  valueLength?: number;
  aggregateId?: string;
  eventId?: string;
  eventType?: string;
  readModelId?: string;
  commandType?: string;
  commandId?: string;
  queryType?: string;
  queryId?: string;
  fromTimestamp?: string;
  eventCount?: number;
  amount?: number;
  percentage?: number;
  notificationId?: string;
  cutoffDate?: string;
  config?: any;
  serviceId?: string;
  routeId?: string;
  serviceName?: string;
  flags?: any;
  flagIds?: string[];
  remaining?: number;
  apiKey?: string;
  role?: string;
  table?: string;
  resource?: string;
  expected?: string;
  limit?: number;
  strategy?: string;
  filters?: any;
  model?: string;
  // Security system fields
  mfaType?: string;
  mfaEnabled?: boolean;
  system?: string;
  action?: string;
  permissionId?: string;
  roleId?: string;
  tokenId?: string;
  auditLogId?: string;
  securityEventId?: string;
  threatId?: string;
  ipAddress?: string;
  reputation?: string;
  threatTypes?: string[];
  confidence?: number;
  country?: string;
  lastSeen?: string;
  scopes?: string[];
  roleName?: string;
  auditId?: string;
  bruteForceAttempts?: number;
  accountLocked?: boolean;
  threatReputation?: string;
  threatCountry?: string;
  threatConfidence?: number;
  backupCodes?: string[];
  qrCode?: string;
  phoneNumber?: string;
  verificationCode?: string;
  passwordHash?: string;
  salt?: string;
  jwtPayload?: any;
  failedLoginCount?: number;
  lockoutDuration?: number;
  securityEventCount?: number;
  timeWindow?: string;
  // Analytics fields
  dashboardsCount?: number;
  metrics?: any;
  metricsCount?: number;
  dashboardId?: string;
  reportId?: string;
  filtersCount?: number;
  orderByCount?: number;
  // Configuration fields
  flagName?: string;
  secretsCount?: number;
  // Events fields
  fromVersion?: number;
  handlerCount?: number;
  readModelType?: string;
  finalVersion?: number;
  // FinOps additional fields
  period?: string;
  message?: string;
  recipient?: string;
  // Gateway fields
  name?: string;
  targetUrl?: string;
  errorRate?: number;
  // Notifications fields
  templatesCount?: number;
  templateId?: string;
  priority?: string;
  channel?: string;
  total?: number;
  scheduledAt?: string;
  to?: string;
  // Rate limiting fields
  retryAfter?: number;
  // Collaboration fields
  collaboration?: string;
  connections?: number;
  connectionId?: string;
  userName?: string;
  roomId?: string;
  roomsCount?: number;
  // RLS fields
  originalQuery?: string;
  hasPermission?: boolean;
  originalData?: any;
  actual?: string;
  // Service discovery fields
  serviceUrl?: string;
  health?: string;
  // Service mesh fields
  attempt?: number;
  failureCount?: number;
  // Feature flags fields
  results?: any;
  context?: any;
  // Monitoring system fields
  category?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  processCount?: number;
  responseTime?: number;
  uptime?: number;
  transactionId?: string;
  spanName?: string;
  spanType?: string;
  activeConnections?: number;
  queryCount?: number;
  slowQueries?: number;
  cacheHitRate?: number;
  anomalyMetric?: string;
  anomalyValue?: number;
  expectedRange?: [number, number];
  severity?: string;
  threshold?: number;
  dashboardName?: string;
  orgId?: string;
  monitoringInterval?: number;
  metricsCollected?: any;
  components?: string[];
  // Additional fields for all systems
  email?: string;
  code?: string;
  reportsCount?: number;
  timeRange?: string;
  dimensionsCount?: number;
  widgetsCount?: number;
  count?: number;
  enabled?: boolean;
  toVersion?: number;
  url?: string;
  notificationsCount?: number;
  features?: string[];
  remoteAddress?: string;
  messageType?: string;
  ownerId?: string;
  usersCount?: number;
  filteredQuery?: string;
  sanitizedData?: any;
  successful?: number;
  permissions?: string[];
  permissionAction?: string;
  auditAction?: string;
  totalUsers?: number;
  maxRetries?: number;
  clientIp?: string;
  body?: any;
  routeName?: string;
  success?: boolean;
  // Additional fields for specific systems
  onboardingWorkflowId?: string;
  totalRecords?: number;
  connectionsCount?: number;
  username?: string;
  totalRoles?: number;
  serviceInstance?: string;
  loadBalancerStrategy?: string;
  headersCount?: number;
  totalPermissions?: number;
  resetTime?: string;
  totalAuditLogs?: number;
  serviceInstanceId?: string;
  totalSecurityEvents?: number;
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
  const allowedLevels = ['error', 'warn', 'info', 'debug'] as const;
  const lvl = (typeof level === 'string' && (allowedLevels as readonly string[]).includes(level)) ? (level as 'error' | 'warn' | 'info' | 'debug') : 'info';
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: lvl,
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

  // Método para obtener logs
  getLogs(): LogEntry[] {
    return []; // TODO: Implement log storage
  }
}

export const logger = new StructuredLogger();
