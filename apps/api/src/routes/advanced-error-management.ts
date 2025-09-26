import { Router } from 'express';
import { z } from 'zod';

import { advancedErrorManagementService } from '../lib/advanced-error-management.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const advancedErrorManagementRouter = Router();

// Validation schemas
const GetErrorsSchema = z.object({
  organizationId: z.string().min(1),
  service: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.enum(['application', 'database', 'network', 'authentication', 'authorization', 'validation', 'external', 'system']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateErrorSchema = z.object({
  organizationId: z.string().min(1),
  service: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
  errorType: z.string().min(1),
  errorMessage: z.string().min(1),
  stackTrace: z.string().optional(),
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    requestId: z.string().optional(),
    endpoint: z.string().optional(),
    method: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    timestamp: z.string().datetime(),
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['application', 'database', 'network', 'authentication', 'authorization', 'validation', 'external', 'system']),
  impact: z.object({
    affectedUsers: z.coerce.number().int().min(0),
    businessImpact: z.enum(['low', 'medium', 'high', 'critical']),
    revenueImpact: z.coerce.number().min(0).optional(),
    slaImpact: z.coerce.boolean().optional(),
  }),
  performance: z.object({
    responseTime: z.coerce.number().positive().optional(),
    memoryUsage: z.coerce.number().positive().optional(),
    cpuUsage: z.coerce.number().positive().optional(),
    databaseQueries: z.coerce.number().int().min(0).optional(),
    cacheHitRate: z.coerce.number().min(0).max(100).optional(),
  }).optional(),
  resolution: z.object({
    status: z.enum(['open', 'investigating', 'resolved', 'closed']).default('open'),
    assignedTo: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    estimatedResolution: z.string().datetime().optional(),
    actualResolution: z.string().datetime().optional(),
    resolutionNotes: z.string().optional(),
  }).optional(),
  metadata: z.object({
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({}),
    relatedErrors: z.array(z.string()).default([]),
    escalationLevel: z.coerce.number().int().min(0).default(0),
  }).optional(),
});

const GetPatternsSchema = z.object({
  organizationId: z.string().min(1),
  enabled: z.coerce.boolean().optional(),
  actionType: z.enum(['alert', 'escalate', 'auto_resolve', 'create_ticket', 'notify_team']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreatePatternSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  pattern: z.object({
    errorType: z.string().optional(),
    errorMessage: z.string().optional(),
    service: z.string().optional(),
    category: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string().min(1),
      operator: z.enum(['equals', 'contains', 'regex', 'starts_with', 'ends_with', 'greater_than', 'less_than']),
      value: z.union([z.string(), z.number()]),
    })).min(1),
  }),
  action: z.object({
    type: z.enum(['alert', 'escalate', 'auto_resolve', 'create_ticket', 'notify_team']),
    config: z.object({
      alertChannels: z.array(z.string()).optional(),
      escalationLevel: z.coerce.number().int().positive().optional(),
      notificationTemplate: z.string().optional(),
      autoResolveAfter: z.coerce.number().int().positive().optional(),
      ticketPriority: z.string().optional(),
    }),
  }),
  statistics: z.object({
    matches: z.coerce.number().int().min(0).optional(),
    falsePositives: z.coerce.number().int().min(0).optional(),
    accuracy: z.coerce.number().min(0).max(100).optional(),
    lastMatch: z.string().optional(),
    averageResolutionTime: z.coerce.number().int().min(0).optional(),
  }).optional(),
  enabled: z.coerce.boolean().default(true),
});

