/**
 * PR-48: Performance Optimization Routes V2
 * 
 * Endpoints para gestionar el sistema de optimización de rendimiento
 * y monitorear métricas en tiempo real.
 */

import { Router } from 'express';
import { z } from 'zod';

import { performanceOptimizerV2 } from '../lib/performance-optimizer-v2.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const PerformanceConfigSchema = z.object({
  enabled: z.boolean().optional(),
  latencyThreshold: z.number().min(100).max(10000).optional(),
  memoryThreshold: z.number().min(100).max(2048).optional(),
  cpuThreshold: z.number().min(10).max(100).optional(),
  responseTimeThreshold: z.number().min(100).max(5000).optional(),
  errorRateThreshold: z.number().min(1).max(50).optional(),
  gcThreshold: z.number().min(50).max(1000).optional(),
  cacheSizeLimit: z.number().min(64).max(1024).optional(),
  connectionLimit: z.number().min(10).max(500).optional(),
  enableLazyLoading: z.boolean().optional(),
  enableServicePooling: z.boolean().optional(),
  enableMemoryOptimization: z.boolean().optional(),
  enableQueryOptimization: z.boolean().optional(),
  enableResponseCompression: z.boolean().optional(),
  enableCacheOptimization: z.boolean().optional(),
});

const OptimizationTypeSchema = z.enum(['memory', 'cpu', 'latency', 'cache', 'query', 'connection']);

/**
 * GET /performance/status
 * Obtiene el estado actual del sistema de optimización
 */
router.get('/status', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const status = performanceOptimizerV2.getStatus();
    
    structuredLogger.info('Performance status requested', {
      traceId,
      spanId,
      status: {
        enabled: status.enabled,
        isOptimizing: status.isOptimizing,
        optimizationsCount: status.optimizations.length
      }
    });

    res.json({
      success: true,
      data: {
        enabled: status.enabled,
        isOptimizing: status.isOptimizing,
        metrics: status.metrics,
        recentOptimizations: status.optimizations.slice(-10), // Últimas 10
        config: status.config,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get performance status', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get performance status',
      traceId
    });
  }
});

/**
 * GET /performance/metrics
 * Obtiene métricas detalladas de rendimiento
 */
router.get('/metrics', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const status = performanceOptimizerV2.getStatus();
    
    // Análisis detallado de métricas
    const analysis = {
      memory: {
        usage: status.metrics.memoryUsage,
        utilization: (status.metrics.memoryUsage.rss / status.config.memoryThreshold) * 100,
        status: status.metrics.memoryUsage.rss > status.config.memoryThreshold ? 'warning' : 'healthy'
      },
      cpu: {
        usage: status.metrics.cpuUsage,
        utilization: (status.metrics.cpuUsage.user / status.config.cpuThreshold) * 100,
        status: status.metrics.cpuUsage.user > status.config.cpuThreshold ? 'warning' : 'healthy'
      },
      latency: {
        eventLoopLag: status.metrics.eventLoop.lag,
        threshold: status.config.latencyThreshold,
        status: status.metrics.eventLoop.lag > status.config.latencyThreshold ? 'warning' : 'healthy'
      },
      cache: {
        hitRate: status.metrics.cache.hitRate,
        size: status.metrics.cache.size,
        status: status.metrics.cache.hitRate < 0.8 ? 'warning' : 'healthy'
      },
      queries: {
        total: status.metrics.queries.total,
        slow: status.metrics.queries.slow,
        averageTime: status.metrics.queries.averageTime,
        slowQueryRate: status.metrics.queries.total > 0 ? (status.metrics.queries.slow / status.metrics.queries.total) * 100 : 0,
        status: status.metrics.queries.slow / status.metrics.queries.total > 0.1 ? 'warning' : 'healthy'
      },
      connections: {
        active: status.metrics.connections.active,
        idle: status.metrics.connections.idle,
        total: status.metrics.connections.total,
        utilization: (status.metrics.connections.active / status.config.connectionLimit) * 100,
        status: status.metrics.connections.active > status.config.connectionLimit ? 'warning' : 'healthy'
      }
    };

    structuredLogger.info('Performance metrics requested', {
      traceId,
      spanId,
      analysis
    });

    res.json({
      success: true,
      data: {
        metrics: status.metrics,
        analysis,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get performance metrics', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
      traceId
    });
  }
});

/**
 * POST /performance/optimize
 * Fuerza una optimización manual
 */
router.post('/optimize', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { type } = req.body;
    
    // Validar tipo de optimización
    if (type && !OptimizationTypeSchema.safeParse(type).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid optimization type',
        validTypes: ['memory', 'cpu', 'latency', 'cache', 'query', 'connection'],
        traceId
      });
    }

    structuredLogger.info('Manual performance optimization requested', {
      traceId,
      spanId,
      type: type || 'all'
    });

    const results = await performanceOptimizerV2.forceOptimization(type);
    
    const summary = {
      totalOptimizations: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageDuration: results.reduce((acc, r) => acc + r.duration, 0) / results.length,
      highImpact: results.filter(r => r.impact === 'high').length
    };

    structuredLogger.info('Manual performance optimization completed', {
      traceId,
      spanId,
      summary
    });

    res.json({
      success: true,
      data: {
        results,
        summary,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to perform manual optimization', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to perform manual optimization',
      traceId
    });
  }
});

