import { logger } from './logger.js';
import { z } from 'zod';
import { createWriteStream, createReadStream, promises as fs } from 'fs';
import { join, dirname } from 'path';
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

// Mock de Azure Application Insights para testing
const mockApplicationInsights = {
  trackEvent: (event: any) => {},
  trackException: (exception: any) => {},
  trackMetric: (metric: any) => {},
  trackTrace: (trace: any) => {},
  flush: () => Promise.resolve()
};

// Mock de Elasticsearch para testing
const mockElasticsearch = {
  index: (params: any) => Promise.resolve({ _id: 'mock-id' }),
  search: (params: any) => Promise.resolve({ hits: { hits: [] } }),
  bulk: (params: any) => Promise.resolve({ items: [] })
};

// Mock de servicios externos
const applicationInsights = mockApplicationInsights;
const elasticsearch = mockElasticsearch;

// Schemas de validación
const LogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']),
  message: z.string(),
  service: z.string(),
  environment: z.string(),
  context: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  hostname: z.string().optional(),
  pid: z.number().optional(),
  version: z.string().optional()
});

const LogQuerySchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  service: z.string().optional(),
  environment: z.string().optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  message: z.string().optional(),
  limit: z.number().min(1).max(10000).optional(),
  offset: z.number().min(0).optional(),
  sort: z.enum(['timestamp', 'level', 'service']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

const LogAggregationSchema = z.object({
  groupBy: z.array(z.enum(['level', 'service', 'environment', 'userId', 'organizationId', 'source', 'tags'])),
  timeRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
  }),
  interval: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).optional(),
  filters: z.record(z.any()).optional()
});

const LogAlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pattern: z.string(), // Regex pattern
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  service: z.string().optional(),
  environment: z.string().optional(),
  threshold: z.number().min(1),
  window: z.number().min(1), // segundos
  enabled: z.boolean(),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'SLACK', 'WEBHOOK', 'SMS']),
    config: z.record(z.any())
  }))
});

const LogRetentionPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  service: z.string().optional(),
  environment: z.string().optional(),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  retentionDays: z.number().min(1),
  enabled: z.boolean(),
  compressionEnabled: z.boolean().optional(),
  archiveEnabled: z.boolean().optional()
});

// Tipos TypeScript
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type LogQuery = z.infer<typeof LogQuerySchema>;
export type LogAggregation = z.infer<typeof LogAggregationSchema>;
export type LogAlertRule = z.infer<typeof LogAlertRuleSchema>;
export type LogRetentionPolicy = z.infer<typeof LogRetentionPolicySchema>;

export interface CentralizedLoggingConfig {
  elasticsearchEnabled: boolean;
  applicationInsightsEnabled: boolean;
  fileLoggingEnabled: boolean;
  consoleLoggingEnabled: boolean;
  logLevel: string;
  maxLogSize: number; // bytes
  maxLogFiles: number;
  retentionDays: number;
  compressionEnabled: boolean;
  archiveEnabled: boolean;
  alertingEnabled: boolean;
  realTimeProcessing: boolean;
  batchSize: number;
  flushInterval: number; // segundos
}

export interface LogStatistics {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
  logsByEnvironment: Record<string, number>;
  averageLogSize: number;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
  logVolume: Array<{ timestamp: Date; count: number }>;
  lastProcessed: Date | null;
}

export interface LogSearchResult {
  logs: LogEntry[];
  total: number;
  aggregations?: Record<string, any>;
  took: number; // milliseconds
}

export class CentralizedLoggingService {
  private config: CentralizedLoggingConfig;
  private logs: Map<string, LogEntry> = new Map();
  private alertRules: Map<string, LogAlertRule> = new Map();
  private retentionPolicies: Map<string, LogRetentionPolicy> = new Map();
  private logBuffer: LogEntry[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: CentralizedLoggingConfig) {
    this.config = config;
    this.initializeDefaultRules();
    this.initializeDefaultRetentionPolicies();
    this.startLogProcessing();
  }

  // ===== GESTIÓN DE LOGS =====

