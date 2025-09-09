import { Router, Request, Response } from 'express';
import { z } from 'zod';
import CentralizedLoggingService, {
  LogEntry,
  LogQuery,
  LogAggregation,
  LogAlertRule,
  LogRetentionPolicy,
  CentralizedLoggingConfig
} from '../lib/centralized-logging.service.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// Configuración por defecto
const defaultConfig: CentralizedLoggingConfig = {
  elasticsearchEnabled: true,
  applicationInsightsEnabled: true,
  fileLoggingEnabled: true,
  consoleLoggingEnabled: true,
  logLevel: 'info',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 10,
  retentionDays: 30,
  compressionEnabled: true,
  archiveEnabled: false,
  alertingEnabled: true,
  realTimeProcessing: true,
  batchSize: 100,
  flushInterval: 5 // segundos
};

// Inicializar servicio
const loggingService = new CentralizedLoggingService(defaultConfig);

// Schemas de validación para requests
const WriteLogSchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']),
  message: z.string().min(1),
  service: z.string().min(1),
  environment: z.string().min(1),
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
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  message: z.string().optional(),
  limit: z.number().min(1).max(10000).optional(),
  offset: z.number().min(0).optional(),
  sort: z.enum(['timestamp', 'level', 'service']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

const LogAggregationSchema = z.object({
  groupBy: z.array(z.enum(['level', 'service', 'environment', 'userId', 'organizationId', 'source', 'tags'])),
  timeRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  interval: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).optional(),
  filters: z.record(z.any()).optional()
});

const CreateAlertRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  pattern: z.string().min(1),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  service: z.string().optional(),
  environment: z.string().optional(),
  threshold: z.number().min(1),
  window: z.number().min(1),
  enabled: z.boolean().optional(),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'SLACK', 'WEBHOOK', 'SMS']),
    config: z.record(z.any())
  }))
});

const CreateRetentionPolicySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  service: z.string().optional(),
  environment: z.string().optional(),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  retentionDays: z.number().min(1),
  enabled: z.boolean().optional(),
  compressionEnabled: z.boolean().optional(),
  archiveEnabled: z.boolean().optional()
});

const UpdateConfigSchema = z.object({
  elasticsearchEnabled: z.boolean().optional(),
  applicationInsightsEnabled: z.boolean().optional(),
  fileLoggingEnabled: z.boolean().optional(),
  consoleLoggingEnabled: z.boolean().optional(),
  logLevel: z.string().optional(),
  maxLogSize: z.number().min(1024).optional(),
  maxLogFiles: z.number().min(1).optional(),
  retentionDays: z.number().min(1).optional(),
  compressionEnabled: z.boolean().optional(),
  archiveEnabled: z.boolean().optional(),
  alertingEnabled: z.boolean().optional(),
  realTimeProcessing: z.boolean().optional(),
  batchSize: z.number().min(1).optional(),
  flushInterval: z.number().min(1).optional()
});

// ===== GESTIÓN DE LOGS =====