/**
 * PUT /performance/config
 * Actualiza la configuración del optimizador
 */
router.put('/config', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const configData = PerformanceConfigSchema.parse(req.body);
    
    structuredLogger.info('Performance config update requested', {
      traceId,
      spanId,
      config: configData
    });

    performanceOptimizerV2.updateConfig(configData);
    
    const newStatus = performanceOptimizerV2.getStatus();

    structuredLogger.info('Performance config updated', {
      traceId,
      spanId,
      newConfig: newStatus.config
    });

    res.json({
      success: true,
      data: {
        config: newStatus.config,
        message: 'Configuration updated successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to update performance config', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update performance config',
      traceId
    });
  }
});

/**
 * GET /performance/optimizations
 * Obtiene el historial de optimizaciones
 */
router.get('/optimizations', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { limit = 50, type, success } = req.query;
    const status = performanceOptimizerV2.getStatus();
    
    let optimizations = status.optimizations;

    // Filtrar por tipo
    if (type && typeof type === 'string') {
      optimizations = optimizations.filter(opt => opt.type === type);
    }

    // Filtrar por éxito
    if (success !== undefined) {
      const successFilter = success === 'true';
      optimizations = optimizations.filter(opt => opt.success === successFilter);
    }

    // Limitar resultados
    const limitNum = parseInt(limit as string, 10);
    optimizations = optimizations.slice(-limitNum);

    // Estadísticas
    const stats = {
      total: status.optimizations.length,
      successful: status.optimizations.filter(opt => opt.success).length,
      failed: status.optimizations.filter(opt => !opt.success).length,
      byType: status.optimizations.reduce((acc, opt) => {
        acc[opt.type] = (acc[opt.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageDuration: status.optimizations.reduce((acc, opt) => acc + opt.duration, 0) / status.optimizations.length,
      highImpact: status.optimizations.filter(opt => opt.impact === 'high').length
    };

    structuredLogger.info('Performance optimizations history requested', {
      traceId,
      spanId,
      filters: { limit, type, success },
      stats
    });

    res.json({
      success: true,
      data: {
        optimizations,
        stats,
        filters: { limit, type, success },
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get performance optimizations', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get performance optimizations',
      traceId
    });
  }
});

/**
 * GET /performance/health
 * Health check específico para el sistema de optimización
 */
router.get('/health', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const status = performanceOptimizerV2.getStatus();
    
    // Evaluar salud del sistema
    const healthChecks = {
      memory: status.metrics.memoryUsage.rss <= status.config.memoryThreshold,
      cpu: status.metrics.cpuUsage.user <= status.config.cpuThreshold,
      latency: status.metrics.eventLoop.lag <= status.config.latencyThreshold,
      cache: status.metrics.cache.hitRate >= 0.8,
      queries: status.metrics.queries.total === 0 || (status.metrics.queries.slow / status.metrics.queries.total) <= 0.1,
      connections: status.metrics.connections.active <= status.config.connectionLimit
    };

    const isHealthy = Object.values(healthChecks).every(check => check);
    const healthStatus = isHealthy ? 'healthy' : 'degraded';

    structuredLogger.info('Performance health check', {
      traceId,
      spanId,
      healthStatus,
      healthChecks
    });

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: healthStatus,
        checks: healthChecks,
        metrics: status.metrics,
        isOptimizing: status.isOptimizing,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Performance health check failed', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Performance health check failed',
      traceId
    });
  }
});

/**
 * GET /performance/recommendations
 * Obtiene recomendaciones de optimización
 */
router.get('/recommendations', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const status = performanceOptimizerV2.getStatus();
    const recommendations = [];

    // Recomendaciones basadas en métricas actuales
    if (status.metrics.memoryUsage.rss > status.config.memoryThreshold * 0.8) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        title: 'Memory Usage High',
        description: 'Consider enabling memory optimization or increasing memory threshold',
        action: 'Enable memory optimization',
        impact: 'high'
      });
    }

    if (status.metrics.cpuUsage.user > status.config.cpuThreshold * 0.8) {
      recommendations.push({
        type: 'cpu',
        priority: 'high',
        title: 'CPU Usage High',
        description: 'Consider enabling lazy loading or service pooling',
        action: 'Enable CPU optimization',
        impact: 'high'
      });
    }

    if (status.metrics.cache.hitRate < 0.8) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: 'Cache Hit Rate Low',
        description: 'Consider optimizing cache strategy',
        action: 'Enable cache optimization',
        impact: 'medium'
      });
    }

    if (status.metrics.queries.slow / status.metrics.queries.total > 0.05) {
      recommendations.push({
        type: 'query',
        priority: 'medium',
        title: 'Slow Queries Detected',
        description: 'Consider enabling query optimization',
        action: 'Enable query optimization',
        impact: 'medium'
      });
    }

    structuredLogger.info('Performance recommendations requested', {
      traceId,
      spanId,
      recommendationsCount: recommendations.length
    });

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get performance recommendations', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get performance recommendations',
      traceId
    });
  }
});

export default router;