  async writeLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry> {
    try {
      const logEntry: LogEntry = {
        ...entry,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      // Validar entrada
      const validatedEntry = LogEntrySchema.parse(logEntry);

      // Agregar al buffer
      this.logBuffer.push(validatedEntry);
      this.logs.set(validatedEntry.id, validatedEntry);

      // Procesar en tiempo real si está habilitado
      if (this.config.realTimeProcessing) {
        await this.processLogEntry(validatedEntry);
      }

      // Enviar a Application Insights si está habilitado
      if (this.config.applicationInsightsEnabled) {
        await this.sendToApplicationInsights(validatedEntry);
      }

      // Enviar a Elasticsearch si está habilitado
      if (this.config.elasticsearchEnabled) {
        await this.sendToElasticsearch(validatedEntry);
      }

      // Escribir a archivo si está habilitado
      if (this.config.fileLoggingEnabled) {
        await this.writeToFile(validatedEntry);
      }

      // Evaluar reglas de alertas
      await this.evaluateAlertRules(validatedEntry);

      return validatedEntry;

    } catch (error) {
      logger.error('Error writing log entry', { error });
      throw error;
    }
  }

  async searchLogs(query: LogQuery): Promise<LogSearchResult> {
    try {
      const validatedQuery = LogQuerySchema.parse(query);
      const startTime = Date.now();

      let filteredLogs = Array.from(this.logs.values());

      // Aplicar filtros
      if (validatedQuery.level) {
        filteredLogs = filteredLogs.filter(log => log.level === validatedQuery.level);
      }
      if (validatedQuery.service) {
        filteredLogs = filteredLogs.filter(log => log.service === validatedQuery.service);
      }
      if (validatedQuery.environment) {
        filteredLogs = filteredLogs.filter(log => log.environment === validatedQuery.environment);
      }
      if (validatedQuery.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === validatedQuery.userId);
      }
      if (validatedQuery.organizationId) {
        filteredLogs = filteredLogs.filter(log => log.organizationId === validatedQuery.organizationId);
      }
      if (validatedQuery.requestId) {
        filteredLogs = filteredLogs.filter(log => log.requestId === validatedQuery.requestId);
      }
      if (validatedQuery.sessionId) {
        filteredLogs = filteredLogs.filter(log => log.sessionId === validatedQuery.sessionId);
      }
      if (validatedQuery.correlationId) {
        filteredLogs = filteredLogs.filter(log => log.correlationId === validatedQuery.correlationId);
      }
      if (validatedQuery.source) {
        filteredLogs = filteredLogs.filter(log => log.source === validatedQuery.source);
      }
      if (validatedQuery.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= validatedQuery.startTime!);
      }
      if (validatedQuery.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= validatedQuery.endTime!);
      }
      if (validatedQuery.message) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(validatedQuery.message!.toLowerCase())
        );
      }
      if (validatedQuery.tags && validatedQuery.tags.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.tags && validatedQuery.tags!.some(tag => log.tags!.includes(tag))
        );
      }

      // Ordenar
      const sortField = validatedQuery.sort || 'timestamp';
      const order = validatedQuery.order || 'desc';
      
      filteredLogs.sort((a, b) => {
        const aValue = a[sortField as keyof LogEntry];
        const bValue = b[sortField as keyof LogEntry];
        
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });

      // Paginación
      const offset = validatedQuery.offset || 0;
      const limit = validatedQuery.limit || 100;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      const took = Date.now() - startTime;

      return {
        logs: paginatedLogs,
        total: filteredLogs.length,
        took
      };

    } catch (error) {
      logger.error('Error searching logs', { error });
      throw error;
    }
  }

  async aggregateLogs(aggregation: LogAggregation): Promise<Record<string, any>> {
    try {
      const validatedAggregation = LogAggregationSchema.parse(aggregation);
      
      // Obtener logs en el rango de tiempo
      const logs = Array.from(this.logs.values()).filter(log => 
        log.timestamp >= validatedAggregation.timeRange.start &&
        log.timestamp <= validatedAggregation.timeRange.end
      );

      // Aplicar filtros adicionales
      let filteredLogs = logs;
      if (validatedAggregation.filters) {
        Object.entries(validatedAggregation.filters).forEach(([key, value]) => {
          filteredLogs = filteredLogs.filter(log => 
            (log as any)[key] === value
          );
        });
      }

      // Agrupar por campos especificados
      const groups: Record<string, any> = {};
      
      validatedAggregation.groupBy.forEach(field => {
        groups[field] = {};
        
        filteredLogs.forEach(log => {
          const value = (log as any)[field] || 'unknown';
          groups[field][value] = (groups[field][value] || 0) + 1;
        });
      });

      // Agregación temporal si se especifica
      if (validatedAggregation.interval) {
        groups.timeline = this.aggregateByTime(filteredLogs, validatedAggregation.interval);
      }

      return groups;

    } catch (error) {
      logger.error('Error aggregating logs', { error });
      throw error;
    }
  }

  private aggregateByTime(logs: LogEntry[], interval: string): Array<{ timestamp: Date; count: number }> {
    const intervalMs = this.getIntervalMs(interval);
    const timeline: Array<{ timestamp: Date; count: number }> = [];
    
    // Agrupar logs por intervalos de tiempo
    const timeGroups: Map<number, number> = new Map();
    
    logs.forEach(log => {
      const intervalStart = Math.floor(log.timestamp.getTime() / intervalMs) * intervalMs;
      timeGroups.set(intervalStart, (timeGroups.get(intervalStart) || 0) + 1);
    });

    // Convertir a array ordenado
    Array.from(timeGroups.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([timestamp, count]) => {
        timeline.push({
          timestamp: new Date(timestamp),
          count
        });
      });

    return timeline;
  }

  private getIntervalMs(interval: string): number {
    switch (interval) {
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }

  // ===== GESTIÓN DE REGLAS DE ALERTAS =====

  async createAlertRule(rule: Omit<LogAlertRule, 'id'>): Promise<LogAlertRule> {
    const newRule: LogAlertRule = {
      ...rule,
      id: `alert-rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.alertRules.set(newRule.id, newRule);
    logger.info(`Log alert rule created: ${newRule.id}`);

    return newRule;
  }

  async getAlertRule(ruleId: string): Promise<LogAlertRule | null> {
    return this.alertRules.get(ruleId) || null;
  }

  async listAlertRules(): Promise<LogAlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  async updateAlertRule(ruleId: string, updates: Partial<LogAlertRule>): Promise<LogAlertRule | null> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    logger.info(`Log alert rule updated: ${ruleId}`);

    return updatedRule;
  }

  async deleteAlertRule(ruleId: string): Promise<boolean> {
    const deleted = this.alertRules.delete(ruleId);
    if (deleted) {
      logger.info(`Log alert rule deleted: ${ruleId}`);
    }
    return deleted;
  }

  private async evaluateAlertRules(logEntry: LogEntry): Promise<void> {
    for (const rule of Array.from(this.alertRules.values())) {
      if (!rule.enabled) continue;

      try {
        // Verificar si el log coincide con el patrón
        const matches = this.matchesPattern(logEntry, rule);
        if (matches) {
          await this.triggerAlert(rule, logEntry);
        }
      } catch (error) {
        logger.error(`Error evaluating alert rule ${rule.id}`, { error });
      }
    }
  }

  private matchesPattern(logEntry: LogEntry, rule: LogAlertRule): boolean {
    // Verificar nivel
    if (rule.level && logEntry.level !== rule.level) {
      return false;
    }

    // Verificar servicio
    if (rule.service && logEntry.service !== rule.service) {
      return false;
    }

    // Verificar ambiente
    if (rule.environment && logEntry.environment !== rule.environment) {
      return false;
    }

    // Verificar patrón regex en el mensaje
    try {
      const regex = new RegExp(rule.pattern, 'i');
      return regex.test(logEntry.message);
    } catch (error) {
      logger.error(`Invalid regex pattern in rule ${rule.id}`, { error });
      return false;
    }
  }

  private async triggerAlert(rule: LogAlertRule, logEntry: LogEntry): Promise<void> {
    // En una implementación real, aquí se enviarían las alertas
    logger.info(`Alert triggered for rule ${rule.id}`);

    // Enviar notificaciones
    for (const action of rule.actions) {
      await this.sendAlertNotification(rule, logEntry, action);
    }
  }

  private async sendAlertNotification(rule: LogAlertRule, logEntry: LogEntry, action: any): Promise<void> {
    // Simular envío de notificaciones
    logger.info(`Sending ${action.type} notification for alert rule ${rule.id}`);
    
    // En una implementación real, aquí se enviarían las notificaciones reales
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // ===== GESTIÓN DE POLÍTICAS DE RETENCIÓN =====

  async createRetentionPolicy(policy: Omit<LogRetentionPolicy, 'id'>): Promise<LogRetentionPolicy> {
    const newPolicy: LogRetentionPolicy = {
      ...policy,
      id: `retention-policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.retentionPolicies.set(newPolicy.id, newPolicy);
    logger.info(`Log retention policy created: ${newPolicy.id}`);

    return newPolicy;
  }

  async getRetentionPolicy(policyId: string): Promise<LogRetentionPolicy | null> {
    return this.retentionPolicies.get(policyId) || null;
  }

  async listRetentionPolicies(): Promise<LogRetentionPolicy[]> {
    return Array.from(this.retentionPolicies.values());
  }

  async updateRetentionPolicy(policyId: string, updates: Partial<LogRetentionPolicy>): Promise<LogRetentionPolicy | null> {
    const policy = this.retentionPolicies.get(policyId);
    if (!policy) return null;

    const updatedPolicy = { ...policy, ...updates };
    this.retentionPolicies.set(policyId, updatedPolicy);
    logger.info(`Log retention policy updated: ${policyId}`);

    return updatedPolicy;
  }

  async deleteRetentionPolicy(policyId: string): Promise<boolean> {
    const deleted = this.retentionPolicies.delete(policyId);
    if (deleted) {
      logger.info(`Log retention policy deleted: ${policyId}`);
    }
    return deleted;
  }

  async applyRetentionPolicies(): Promise<{ deleted: number; archived: number; compressed: number }> {
    let deleted = 0;
    let archived = 0;
    let compressed = 0;

    for (const policy of Array.from(this.retentionPolicies.values())) {
      if (!policy.enabled) continue;

      try {
        const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
        
        // Obtener logs que cumplen los criterios de la política
        const logsToProcess = Array.from(this.logs.values()).filter(log => {
          if (log.timestamp > cutoffDate) return false;
          
          if (policy.service && log.service !== policy.service) return false;
          if (policy.environment && log.environment !== policy.environment) return false;
          if (policy.level && log.level !== policy.level) return false;
          
          return true;
        });

        // Aplicar acciones según la política
        for (const log of logsToProcess) {
          if (policy.archiveEnabled) {
            await this.archiveLog(log);
            archived++;
          } else if (policy.compressionEnabled) {
            await this.compressLog(log);
            compressed++;
          } else {
            this.logs.delete(log.id);
            deleted++;
          }
        }

      } catch (error) {
        logger.error(`Error applying retention policy ${policy.id}`, { error });
      }
    }

    return { deleted, archived, compressed };
  }

  private async archiveLog(logEntry: LogEntry): Promise<void> {
    // Simular archivado de logs
    logger.info(`Archiving log entry: ${logEntry.id}`);
  }

  private async compressLog(logEntry: LogEntry): Promise<void> {
    // Simular compresión de logs
    logger.info(`Compressing log entry: ${logEntry.id}`);
  }

  // ===== INTEGRACIÓN CON SERVICIOS EXTERNOS =====

  private async sendToApplicationInsights(logEntry: LogEntry): Promise<void> {
    try {
      if (logEntry.level === 'ERROR' || logEntry.level === 'FATAL') {
        applicationInsights.trackException({
          exception: new Error(logEntry.message),
          properties: {
            service: logEntry.service,
            environment: logEntry.environment,
            userId: logEntry.userId,
            organizationId: logEntry.organizationId,
            requestId: logEntry.requestId,
            correlationId: logEntry.correlationId,
            ...logEntry.context,
            ...logEntry.metadata
          }
        });
      } else {
        applicationInsights.trackTrace({
          message: logEntry.message,
          severity: logEntry.level,
          properties: {
            service: logEntry.service,
            environment: logEntry.environment,
            userId: logEntry.userId,
            organizationId: logEntry.organizationId,
            requestId: logEntry.requestId,
            correlationId: logEntry.correlationId,
            ...logEntry.context,
            ...logEntry.metadata
          }
        });
      }
    } catch (error) {
      logger.error('Error sending to Application Insights', { error });
    }
  }

  private async sendToElasticsearch(logEntry: LogEntry): Promise<void> {
    try {
      await elasticsearch.index({
        index: `logs-${logEntry.service}-${new Date().toISOString().split('T')[0]}`,
        body: {
          '@timestamp': logEntry.timestamp.toISOString(),
          level: logEntry.level,
          message: logEntry.message,
          service: logEntry.service,
          environment: logEntry.environment,
          context: logEntry.context,
          metadata: logEntry.metadata,
          userId: logEntry.userId,
          organizationId: logEntry.organizationId,
          requestId: logEntry.requestId,
          sessionId: logEntry.sessionId,
          correlationId: logEntry.correlationId,
          tags: logEntry.tags,
          source: logEntry.source,
          hostname: logEntry.hostname,
          pid: logEntry.pid,
          version: logEntry.version
        }
      });
    } catch (error) {
      logger.error('Error sending to Elasticsearch', { error });
    }
  }

  private async writeToFile(logEntry: LogEntry): Promise<void> {
    try {
      const logDir = '/app/logs';
      const logFile = join(logDir, `${logEntry.service}-${new Date().toISOString().split('T')[0]}.log`);
      
      // Crear directorio si no existe
      await fs.mkdir(dirname(logFile), { recursive: true });
      
      // Escribir log al archivo
      const logLine = JSON.stringify({
        '@timestamp': logEntry.timestamp.toISOString(),
        level: logEntry.level,
        message: logEntry.message,
        service: logEntry.service,
        environment: logEntry.environment,
        context: logEntry.context,
        metadata: logEntry.metadata,
        userId: logEntry.userId,
        organizationId: logEntry.organizationId,
        requestId: logEntry.requestId,
        sessionId: logEntry.sessionId,
        correlationId: logEntry.correlationId,
        tags: logEntry.tags,
        source: logEntry.source,
        hostname: logEntry.hostname,
        pid: logEntry.pid,
        version: logEntry.version
      }) + '\n';

      await fs.appendFile(logFile, logLine);
    } catch (error) {
      logger.error('Error writing to file', { error });
    }
  }

  // ===== PROCESAMIENTO DE LOGS =====

  private async processLogEntry(logEntry: LogEntry): Promise<void> {
    // Procesar entrada de log en tiempo real
    logger.info(`Processing log entry: ${logEntry.id}`);
  }

  private startLogProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      try {
        if (this.logBuffer.length > 0) {
          const batch = this.logBuffer.splice(0, this.config.batchSize);
          await this.processBatch(batch);
        }
      } catch (error) {
        logger.error('Error in log processing interval', { error });
      }
    }, this.config.flushInterval * 1000);

    logger.info('Log processing started');
  }

  private async processBatch(batch: LogEntry[]): Promise<void> {
    // Procesar lote de logs
    logger.info(`Processing batch of ${batch.length} logs`);
  }

  // ===== ESTADÍSTICAS Y REPORTES =====

  async getLogStatistics(): Promise<LogStatistics> {
    const logs = Array.from(this.logs.values());
    
    const logsByLevel = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const logsByService = logs.reduce((acc, log) => {
      acc[log.service] = (acc[log.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const logsByEnvironment = logs.reduce((acc, log) => {
      acc[log.environment] = (acc[log.environment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageLogSize = logs.length > 0 
      ? logs.reduce((sum, log) => sum + JSON.stringify(log).length, 0) / logs.length 
      : 0;

    const errorLogs = logs.filter(log => log.level === 'ERROR' || log.level === 'FATAL');
    const errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;

    const topErrors = errorLogs.reduce((acc, log) => {
      const existing = acc.find(item => item.message === log.message);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ message: log.message, count: 1 });
      }
      return acc;
    }, [] as Array<{ message: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

    const logVolume = this.aggregateByTime(logs, '1h');

    const lastProcessed = logs.length > 0 
      ? new Date(Math.max(...logs.map(log => log.timestamp.getTime())))
      : null;

    return {
      totalLogs: logs.length,
      logsByLevel,
      logsByService,
      logsByEnvironment,
      averageLogSize,
      errorRate,
      topErrors,
      logVolume,
      lastProcessed
    };
  }

  async generateLogReport(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    generatedAt: Date;
    summary: any;
    topErrors: Array<{ message: string; count: number }>;
    serviceBreakdown: Record<string, number>;
    levelBreakdown: Record<string, number>;
    recommendations: string[];
  }> {
    const now = new Date();
    const periodMs = this.getIntervalMs(period === 'hourly' ? '1h' : period === 'daily' ? '24h' : period === 'weekly' ? '7d' : '30d');
    const startTime = new Date(now.getTime() - periodMs);

    const logs = Array.from(this.logs.values()).filter(log => log.timestamp >= startTime);

    const summary = {
      totalLogs: logs.length,
      errorLogs: logs.filter(log => log.level === 'ERROR' || log.level === 'FATAL').length,
      warningLogs: logs.filter(log => log.level === 'WARN').length,
      infoLogs: logs.filter(log => log.level === 'INFO').length,
      debugLogs: logs.filter(log => log.level === 'DEBUG').length,
      uniqueServices: new Set(logs.map(log => log.service)).size,
      uniqueUsers: new Set(logs.map(log => log.userId).filter(Boolean)).size
    };

    const topErrors = logs
      .filter(log => log.level === 'ERROR' || log.level === 'FATAL')
      .reduce((acc, log) => {
        const existing = acc.find(item => item.message === log.message);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ message: log.message, count: 1 });
        }
        return acc;
      }, [] as Array<{ message: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const serviceBreakdown = logs.reduce((acc, log) => {
      acc[log.service] = (acc[log.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const levelBreakdown = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recommendations = this.generateLogRecommendations(summary, topErrors, serviceBreakdown);

    return {
      period,
      generatedAt: now,
      summary,
      topErrors,
      serviceBreakdown,
      levelBreakdown,
      recommendations
    };
  }

  private generateLogRecommendations(summary: any, topErrors: any[], serviceBreakdown: Record<string, number>): string[] {
    const recommendations: string[] = [];

    if (summary.errorLogs > 0) {
      recommendations.push(`Total of ${summary.errorLogs} error logs in this period. Review error patterns and implement fixes.`);
    }

    if (topErrors.length > 0) {
      recommendations.push(`Top error: "${topErrors[0].message}" occurred ${topErrors[0].count} times. Consider implementing specific error handling.`);
    }

    if (summary.errorLogs / summary.totalLogs > 0.05) {
      recommendations.push('Error rate is above 5%. Review system stability and error handling.');
    }

    if (summary.uniqueServices < 3) {
      recommendations.push('Consider adding more services to improve system observability.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Logging system is performing well. Continue monitoring.');
    }

    return recommendations;
  }

  // ===== CONFIGURACIÓN =====

  async updateConfig(updates: Partial<CentralizedLoggingConfig>): Promise<CentralizedLoggingConfig> {
    this.config = { ...this.config, ...updates };
    
    // Reiniciar procesamiento si cambió la configuración
    if (updates.realTimeProcessing !== undefined || updates.flushInterval !== undefined) {
      this.startLogProcessing();
    }

    logger.info('Logging configuration updated');
    return this.config;
  }

  async getConfig(): Promise<CentralizedLoggingConfig> {
    return { ...this.config };
  }

  // ===== INICIALIZACIÓN =====

  private initializeDefaultRules(): void {
    const defaultRules: LogAlertRule[] = [
      {
        id: 'rule-1',
        name: 'High Error Rate',
        description: 'Alert when error rate is high',
        pattern: 'ERROR|FATAL',
        level: 'ERROR',
        threshold: 10,
        window: 300, // 5 minutos
        enabled: true,
        actions: [
          {
            type: 'EMAIL',
            config: { recipients: ['admin@econeura.com'] }
          },
          {
            type: 'SLACK',
            config: { webhook: 'https://hooks.slack.com/services/...' }
          }
        ]
      },
      {
        id: 'rule-2',
        name: 'Database Connection Errors',
        description: 'Alert on database connection errors',
        pattern: 'database.*connection.*error|connection.*timeout',
        threshold: 5,
        window: 60, // 1 minuto
        enabled: true,
        actions: [
          {
            type: 'EMAIL',
            config: { recipients: ['dba@econeura.com'] }
          }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  private initializeDefaultRetentionPolicies(): void {
    const defaultPolicies: LogRetentionPolicy[] = [
      {
        id: 'policy-1',
        name: 'Default Retention Policy',
        description: 'Default log retention policy',
        retentionDays: 30,
        enabled: true,
        compressionEnabled: true,
        archiveEnabled: false
      },
      {
        id: 'policy-2',
        name: 'Error Logs Retention',
        description: 'Extended retention for error logs',
        level: 'ERROR',
        retentionDays: 90,
        enabled: true,
        compressionEnabled: true,
        archiveEnabled: true
      }
    ];

    defaultPolicies.forEach(policy => {
      this.retentionPolicies.set(policy.id, policy);
    });
  }

  // ===== LIMPIEZA =====

  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Flush remaining logs
    if (this.logBuffer.length > 0) {
      await this.processBatch(this.logBuffer);
    }

    // Flush Application Insights
    if (this.config.applicationInsightsEnabled) {
      await applicationInsights.flush();
    }

    logger.info('Centralized logging service cleaned up');
  }
}

export default CentralizedLoggingService;
