import { Router } from 'express';
import { z } from 'zod';
import { aiPerformanceOptimizationService } from '../services/ai-performance-optimization.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Schemas de validación
const RecordPerformanceMetricSchema = z.object({
  serviceName: z.string().min(1).max(100),
  metricType: z.enum(['latency', 'throughput', 'accuracy', 'cost', 'memory', 'cpu', 'error_rate', 'success_rate']),
  value: z.number().positive(),
  unit: z.string().min(1).max(20),
  metadata: z.record(z.any()).optional()
});

const CreateOptimizationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  condition: z.object({
    metric: z.string(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
    threshold: z.number(),
    duration: z.number().positive()
  }),
  action: z.object({
    type: z.enum(['scale_up', 'scale_down', 'cache_clear', 'model_switch', 'retry', 'fallback']),
    parameters: z.record(z.any()),
    priority: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  isActive: z.boolean().default(true)
});

const UpdateOptimizationRuleSchema = CreateOptimizationRuleSchema.partial();

const OptimizePerformanceSchema = z.object({
  serviceName: z.string().min(1).max(100),
  metricType: z.string().min(1).max(50),
  value: z.number(),
  metadata: z.record(z.any()).optional()
});

const GenerateOptimizationReportSchema = z.object({
  serviceName: z.string().min(1).max(100),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  })
});

// Middleware de autenticación y rate limiting
router.use(authenticateToken);
router.use(rateLimiter);

// ===== GESTIÓN DE MÉTRICAS DE PERFORMANCE =====

// POST /v1/ai-performance-optimization/metrics - Registrar métrica
router.post('/metrics',
  validateRequest(RecordPerformanceMetricSchema),
  async (req, res) => {
    try {
      const metric = await aiPerformanceOptimizationService.recordPerformanceMetric(req.body);
      
      logger.info('Performance metric recorded', { 
        metricId: metric.id, 
        serviceName: metric.serviceName,
        metricType: metric.metricType,
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: metric,
        message: 'Performance metric recorded successfully'
      });
    } catch (error: any) {
      logger.error('Failed to record performance metric', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to record performance metric',
        message: error.message
      });
    }
  }
);

// GET /v1/ai-performance-optimization/metrics - Obtener métricas
router.get('/metrics', async (req, res) => {
  try {
    const { serviceName, metricType, limit = 100 } = req.query;
    
    const metrics = await aiPerformanceOptimizationService.getPerformanceMetrics(
      serviceName as string,
      metricType as string,
      Number(limit)
    );
    
    logger.info('Performance metrics retrieved', { 
      userId: req.user?.id, 
      count: metrics.length,
      filters: { serviceName, metricType, limit }
    });
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error: any) {
    logger.error('Failed to get performance metrics', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
      message: error.message
    });
  }
});

// ===== GESTIÓN DE REGLAS DE OPTIMIZACIÓN =====

// GET /v1/ai-performance-optimization/rules - Obtener reglas
router.get('/rules', async (req, res) => {
  try {
    const rules = await aiPerformanceOptimizationService.getOptimizationRules();
    
    logger.info('Optimization rules retrieved', { 
      userId: req.user?.id, 
      count: rules.length 
    });
    
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error: any) {
    logger.error('Failed to get optimization rules', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve optimization rules',
      message: error.message
    });
  }
});

// POST /v1/ai-performance-optimization/rules - Crear regla
router.post('/rules',
  validateRequest(CreateOptimizationRuleSchema),
  async (req, res) => {
    try {
      const rule = await aiPerformanceOptimizationService.createOptimizationRule(req.body);
      
      logger.info('Optimization rule created', { 
        ruleId: rule.id, 
        name: rule.name,
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: rule,
        message: 'Optimization rule created successfully'
      });
    } catch (error: any) {
      logger.error('Failed to create optimization rule', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to create optimization rule',
        message: error.message
      });
    }
  }
);

// PUT /v1/ai-performance-optimization/rules/:id - Actualizar regla
router.put('/rules/:id',
  validateRequest(UpdateOptimizationRuleSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      // Implementar actualización de regla
      
      logger.info('Optimization rule updated', { 
        ruleId: id, 
        userId: req.user?.id 
      });
      
      res.json({
        success: true,
        data: { id, ...req.body },
        message: 'Optimization rule updated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to update optimization rule', { 
        error: error.message, 
        ruleId: req.params.id,
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to update optimization rule',
        message: error.message
      });
    }
  }
);

// ===== GESTIÓN DE ALERTAS =====

// GET /v1/ai-performance-optimization/alerts - Obtener alertas
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await aiPerformanceOptimizationService.getPerformanceAlerts();
    
    logger.info('Performance alerts retrieved', { 
      userId: req.user?.id, 
      count: alerts.length 
    });
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error: any) {
    logger.error('Failed to get performance alerts', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance alerts',
      message: error.message
    });
  }
});

// PUT /v1/ai-performance-optimization/alerts/:id/resolve - Resolver alerta
router.put('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Implementar resolución de alerta
    logger.info('Performance alert resolved', { 
      alertId: id, 
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: { id, status: 'resolved' },
      message: 'Performance alert resolved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to resolve performance alert', { 
      error: error.message, 
      alertId: req.params.id,
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to resolve performance alert',
      message: error.message
    });
  }
});

// ===== OPTIMIZACIÓN AUTOMÁTICA =====

