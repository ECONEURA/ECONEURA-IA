import { Router } from "express";
import { analytics } from "../lib/analytics.js";
import { alertSystem } from "../lib/alerts.js";
import { smartCache } from "../lib/smart-cache.js";
import { logger } from "../lib/logger.js";
import { registry } from "../lib/observe.js";

export const dashboard = Router();

// Dashboard principal con métricas generales
dashboard.get("/", async (req, res) => {
  try {
    const timeRange = (req.query.range as string) || '24h';
    const org = req.headers['x-org-id'] as string || 'demo-org';

    // Obtener métricas de analytics
    const analyticsMetrics = analytics.getMetrics(timeRange as any);
    const orgUsage = analytics.getOrgUsage(org, timeRange as any);
    const popularQueries = analytics.getPopularQueries(timeRange as any);

    // Obtener métricas de Prometheus
    const prometheusMetrics = await registry.getMetricsAsJSON();

    // Obtener estadísticas de caché
    const cacheStats = smartCache.getStats();

    // Obtener estadísticas de alertas
    const alertStats = alertSystem.getAlertStats();

    const dashboard = {
      timestamp: new Date().toISOString(),
      timeRange,
      organization: org,
      
      // Métricas generales
      general: {
        totalRequests: analyticsMetrics.totalRequests,
        uniqueUsers: analyticsMetrics.uniqueUsers,
        errorRate: analyticsMetrics.errorRate,
        avgLatency: analyticsMetrics.avgLatency
      },

      // Uso por organización
      organizationUsage: orgUsage,

      // Modelos más populares
      popularModels: analyticsMetrics.popularModels,

      // Costes por organización
      costsByOrg: analyticsMetrics.costByOrg,

      // Búsquedas populares
      popularQueries: Object.entries(popularQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count })),

      // Métricas de caché
      cache: {
        totalEntries: cacheStats.totalEntries,
        totalSize: cacheStats.totalSize,
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        evictions: cacheStats.evictions
      },

      // Alertas
      alerts: {
        totalAlerts: Object.keys(alertStats).length,
        alertStats
      },

      // Métricas de Prometheus
      prometheus: {
        aiRequests: prometheusMetrics.find(m => m.name === 'ai_requests_total')?.values || [],
        aiLatency: prometheusMetrics.find(m => m.name === 'ai_latency_ms')?.values || [],
        aiTokens: prometheusMetrics.find(m => m.name === 'ai_tokens_total')?.values || [],
        aiCost: prometheusMetrics.find(m => m.name === 'ai_cost_eur_total')?.values || []
      },

      // Estado del sistema
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    logger.info('Dashboard accessed', {
      endpoint: '/dashboard',
      method: 'GET',
      org,
      timeRange
    });

    res.json(dashboard);
  } catch (error) {
    logger.error('Dashboard error', {
      endpoint: '/dashboard',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Failed to generate dashboard',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para métricas de rendimiento
dashboard.get("/performance", async (req, res) => {
  try {
    const timeRange = (req.query.range as string) || '24h';
    const org = req.headers['x-org-id'] as string || 'demo-org';

    const orgUsage = analytics.getOrgUsage(org, timeRange as any);
    const prometheusMetrics = await registry.getMetricsAsJSON();

    const performance = {
      timestamp: new Date().toISOString(),
      organization: org,
      timeRange,

      // Latencia
      latency: {
        average: orgUsage.avgLatency,
        p95: 0, // TODO: Calcular percentiles
        p99: 0,
        trend: 'stable' // TODO: Calcular tendencia
      },

      // Throughput
      throughput: {
        requestsPerMinute: orgUsage.aiRequests / 1440, // Aproximado para 24h
        requestsPerHour: orgUsage.aiRequests / 24,
        peakRequests: 0 // TODO: Calcular picos
      },

      // Errores
      errors: {
        total: orgUsage.errors,
        rate: orgUsage.errorRate,
        byType: {} // TODO: Categorizar errores
      },

      // Recursos
      resources: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      },

      // Caché
      cache: {
        hitRate: smartCache.getStats().hitRate,
        efficiency: 'high' // TODO: Calcular eficiencia
      }
    };

    res.json(performance);
  } catch (error) {
    logger.error('Performance metrics error', {
      endpoint: '/dashboard/performance',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Failed to generate performance metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para métricas de costes
dashboard.get("/costs", async (req, res) => {
  try {
    const timeRange = (req.query.range as string) || '24h';
    const org = req.headers['x-org-id'] as string || 'demo-org';

    const analyticsMetrics = analytics.getMetrics(timeRange as any);
    const orgUsage = analytics.getOrgUsage(org, timeRange as any);

    const costs = {
      timestamp: new Date().toISOString(),
      organization: org,
      timeRange,

      // Costes totales
      total: {
        current: orgUsage.totalCost,
        limit: Number(process.env.ORG_MONTHLY_BUDGET_EUR || 50),
        percentage: (orgUsage.totalCost / Number(process.env.ORG_MONTHLY_BUDGET_EUR || 50)) * 100
      },

      // Costes por modelo
      byModel: analyticsMetrics.popularModels,

      // Costes por organización
      byOrg: analyticsMetrics.costByOrg,

      // Proyección
      projection: {
        daily: orgUsage.totalCost / 30, // Aproximado
        weekly: orgUsage.totalCost * 7 / 30,
        monthly: orgUsage.totalCost,
        trend: 'stable' // TODO: Calcular tendencia
      },

      // Alertas de presupuesto
      budgetAlerts: {
        threshold: 80, // 80% del presupuesto
        isNearLimit: orgUsage.totalCost > (Number(process.env.ORG_MONTHLY_BUDGET_EUR || 50) * 0.8),
        recommendations: [
          'Optimizar prompts para reducir tokens',
          'Usar modelos más eficientes',
          'Implementar caché para respuestas comunes'
        ]
      }
    };

    res.json(costs);
  } catch (error) {
    logger.error('Cost metrics error', {
      endpoint: '/dashboard/costs',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Failed to generate cost metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para métricas de uso
dashboard.get("/usage", async (req, res) => {
  try {
    const timeRange = (req.query.range as string) || '24h';
    const org = req.headers['x-org-id'] as string || 'demo-org';

    const analyticsMetrics = analytics.getMetrics(timeRange as any);
    const orgUsage = analytics.getOrgUsage(org, timeRange as any);
    const popularQueries = analytics.getPopularQueries(timeRange as any);

    const usage = {
      timestamp: new Date().toISOString(),
      organization: org,
      timeRange,

      // Uso general
      general: {
        totalRequests: orgUsage.aiRequests,
        totalSearches: orgUsage.searches,
        totalErrors: orgUsage.errors,
        uniqueUsers: analyticsMetrics.uniqueUsers
      },

      // Uso por modelo
      byModel: analyticsMetrics.popularModels,

      // Uso por tipo de servicio
      byService: {
        chat: orgUsage.aiRequests * 0.7, // Estimado
        images: orgUsage.aiRequests * 0.2,
        tts: orgUsage.aiRequests * 0.1
      },

      // Búsquedas populares
      popularQueries: Object.entries(popularQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count })),

      // Patrones de uso
      patterns: {
        peakHours: [9, 14, 18], // TODO: Calcular horas pico reales
        averageSessionLength: 15, // minutos
        mostActiveDay: 'Wednesday' // TODO: Calcular día más activo
      },

      // Eficiencia
      efficiency: {
        cacheHitRate: smartCache.getStats().hitRate,
        averageTokensPerRequest: orgUsage.totalTokens / orgUsage.aiRequests || 0,
        costPerRequest: orgUsage.totalCost / orgUsage.aiRequests || 0
      }
    };

    res.json(usage);
  } catch (error) {
    logger.error('Usage metrics error', {
      endpoint: '/dashboard/usage',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Failed to generate usage metrics',
      timestamp: new Date().toISOString()
    });
  }
});
