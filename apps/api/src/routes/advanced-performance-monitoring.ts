import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { advancedPerformanceMonitoringService } from '../lib/advanced-performance-monitoring.service.js';

const router: Router = Router();

// Validation schemas
const createMetricSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['counter', 'gauge', 'histogram', 'summary']),
  value: z.number(),
  labels: z.record(z.string()),
  metadata: z.record(z.any()).optional()
});

const createAlertSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  condition: z.object({
    metric: z.string().min(1),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
    threshold: z.number(),
    timeWindow: z.number().positive()
  }),
  enabled: z.boolean(),
  actions: z.array(z.object({
    type: z.enum(['email', 'webhook', 'slack', 'pagerduty']),
    config: z.record(z.any())
  }))
});

const createDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  widgets: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(['chart', 'gauge', 'table', 'alert']),
    title: z.string().min(1),
    config: z.record(z.any()),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    })
  })),
  isPublic: z.boolean()
});

const createReportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  metrics: z.array(z.string()),
  filters: z.record(z.any()),
  schedule: z.object({
    enabled: z.boolean(),
    cron: z.string(),
    timezone: z.string()
  }).optional(),
  recipients: z.array(z.string()),
  format: z.enum(['pdf', 'html', 'json', 'csv'])
});

// Metrics endpoints
router.post('/metrics', async (req, res) => {
  try {
    const validatedData = createMetricSchema.parse(req.body);
    const metric = await advancedPerformanceMonitoringService.recordMetric(validatedData);
    
    res.status(201).json({
      success: true,
      data: metric
    });
  } catch (error) {
    logger.error('Error creating metric:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid metric data'
    });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const filters = {
      name: req.query.name as string,
      type: req.query.type as string,
      startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const metrics = await advancedPerformanceMonitoringService.getMetrics(filters);
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

// Alerts endpoints
router.post('/alerts', async (req, res) => {
  try {
    const validatedData = createAlertSchema.parse(req.body);
    const alert = await advancedPerformanceMonitoringService.createAlert(validatedData);
    
    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid alert data'
    });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await advancedPerformanceMonitoringService.getAlerts();
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts'
    });
  }
});

router.put('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const alert = await advancedPerformanceMonitoringService.updateAlert(id, updates);
    
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
    logger.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert'
    });
  }
});

router.delete('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await advancedPerformanceMonitoringService.deleteAlert(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert'
    });
  }
});

// Dashboards endpoints
router.post('/dashboards', async (req, res) => {
  try {
    const validatedData = createDashboardSchema.parse(req.body);
    const dashboard = await advancedPerformanceMonitoringService.createDashboard(validatedData);
    
    res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error creating dashboard:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid dashboard data'
    });
  }
});

router.get('/dashboards', async (req, res) => {
  try {
    const dashboards = await advancedPerformanceMonitoringService.getDashboards();
    
    res.json({
      success: true,
      data: dashboards,
      count: dashboards.length
    });
  } catch (error) {
    logger.error('Error getting dashboards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboards'
    });
  }
});

router.put('/dashboards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const dashboard = await advancedPerformanceMonitoringService.updateDashboard(id, updates);
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error updating dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dashboard'
    });
  }
});

// Reports endpoints
router.post('/reports', async (req, res) => {
  try {
    const validatedData = createReportSchema.parse(req.body);
    const report = await advancedPerformanceMonitoringService.createReport(validatedData);
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid report data'
    });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await advancedPerformanceMonitoringService.getReports();
    
    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    logger.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports'
    });
  }
});

router.post('/reports/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await advancedPerformanceMonitoringService.generateReport(id);
    
    res.setHeader('Content-Type', result.format === 'json' ? 'application/json' : 
                  result.format === 'csv' ? 'text/csv' : 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${result.format}"`);
    
    res.send(result.content);
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report'
    });
  }
});

// Baselines endpoints
router.get('/baselines', async (req, res) => {
  try {
    const baselines = await advancedPerformanceMonitoringService.getBaselines();
    
    res.json({
      success: true,
      data: baselines,
      count: baselines.length
    });
  } catch (error) {
    logger.error('Error getting baselines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve baselines'
    });
  }
});

router.post('/baselines/calculate', async (req, res) => {
  try {
    await advancedPerformanceMonitoringService.calculateBaselines();
    
    res.json({
      success: true,
      message: 'Baselines calculation started'
    });
  } catch (error) {
    logger.error('Error calculating baselines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate baselines'
    });
  }
});

// Anomalies endpoints
router.get('/anomalies', async (req, res) => {
  try {
    const filters = {
      severity: req.query.severity as string,
      type: req.query.type as string,
      resolved: req.query.resolved ? req.query.resolved === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const anomalies = await advancedPerformanceMonitoringService.getAnomalies(filters);
    
    res.json({
      success: true,
      data: anomalies,
      count: anomalies.length
    });
  } catch (error) {
    logger.error('Error getting anomalies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve anomalies'
    });
  }
});

router.post('/anomalies/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const resolved = await advancedPerformanceMonitoringService.resolveAnomaly(id);
    
    if (!resolved) {
      return res.status(404).json({
        success: false,
        error: 'Anomaly not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Anomaly resolved successfully'
    });
  } catch (error) {
    logger.error('Error resolving anomaly:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve anomaly'
    });
  }
});

// Statistics endpoint
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await advancedPerformanceMonitoringService.getStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const statistics = await advancedPerformanceMonitoringService.getStatistics();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        totalMetrics: statistics.totalMetrics,
        activeAlerts: statistics.activeAlerts,
        unresolvedAnomalies: statistics.unresolvedAnomalies
      }
    });
  } catch (error) {
    logger.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

export default router;
