import { Router, Request, Response } from 'express';
import { z } from 'zod';

import AdvancedMetricsAlertsService, { 
  MetricsAlertsConfig 
} from '../lib/advanced-metrics-alerts.service.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// Configuración por defecto
const defaultConfig: MetricsAlertsConfig = {
  prometheusEnabled: true,
  alertingEnabled: true,
  defaultCooldown: 300, // 5 minutos
  maxAlertsPerRule: 100,
  retentionDays: 30,
  notificationChannels: ['email', 'slack', 'webhook', 'sms'],
  slaMonitoring: true,
  trendAnalysis: true
};

// Inicializar servicio
const metricsAlertsService = new AdvancedMetricsAlertsService(defaultConfig);

// Schemas de validación para requests
const CreateAlertRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  metric: z.string().min(1),
  condition: z.object({
    operator: z.enum(['gt', 'lt', 'gte', 'lte', 'eq', 'ne']),
    threshold: z.number(),
    window: z.number().min(1),
    aggregation: z.enum(['avg', 'sum', 'min', 'max', 'count'])
  }),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  enabled: z.boolean().optional(),
  cooldown: z.number().min(0).optional(),
  labels: z.record(z.string()).optional(),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'SLACK', 'WEBHOOK', 'SMS']),
    config: z.record(z.any())
  }))
});

const CreateSLASchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  metric: z.string().min(1),
  target: z.number().min(0).max(100),
  window: z.number().min(1),
  enabled: z.boolean().optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
  labels: z.record(z.string()).optional()
});

const UpdateConfigSchema = z.object({
  prometheusEnabled: z.boolean().optional(),
  alertingEnabled: z.boolean().optional(),
  defaultCooldown: z.number().min(0).optional(),
  maxAlertsPerRule: z.number().min(1).optional(),
  retentionDays: z.number().min(1).optional(),
  notificationChannels: z.array(z.string()).optional(),
  slaMonitoring: z.boolean().optional(),
  trendAnalysis: z.boolean().optional()
});

// ===== MÉTRICAS =====