const GetPerformanceMetricsSchema = z.object({
  organizationId: z.string().min(1),
  service: z.string().optional(),
  metricType: z.enum(['response_time', 'throughput', 'error_rate', 'availability', 'resource_usage']).optional(),
  status: z.enum(['normal', 'warning', 'critical']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreatePerformanceMetricSchema = z.object({
  organizationId: z.string().min(1),
  service: z.string().min(1),
  metricType: z.enum(['response_time', 'throughput', 'error_rate', 'availability', 'resource_usage']),
  value: z.coerce.number(),
  unit: z.string().min(1),
  timestamp: z.string().datetime(),
  dimensions: z.object({
    endpoint: z.string().optional(),
    method: z.string().optional(),
    statusCode: z.coerce.number().int().optional(),
    environment: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
  thresholds: z.object({
    warning: z.coerce.number(),
    critical: z.coerce.number(),
  }),
});

const GetAlertsSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['error', 'performance', 'availability', 'security']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'acknowledged', 'resolved', 'suppressed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateAlertSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['error', 'performance', 'availability', 'security']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1),
  description: z.string().min(1),
  source: z.object({
    service: z.string().min(1),
    component: z.string().optional(),
    endpoint: z.string().optional(),
  }),
  condition: z.object({
    metric: z.string().optional(),
    threshold: z.coerce.number().optional(),
    operator: z.string().optional(),
    duration: z.coerce.number().int().positive().optional(),
  }),
  status: z.enum(['active', 'acknowledged', 'resolved', 'suppressed']).default('active'),
  assignedTo: z.string().optional(),
  escalationLevel: z.coerce.number().int().min(0).default(1),
  notifications: z.object({
    channels: z.array(z.string()).min(1),
    sent: z.coerce.boolean().default(false),
    sentAt: z.string().datetime().optional(),
    acknowledged: z.coerce.boolean().default(false),
    acknowledgedAt: z.string().datetime().optional(),
    acknowledgedBy: z.string().optional(),
  }),
  metadata: z.object({
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({}),
    relatedAlerts: z.array(z.string()).default([]),
  }).optional(),
});

const GenerateErrorReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'ad_hoc']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Error Management
advancedErrorManagementRouter.get('/errors', async (req, res) => {
  try {
    const filters = GetErrorsSchema.parse(req.query);
    const errors = await advancedErrorManagementService.getErrors(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        errors,
        total: errors.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting errors', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

advancedErrorManagementRouter.get('/errors/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const errors = await advancedErrorManagementService.getErrors('demo-org-1', { limit: 1000 });
    const error = errors.find(e => e.id === id);
    
    if (!error) {
      return res.status(404).json({
        success: false,
        error: 'Error not found'
      });
    }
    
    res.json({
      success: true,
      data: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting error', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

advancedErrorManagementRouter.post('/errors', async (req, res) => {
  try {
    const errorData = CreateErrorSchema.parse(req.body);
    const error = await advancedErrorManagementService.createError(errorData);
    
    res.status(201).json({
      success: true,
      data: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating error', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Pattern Management
advancedErrorManagementRouter.get('/patterns', async (req, res) => {
  try {
    const filters = GetPatternsSchema.parse(req.query);
    const patterns = await advancedErrorManagementService.getPatterns(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        patterns,
        total: patterns.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting patterns', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

advancedErrorManagementRouter.post('/patterns', async (req, res) => {
  try {
    const patternData = CreatePatternSchema.parse(req.body);
    const pattern = await advancedErrorManagementService.createPattern(patternData);
    
    res.status(201).json({
      success: true,
      data: pattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating pattern', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Performance Monitoring
advancedErrorManagementRouter.get('/performance-metrics', async (req, res) => {
  try {
    const filters = GetPerformanceMetricsSchema.parse(req.query);
    const metrics = await advancedErrorManagementService.getPerformanceMetrics(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        metrics,
        total: metrics.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting performance metrics', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

advancedErrorManagementRouter.post('/performance-metrics', async (req, res) => {
  try {
    const metricData = CreatePerformanceMetricSchema.parse(req.body);
    const metric = await advancedErrorManagementService.createPerformanceMetric(metricData);
    
    res.status(201).json({
      success: true,
      data: metric,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating performance metric', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Alert Management
advancedErrorManagementRouter.get('/alerts', async (req, res) => {
  try {
    const filters = GetAlertsSchema.parse(req.query);
    const alerts = await advancedErrorManagementService.getAlerts(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting alerts', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

advancedErrorManagementRouter.post('/alerts', async (req, res) => {
  try {
    const alertData = CreateAlertSchema.parse(req.body);
    const alert = await advancedErrorManagementService.createAlert(alertData);
    
    res.status(201).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating alert', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Error Analysis
advancedErrorManagementRouter.post('/errors/:id/analyze', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const error = await advancedErrorManagementService.analyzeError(id);
    
    res.json({
      success: true,
      data: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error analyzing error', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Processing
advancedErrorManagementRouter.post('/process-errors', async (req, res) => {
  try {
    await advancedErrorManagementService.processNewErrors();
    
    res.json({
      success: true,
      message: 'New errors processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error processing errors', { error });
    res.status(500).json({
      success: false,
      error: 'Processing failed'
    });
  }
});

advancedErrorManagementRouter.post('/collect-metrics', async (req, res) => {
  try {
    await advancedErrorManagementService.collectPerformanceMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics collected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error collecting metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Metrics collection failed'
    });
  }
});

advancedErrorManagementRouter.post('/process-alerts', async (req, res) => {
  try {
    await advancedErrorManagementService.processAlerts();
    
    res.json({
      success: true,
      message: 'Alerts processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error processing alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Alert processing failed'
    });
  }
});

// Reports
advancedErrorManagementRouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateErrorReportSchema.parse(req.body);
    const report = await advancedErrorManagementService.generateErrorReport(
      reportData.organizationId,
      reportData.reportType,
      reportData.startDate,
      reportData.endDate,
      reportData.generatedBy
    );
    
    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error generating error report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
advancedErrorManagementRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await advancedErrorManagementService.getStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
advancedErrorManagementRouter.get('/health', async (req, res) => {
  try {
    const stats = await advancedErrorManagementService.getStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalErrors: stats.totalErrors,
        totalPatterns: stats.totalPatterns,
        totalMetrics: stats.totalMetrics,
        totalAlerts: stats.totalAlerts,
        last24Hours: stats.last24Hours,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { advancedErrorManagementRouter };