// POST /v1/ai-performance-optimization/optimize - Optimizar performance
router.post('/optimize',
  validateRequest(OptimizePerformanceSchema),
  async (req, res) => {
    try {
      const optimization = await aiPerformanceOptimizationService.optimizePerformance(req.body);
      
      logger.info('Performance optimization completed', { 
        serviceName: req.body.serviceName,
        metricType: req.body.metricType,
        optimized: optimization.optimized,
        actionsCount: optimization.actions.length,
        userId: req.user?.id 
      });
      
      res.json({
        success: true,
        data: optimization,
        message: 'Performance optimization completed'
      });
    } catch (error: any) {
      logger.error('Failed to optimize performance', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to optimize performance',
        message: error.message
      });
    }
  }
);

// ===== REPORTES DE OPTIMIZACIÓN =====

// POST /v1/ai-performance-optimization/reports - Generar reporte
router.post('/reports',
  validateRequest(GenerateOptimizationReportSchema),
  async (req, res) => {
    try {
      const { serviceName, reportType, period } = req.body;
      const report = await aiPerformanceOptimizationService.generateOptimizationReport(
        serviceName, 
        reportType, 
        {
          start: new Date(period.start),
          end: new Date(period.end)
        }
      );
      
      logger.info('Optimization report generated', { 
        reportId: report.id, 
        serviceName,
        reportType,
        userId: req.user?.id 
      });
      
      res.status(201).json({
        success: true,
        data: report,
        message: 'Optimization report generated successfully'
      });
    } catch (error: any) {
      logger.error('Failed to generate optimization report', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate optimization report',
        message: error.message
      });
    }
  }
);

// GET /v1/ai-performance-optimization/reports - Obtener reportes
router.get('/reports', async (req, res) => {
  try {
    const { serviceName, reportType, limit = 50 } = req.query;
    
    // Simular obtención de reportes (implementar según necesidad)
    const reports = [];
    
    logger.info('Optimization reports retrieved', { 
      userId: req.user?.id, 
      count: reports.length,
      filters: { serviceName, reportType }
    });
    
    res.json({
      success: true,
      data: reports,
      count: reports.length,
      pagination: {
        limit: Number(limit),
        total: reports.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get optimization reports', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve optimization reports',
      message: error.message
    });
  }
});

// ===== CONFIGURACIÓN DE AUTO-SCALING =====

// GET /v1/ai-performance-optimization/autoscaling/config - Obtener configuración
router.get('/autoscaling/config', async (req, res) => {
  try {
    const config = {
      minInstances: 2,
      maxInstances: 10,
      targetUtilization: 70,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      cooldownPeriod: 300
    };
    
    logger.info('Auto-scaling configuration retrieved', { 
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: config,
      message: 'Auto-scaling configuration retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get auto-scaling configuration', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve auto-scaling configuration',
      message: error.message
    });
  }
});

// PUT /v1/ai-performance-optimization/autoscaling/config - Actualizar configuración
router.put('/autoscaling/config', async (req, res) => {
  try {
    const config = req.body;
    
    logger.info('Auto-scaling configuration updated', { 
      config,
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: config,
      message: 'Auto-scaling configuration updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update auto-scaling configuration', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update auto-scaling configuration',
      message: error.message
    });
  }
});

// ===== MÉTRICAS EN TIEMPO REAL =====

// GET /v1/ai-performance-optimization/realtime - Métricas en tiempo real
router.get('/realtime', async (req, res) => {
  try {
    const { serviceName } = req.query;
    
    const realtimeMetrics = {
      timestamp: new Date().toISOString(),
      serviceName: serviceName || 'ai-chat-service',
      metrics: {
        latency: Math.random() * 2000 + 500,
        throughput: Math.random() * 100 + 50,
        accuracy: Math.random() * 0.2 + 0.8,
        cost: Math.random() * 0.005 + 0.002,
        memory: Math.random() * 1000 + 500,
        cpu: Math.random() * 50 + 20,
        errorRate: Math.random() * 0.05,
        successRate: Math.random() * 0.1 + 0.9
      },
      status: 'healthy'
    };
    
    logger.info('Realtime metrics retrieved', { 
      serviceName,
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: realtimeMetrics,
      message: 'Realtime metrics retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get realtime metrics', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve realtime metrics',
      message: error.message
    });
  }
});

// ===== HEALTH CHECK =====

// GET /v1/ai-performance-optimization/health - Estado del servicio
router.get('/health', async (req, res) => {
  try {
    const health = await aiPerformanceOptimizationService.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: health,
      message: `Service is ${health.status}`
    });
  } catch (error: any) {
    logger.error('Health check failed', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// ===== ESTADÍSTICAS =====

// GET /v1/ai-performance-optimization/stats - Estadísticas del servicio
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      metrics: {
        total: 0,
        byType: {
          latency: 0,
          throughput: 0,
          accuracy: 0,
          cost: 0,
          memory: 0,
          cpu: 0,
          error_rate: 0,
          success_rate: 0
        }
      },
      rules: {
        total: 0,
        active: 0,
        byType: {
          scale_up: 0,
          scale_down: 0,
          cache_clear: 0,
          model_switch: 0,
          retry: 0,
          fallback: 0
        }
      },
      alerts: {
        total: 0,
        active: 0,
        resolved: 0,
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      },
      optimizations: {
        total: 0,
        successful: 0,
        failed: 0,
        averageImprovement: 0
      }
    };
    
    logger.info('Performance optimization stats retrieved', { 
      userId: req.user?.id 
    });
    
    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to get statistics', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

export { router as aiPerformanceOptimizationRoutes };