// GET /api/advanced-metrics-alerts/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { name, type, startTime, endTime } = req.query;
    
    const filter: any = {};
    if (name) filter.name = name as string;
    if (type) filter.type = type as string;
    if (startTime && endTime) {
      filter.timeRange = {
        start: new Date(startTime as string),
        end: new Date(endTime as string)
      };
    }

    const metrics = await metricsAlertsService.getMetrics(filter);
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error) {
    logger.error('Error getting metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-metrics-alerts/metrics/:name
router.get('/metrics/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const metrics = await metricsAlertsService.getMetricByName(name);
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error) {
    logger.error('Error getting metric by name', { error, metricName: req.params.name });
    res.status(500).json({
      success: false,
      error: 'Failed to get metric by name',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-metrics-alerts/metrics/:name/trends
router.get('/metrics/:name/trends', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { period = '24h' } = req.query;
    
    const trends = await metricsAlertsService.getMetricTrends(name, period as string);
    
    res.json({
      success: true,
      data: trends,
      count: trends.length
    });
  } catch (error) {
    logger.error('Error getting metric trends', { error, metricName: req.params.name });
    res.status(500).json({
      success: false,
      error: 'Failed to get metric trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-metrics-alerts/metrics/collect
router.post('/metrics/collect', async (req: Request, res: Response) => {
  try {
    const metrics = await metricsAlertsService.collectMetrics();
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
      message: 'Metrics collected successfully'
    });
  } catch (error) {
    logger.error('Error collecting metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== REGLAS DE ALERTAS =====

// GET /api/advanced-metrics-alerts/alert-rules
router.get('/alert-rules', async (req: Request, res: Response) => {
  try {
    const rules = await metricsAlertsService.listAlertRules();
    
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

// GET /api/advanced-metrics-alerts/alert-rules/:id
router.get('/alert-rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await metricsAlertsService.getAlertRule(id);
    
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

// POST /api/advanced-metrics-alerts/alert-rules
router.post('/alert-rules', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAlertRuleSchema.parse(req.body);
    
    const rule = await metricsAlertsService.createAlertRule({
      name: validatedData.name,
      description: validatedData.description,
      metric: validatedData.metric,
      condition: validatedData.condition,
      severity: validatedData.severity,
      enabled: validatedData.enabled ?? true,
      cooldown: validatedData.cooldown ?? defaultConfig.defaultCooldown,
      labels: validatedData.labels,
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

// PUT /api/advanced-metrics-alerts/alert-rules/:id
router.put('/alert-rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedRule = await metricsAlertsService.updateAlertRule(id, updates);
    
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

// DELETE /api/advanced-metrics-alerts/alert-rules/:id
router.delete('/alert-rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await metricsAlertsService.deleteAlertRule(id);
    
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

// POST /api/advanced-metrics-alerts/alert-rules/evaluate
router.post('/alert-rules/evaluate', async (req: Request, res: Response) => {
  try {
    const alerts = await metricsAlertsService.evaluateAlertRules();
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      message: 'Alert rules evaluated successfully'
    });
  } catch (error) {
    logger.error('Error evaluating alert rules', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate alert rules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== ALERTAS =====

// GET /api/advanced-metrics-alerts/alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { status, severity, ruleId } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status as string;
    if (severity) filter.severity = severity as string;
    if (ruleId) filter.ruleId = ruleId as string;

    const alerts = await metricsAlertsService.getAlerts(filter);
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    logger.error('Error getting alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-metrics-alerts/alerts/:id
router.get('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alerts = await metricsAlertsService.getAlerts();
    const alert = alerts.find(a => a.id === id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error getting alert', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-metrics-alerts/alerts/:id/acknowledge
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy } = req.body;
    
    if (!acknowledgedBy) {
      return res.status(400).json({
        success: false,
        error: 'acknowledgedBy is required'
      });
    }

    const alert = await metricsAlertsService.acknowledgeAlert(id, acknowledgedBy);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    logger.error('Error acknowledging alert', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-metrics-alerts/alerts/:id/resolve
router.post('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await metricsAlertsService.resolveAlert(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    logger.error('Error resolving alert', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== SLAs =====

// GET /api/advanced-metrics-alerts/slas
router.get('/slas', async (req: Request, res: Response) => {
  try {
    const slas = await metricsAlertsService.listSLAs();
    
    res.json({
      success: true,
      data: slas,
      count: slas.length
    });
  } catch (error) {
    logger.error('Error listing SLAs', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list SLAs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-metrics-alerts/slas/:id
router.get('/slas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sla = await metricsAlertsService.getSLA(id);
    
    if (!sla) {
      return res.status(404).json({
        success: false,
        error: 'SLA not found'
      });
    }

    res.json({
      success: true,
      data: sla
    });
  } catch (error) {
    logger.error('Error getting SLA', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get SLA',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-metrics-alerts/slas
router.post('/slas', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateSLASchema.parse(req.body);
    
    const sla = await metricsAlertsService.createSLA({
      name: validatedData.name,
      description: validatedData.description,
      metric: validatedData.metric,
      target: validatedData.target,
      window: validatedData.window,
      enabled: validatedData.enabled ?? true,
      alertThreshold: validatedData.alertThreshold,
      labels: validatedData.labels
    });

    res.status(201).json({
      success: true,
      data: sla,
      message: 'SLA created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating SLA', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create SLA',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-metrics-alerts/slas/:id/compliance
router.get('/slas/:id/compliance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.query;
    
    const timeRange = startTime && endTime ? {
      start: new Date(startTime as string),
      end: new Date(endTime as string)
    } : undefined;

    const compliance = await metricsAlertsService.calculateSLACompliance(id, timeRange);
    
    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    logger.error('Error calculating SLA compliance', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate SLA compliance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== ESTADÍSTICAS Y REPORTES =====

// GET /api/advanced-metrics-alerts/statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await metricsAlertsService.getMetricsStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting metrics statistics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-metrics-alerts/reports/:period
router.get('/reports/:period', async (req: Request, res: Response) => {
  try {
    const { period } = req.params;
    
    if (!['hourly', 'daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be: hourly, daily, weekly, or monthly'
      });
    }

    const report = await metricsAlertsService.generateMetricsReport(period as 'hourly' | 'daily' | 'weekly' | 'monthly');
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating metrics report', { error, period: req.params.period });
    res.status(500).json({
      success: false,
      error: 'Failed to generate metrics report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== CONFIGURACIÓN =====

// GET /api/advanced-metrics-alerts/config
router.get('/config', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: defaultConfig
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

// PUT /api/advanced-metrics-alerts/config
router.put('/config', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateConfigSchema.parse(req.body);
    
    // Actualizar configuración (en una implementación real, esto se persistiría)
    Object.assign(defaultConfig, validatedData);
    
    res.json({
      success: true,
      data: defaultConfig,
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

// GET /api/advanced-metrics-alerts/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const statistics = await metricsAlertsService.getMetricsStatistics();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        metrics: statistics.totalMetrics > 0 ? 'operational' : 'no_metrics',
        alerting: statistics.enabledRules > 0 ? 'operational' : 'no_rules',
        sla: statistics.totalSLAs > 0 ? 'operational' : 'no_slas'
      },
      statistics: {
        totalMetrics: statistics.totalMetrics,
        activeAlerts: statistics.activeAlerts,
        enabledRules: statistics.enabledRules,
        averageCompliance: statistics.averageCompliance,
        lastCollection: statistics.lastCollection
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

export default router;