// POST /api/centralized-logging/logs
router.post('/logs', async (req: Request, res: Response) => {
  try {
    const validatedData = WriteLogSchema.parse(req.body);

    const logEntry = await loggingService.writeLog(validatedData);

    res.status(201).json({
      success: true,
      data: logEntry,
      message: 'Log entry created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error writing log entry', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to write log entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/centralized-logging/logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const query: LogQuery = {
      ...req.query,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const validatedQuery = LogQuerySchema.parse(query);
    const result = await loggingService.searchLogs(validatedQuery as any);

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      took: result.took,
      count: result.logs.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error searching logs', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to search logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/centralized-logging/logs/aggregate
router.post('/logs/aggregate', async (req: Request, res: Response) => {
  try {
    const aggregation: LogAggregation = {
      ...req.body,
      timeRange: {
        start: new Date(req.body.timeRange.start),
        end: new Date(req.body.timeRange.end)
      }
    };

    const validatedAggregation = LogAggregationSchema.parse(aggregation);
    const result = await loggingService.aggregateLogs(validatedAggregation as any);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error aggregating logs', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== GESTIÓN DE REGLAS DE ALERTAS =====

// GET /api/centralized-logging/alert-rules
router.get('/alert-rules', async (req: Request, res: Response) => {
  try {
    const rules = await loggingService.listAlertRules();

    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    logger.error('Error listing alert rules', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list alert rules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/centralized-logging/alert-rules/:id
router.get('/alert-rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await loggingService.getAlertRule(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Error getting alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get alert rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/centralized-logging/alert-rules
router.post('/alert-rules', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAlertRuleSchema.parse(req.body);

    const rule = await loggingService.createAlertRule({
      name: validatedData.name,
      description: validatedData.description,
      pattern: validatedData.pattern,
      level: validatedData.level,
      service: validatedData.service,
      environment: validatedData.environment,
      threshold: validatedData.threshold,
      window: validatedData.window,
      enabled: validatedData.enabled ?? true,
      actions: validatedData.actions
    });

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Alert rule created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create alert rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/centralized-logging/alert-rules/:id
router.put('/alert-rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedRule = await loggingService.updateAlertRule(id, updates);

    if (!updatedRule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      data: updatedRule,
      message: 'Alert rule updated successfully'
    });
  } catch (error) {
    logger.error('Error updating alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update alert rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/centralized-logging/alert-rules/:id
router.delete('/alert-rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await loggingService.deleteAlertRule(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert rule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== GESTIÓN DE POLÍTICAS DE RETENCIÓN =====

// GET /api/centralized-logging/retention-policies
router.get('/retention-policies', async (req: Request, res: Response) => {
  try {
    const policies = await loggingService.listRetentionPolicies();

    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    logger.error('Error listing retention policies', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list retention policies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/centralized-logging/retention-policies/:id
router.get('/retention-policies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await loggingService.getRetentionPolicy(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Retention policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    logger.error('Error getting retention policy', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get retention policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/centralized-logging/retention-policies
router.post('/retention-policies', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateRetentionPolicySchema.parse(req.body);

    const policy = await loggingService.createRetentionPolicy({
      name: validatedData.name,
      description: validatedData.description,
      service: validatedData.service,
      environment: validatedData.environment,
      level: validatedData.level,
      retentionDays: validatedData.retentionDays,
      enabled: validatedData.enabled ?? true,
      compressionEnabled: validatedData.compressionEnabled,
      archiveEnabled: validatedData.archiveEnabled
    });

    res.status(201).json({
      success: true,
      data: policy,
      message: 'Retention policy created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating retention policy', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create retention policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/centralized-logging/retention-policies/:id
router.put('/retention-policies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedPolicy = await loggingService.updateRetentionPolicy(id, updates);

    if (!updatedPolicy) {
      return res.status(404).json({
        success: false,
        error: 'Retention policy not found'
      });
    }

    res.json({
      success: true,
      data: updatedPolicy,
      message: 'Retention policy updated successfully'
    });
  } catch (error) {
    logger.error('Error updating retention policy', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update retention policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/centralized-logging/retention-policies/:id
router.delete('/retention-policies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await loggingService.deleteRetentionPolicy(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Retention policy not found'
      });
    }

    res.json({
      success: true,
      message: 'Retention policy deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting retention policy', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete retention policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/centralized-logging/retention-policies/apply
router.post('/retention-policies/apply', async (req: Request, res: Response) => {
  try {
    const result = await loggingService.applyRetentionPolicies();

    res.json({
      success: true,
      data: result,
      message: 'Retention policies applied successfully'
    });
  } catch (error) {
    logger.error('Error applying retention policies', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to apply retention policies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== ESTADÍSTICAS Y REPORTES =====

// GET /api/centralized-logging/statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await loggingService.getLogStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting log statistics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get log statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/centralized-logging/reports/:period
router.get('/reports/:period', async (req: Request, res: Response) => {
  try {
    const { period } = req.params;

    if (!['hourly', 'daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be: hourly, daily, weekly, or monthly'
      });
    }

    const report = await loggingService.generateLogReport(period as 'hourly' | 'daily' | 'weekly' | 'monthly');

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating log report', { error, period: req.params.period });
    res.status(500).json({
      success: false,
      error: 'Failed to generate log report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== CONFIGURACIÓN =====

// GET /api/centralized-logging/config
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await loggingService.getConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error getting configuration', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/centralized-logging/config
router.put('/config', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateConfigSchema.parse(req.body);

    const updatedConfig = await loggingService.updateConfig(validatedData);

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error updating configuration', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== HEALTH CHECK =====

// GET /api/centralized-logging/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const statistics = await loggingService.getLogStatistics();
    const config = await loggingService.getConfig();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        elasticsearch: config.elasticsearchEnabled ? 'enabled' : 'disabled',
        applicationInsights: config.applicationInsightsEnabled ? 'enabled' : 'disabled',
        fileLogging: config.fileLoggingEnabled ? 'enabled' : 'disabled',
        consoleLogging: config.consoleLoggingEnabled ? 'enabled' : 'disabled',
        alerting: config.alertingEnabled ? 'enabled' : 'disabled',
        realTimeProcessing: config.realTimeProcessing ? 'enabled' : 'disabled'
      },
      statistics: {
        totalLogs: statistics.totalLogs,
        errorRate: statistics.errorRate,
        lastProcessed: statistics.lastProcessed,
        logsByLevel: statistics.logsByLevel,
        logsByService: statistics.logsByService
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error checking health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== UTILIDADES =====

// POST /api/centralized-logging/logs/bulk
router.post('/logs/bulk', async (req: Request, res: Response) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        error: 'logs must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const logData of logs) {
      try {
        const validatedData = WriteLogSchema.parse(logData);
        const logEntry = await loggingService.writeLog(validatedData);
        results.push(logEntry);
      } catch (error) {
        errors.push({
          logData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        errorCount: errors.length,
        results,
        errors
      },
      message: `Processed ${results.length} logs, ${errors.length} errors`
    });
  } catch (error) {
    logger.error('Error processing bulk logs', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/centralized-logging/logs/export
router.get('/logs/export', async (req: Request, res: Response) => {
  try {
    const { format = 'json', ...queryParams } = req.query;

    const query: LogQuery = {
      ...queryParams,
      startTime: queryParams.startTime ? new Date(queryParams.startTime as string) : undefined,
      endTime: queryParams.endTime ? new Date(queryParams.endTime as string) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit as string) : 10000
    };

    const validatedQuery = LogQuerySchema.parse(query);
    const result = await loggingService.searchLogs(validatedQuery as any);

    if (format === 'csv') {
      // Convertir a CSV
      const csvHeaders = ['timestamp', 'level', 'message', 'service', 'environment', 'userId', 'organizationId'];
      const csvRows = result.logs.map(log =>
        csvHeaders.map(header => `"${(log as any)[header] || ''}"`).join(',')
      );
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
      res.send(csvContent);
    } else {
      // JSON por defecto
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
      res.json(result.logs);
    }
  } catch (error) {
    logger.error('Error exporting logs', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to export logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
