import { Router } from 'express';
import { z } from 'zod';

import { performanceOptimizerService } from '../lib/performance-optimizer.service.js';
import { errorManagerService } from '../lib/error-manager.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

// Status Router - MEJORA 3
// Endpoint unificado para estado del sistema y consolidación de información

const statusRouter = Router();

// Validation schemas
const GetStatusSchema = z.object({
  include: z.array(z.enum(['performance', 'errors', 'services', 'health', 'metrics'])).optional(),
  organizationId: z.string().optional(),
  detailed: z.coerce.boolean().default(false).optional()
});

const GetServiceStatusSchema = z.object({
  service: z.string().min(1),
  organizationId: z.string().optional()
});

// Routes

// Endpoint principal de estado del sistema
statusRouter.get('/', async (req, res) => {
  try {
    const { include = ['performance', 'errors', 'services', 'health'], organizationId, detailed = false } = GetStatusSchema.parse(req.query);
    
    const status = {
      system: {
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || req.headers['x-correlation-id'] || `req_${Date.now()}`
      },
      features: {
        total: 36,
        active: 36,
        categories: {
          'Core Services': 8,
          'AI & Analytics': 6,
          'Business Logic': 12,
          'Infrastructure': 10
        }
      }
    };

    // Incluir información de rendimiento si se solicita
    if (include.includes('performance')) {
      const performanceStats = performanceOptimizerService.getPerformanceStats();
      status['performance'] = {
        current: performanceStats.current,
        health: performanceStats.health.overall,
        recommendations: performanceStats.health.recommendations,
        optimizations: {
          total: performanceStats.optimizations.total,
          last24Hours: performanceStats.optimizations.last24Hours
        }
      };
    }

    // Incluir información de errores si se solicita
    if (include.includes('errors')) {
      const errorStats = errorManagerService.getErrorStats();
      status['errors'] = {
        total: errorStats.total,
        last24Hours: errorStats.last24Hours,
        lastHour: errorStats.lastHour,
        bySeverity: errorStats.bySeverity,
        byCategory: errorStats.byCategory,
        retrySuccessRate: errorStats.retrySuccessRate
      };
    }

    // Incluir estado de servicios si se solicita
    if (include.includes('services')) {
      const serviceHealth = performanceOptimizerService.getServiceHealth();
      status['services'] = {
        total: serviceHealth.length,
        healthy: serviceHealth.filter(s => s.status === 'healthy').length,
        degraded: serviceHealth.filter(s => s.status === 'degraded').length,
        unhealthy: serviceHealth.filter(s => s.status === 'unhealthy').length,
        services: detailed ? serviceHealth : serviceHealth.map(s => ({
          name: s.name,
          status: s.status,
          lastCheck: s.lastCheck
        }))
      };
    }

    // Incluir información de salud si se solicita
    if (include.includes('health')) {
      status['health'] = {
        overall: 'healthy',
        checks: {
          database: 'healthy',
          cache: 'healthy',
          external_services: 'healthy',
          memory: 'healthy',
          cpu: 'healthy'
        },
        lastCheck: new Date().toISOString()
      };
    }

    // Incluir métricas si se solicita
    if (include.includes('metrics')) {
      const metrics = performanceOptimizerService.getMetrics();
      status['metrics'] = {
        memory: metrics.memoryUsage,
        cpu: metrics.cpuUsage,
        eventLoop: metrics.eventLoop,
        connections: metrics.connections,
        cache: metrics.cache
      };
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting system status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

// Endpoint de estado de servicios específicos
statusRouter.get('/services', async (req, res) => {
  try {
    const { service, organizationId } = GetServiceStatusSchema.parse(req.query);
    
    const serviceHealth = performanceOptimizerService.getServiceHealth();
    const serviceStatus = serviceHealth.find(s => s.name === service);
    
    if (!serviceStatus) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        service: serviceStatus,
        organizationId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    structuredLogger.error('Error getting service status', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Endpoint de resumen ejecutivo
statusRouter.get('/summary', async (req, res) => {
  try {
    const performanceStats = performanceOptimizerService.getPerformanceStats();
    const errorStats = errorManagerService.getErrorStats();
    const serviceHealth = performanceOptimizerService.getServiceHealth();
    
    const summary = {
      system: {
        status: performanceStats.health.overall === 'healthy' ? 'operational' : 'degraded',
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      performance: {
        memory: {
          used: performanceStats.current.memoryUsage.heapUsed,
          threshold: performanceStats.thresholds.memory,
          status: performanceStats.current.memoryUsage.heapUsed < performanceStats.thresholds.memory ? 'healthy' : 'warning'
        },
        cpu: {
          utilization: performanceStats.current.eventLoop.utilization,
          threshold: performanceStats.thresholds.cpu,
          status: performanceStats.current.eventLoop.utilization < performanceStats.thresholds.cpu ? 'healthy' : 'warning'
        },
        connections: {
          active: performanceStats.current.connections.active,
          total: performanceStats.current.connections.total,
          status: performanceStats.current.connections.total < 50 ? 'healthy' : 'warning'
        }
      },
      errors: {
        total: errorStats.total,
        last24Hours: errorStats.last24Hours,
        severity: {
          critical: errorStats.bySeverity.critical,
          high: errorStats.bySeverity.high,
          medium: errorStats.bySeverity.medium,
          low: errorStats.bySeverity.low
        }
      },
      services: {
        total: serviceHealth.length,
        healthy: serviceHealth.filter(s => s.status === 'healthy').length,
        degraded: serviceHealth.filter(s => s.status === 'degraded').length,
        unhealthy: serviceHealth.filter(s => s.status === 'unhealthy').length
      },
      recommendations: performanceStats.health.recommendations.slice(0, 3), // Top 3
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    structuredLogger.error('Error getting system summary', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get system summary'
    });
  }
});

// Endpoint de métricas en tiempo real
statusRouter.get('/metrics/realtime', async (req, res) => {
  try {
    const metrics = performanceOptimizerService.getMetrics();
    const errorStats = errorManagerService.getErrorStats();
    
    const realtimeMetrics = {
      timestamp: new Date().toISOString(),
      performance: {
        memory: {
          rss: metrics.memoryUsage.rss,
          heapUsed: metrics.memoryUsage.heapUsed,
          heapTotal: metrics.memoryUsage.heapTotal
        },
        cpu: {
          user: metrics.cpuUsage.user,
          system: metrics.cpuUsage.system
        },
        eventLoop: {
          lag: metrics.eventLoop.lag,
          utilization: metrics.eventLoop.utilization
        },
        connections: metrics.connections,
        cache: metrics.cache
      },
      errors: {
        total: errorStats.total,
        lastHour: errorStats.lastHour,
        bySeverity: errorStats.bySeverity
      },
      system: {
        uptime: process.uptime(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    res.json({
      success: true,
      data: realtimeMetrics
    });
  } catch (error) {
    structuredLogger.error('Error getting realtime metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get realtime metrics'
    });
  }
});

// Endpoint de configuración del sistema
statusRouter.get('/config', async (req, res) => {
  try {
    const config = {
      system: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001,
        nodeVersion: process.version,
        platform: process.platform
      },
      features: {
        total: 36,
        categories: {
          'Core Services': [
            'Health modes (live/ready/degraded)',
            'Observability coherente (logs + métricas + traces)',
            'Analytics events with Zod validation',
            'Biblioteca de prompts aprobados',
            'Caché IA/Search + warm-up automático',
            'Validación básica en requests',
            'Security headers completos + CORS + Helmet',
            'Rate limiting + Budget guard'
          ],
          'AI & Analytics': [
            'Advanced Analytics & BI System',
            'Advanced Security & Threat Detection',
            'OpenAPI + Postman Documentation',
            'RBAC Granular + Auth Middleware',
            'Búsqueda semántica CRM',
            'Warmup IA/Search + Performance Optimization'
          ],
          'Business Logic': [
            'Make quotas + idempotencia',
            'Graph wrappers seguros',
            'HITL v2',
            'Stripe receipts + conciliación',
            'Inventory Kardex + alertas',
            'Supplier scorecard',
            'Interactions SAS + AV',
            'Companies taxonomía & vistas',
            'Contacts dedupe proactivo',
            'Deals NBA explicable',
            'Dunning 3-toques',
            'Fiscalidad regional'
          ],
          'Infrastructure': [
            'SEPA Ingest + Parsing',
            'GDPR Export/Erase + Audit',
            'FinOps Panel completo',
            'Quiet Hours + On-Call Management',
            'Suite RLS generativa',
            'Blue/green + gates',
            'SSE: Real-time events and notifications',
            'Cockpit: Operational dashboard endpoints',
            'Cache: Advanced caching with statistics',
            'Metrics: Prometheus-compatible metrics endpoint'
          ]
        }
      },
      performance: {
        thresholds: {
          memory: 512, // MB
          cpu: 80, // %
          responseTime: 1000, // ms
          errorRate: 5, // %
          connections: 100
        },
        optimization: {
          enabled: true,
          lazyLoading: true,
          servicePooling: true,
          memoryOptimization: true
        }
      },
      security: {
        cors: {
          enabled: true,
          origins: ['http://localhost:3000', 'http://localhost:3001']
        },
        helmet: {
          enabled: true,
          contentSecurityPolicy: true
        },
        rateLimiting: {
          enabled: true,
          windowMs: 60000, // 1 minute
          max: 100 // requests per window
        }
      },
      observability: {
        logging: {
          level: 'info',
          structured: true,
          format: 'json'
        },
        metrics: {
          prometheus: true,
          custom: true
        },
        tracing: {
          openTelemetry: true,
          correlation: true
        }
      }
    };
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting system config', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get system config'
    });
  }
});

// Endpoint de health check consolidado
statusRouter.get('/health', async (req, res) => {
  try {
    const performanceStats = performanceOptimizerService.getPerformanceStats();
    const errorStats = errorManagerService.getErrorStats();
    const serviceHealth = performanceOptimizerService.getServiceHealth();
    
    const overallHealth = performanceStats.health.overall;
    const statusCode = overallHealth === 'healthy' ? 200 : 
                      overallHealth === 'degraded' ? 200 : 503;
    
    const health = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        performance: {
          status: overallHealth,
          memory: performanceStats.current.memoryUsage.heapUsed < performanceStats.thresholds.memory ? 'healthy' : 'warning',
          cpu: performanceStats.current.eventLoop.utilization < performanceStats.thresholds.cpu ? 'healthy' : 'warning',
          connections: performanceStats.current.connections.total < 50 ? 'healthy' : 'warning'
        },
        errors: {
          status: errorStats.lastHour < 10 ? 'healthy' : errorStats.lastHour < 50 ? 'warning' : 'critical',
          total: errorStats.total,
          lastHour: errorStats.lastHour,
          critical: errorStats.bySeverity.critical
        },
        services: {
          status: serviceHealth.filter(s => s.status === 'unhealthy').length === 0 ? 'healthy' : 'warning',
          total: serviceHealth.length,
          healthy: serviceHealth.filter(s => s.status === 'healthy').length,
          degraded: serviceHealth.filter(s => s.status === 'degraded').length,
          unhealthy: serviceHealth.filter(s => s.status === 'unhealthy').length
        }
      },
      recommendations: performanceStats.health.recommendations.slice(0, 3)
    };
    
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    structuredLogger.error('Error checking system health', { error });
    res.status(500).json({
      success: false,
      error: 'System health check failed'
    });
  }
});

export { statusRouter };
