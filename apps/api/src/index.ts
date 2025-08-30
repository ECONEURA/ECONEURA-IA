import express from "express";
import cors from "cors";
import { logger } from "./lib/logger.js";
import { metrics } from "./lib/metrics.js";
import { tracing } from "./lib/tracing.js";
import { observabilityMiddleware, errorObservabilityMiddleware, healthCheckMiddleware } from "./middleware/observability.js";
import { rateLimitMiddleware, rateLimitByEndpoint, rateLimitByUser, rateLimitByApiKey } from "./middleware/rate-limiting.js";
import { alertSystem } from "./lib/alerts.js";
import { rateLimiter } from "./lib/rate-limiting.js";
import { CacheManager } from "./lib/cache.js";
import { finOpsSystem } from "./lib/finops.js";
import { finOpsMiddleware, finOpsCostTrackingMiddleware, finOpsBudgetCheckMiddleware } from "./middleware/finops.js";
import { rlsSystem } from "./lib/rls.js";
import { rlsMiddleware, rlsAccessControlMiddleware, rlsDataSanitizationMiddleware, rlsResponseValidationMiddleware, rlsCleanupMiddleware } from "./middleware/rls.js";
import { apiGateway } from "./lib/gateway.js";
import { gatewayRoutingMiddleware, gatewayProxyMiddleware, gatewayMetricsMiddleware, gatewayCircuitBreakerMiddleware } from "./middleware/gateway.js";
import { eventSourcingSystem, createCommand, createQuery } from "./lib/events.js";
import { registerUserHandlers } from "./lib/handlers/user-handlers.js";
import { serviceRegistry, serviceDiscovery } from "./lib/service-discovery.js";
import { serviceMesh } from "./lib/service-mesh.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Inicializar cache manager
const cacheManager = new CacheManager();

// Middleware básico
app.use(cors());
app.use(express.json());

// Middleware de observabilidad
app.use(observabilityMiddleware);

// Middleware de rate limiting (aplicar antes de las rutas)
app.use(rateLimitMiddleware);

// Middleware de health check
app.use(healthCheckMiddleware);

// Middleware de FinOps
app.use(finOpsMiddleware);
app.use(finOpsBudgetCheckMiddleware);
app.use(finOpsCostTrackingMiddleware);

// Middleware de Row Level Security
app.use(rlsMiddleware);
app.use(rlsCleanupMiddleware);

// Middleware de API Gateway
app.use(gatewayMetricsMiddleware);
app.use(gatewayCircuitBreakerMiddleware);
app.use(gatewayRoutingMiddleware);
app.use(gatewayProxyMiddleware);

// Inicializar sistema de Event Sourcing
registerUserHandlers();

// Inicializar sistema de microservicios
const registerDefaultServices = () => {
  // Registrar servicios por defecto
  serviceRegistry.register({
    name: 'api-express',
    version: '1.0.0',
    host: 'localhost',
    port: 4000,
    url: 'http://localhost:4000',
    health: 'healthy',
    status: 'online',
    metadata: {
      environment: 'development',
      region: 'us-east-1',
      zone: 'zone-a',
      tags: ['api', 'express', 'backend'],
      capabilities: ['rest', 'graphql', 'websockets'],
      load: 0,
      memory: 512,
      cpu: 25,
      endpoints: [
        {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
          version: '1.0.0',
          deprecated: false,
        },
        {
          path: '/v1/ai/chat',
          method: 'POST',
          description: 'AI chat endpoint',
          version: '1.0.0',
          deprecated: false,
        },
      ],
    },
  });

  serviceRegistry.register({
    name: 'web-bff',
    version: '1.0.0',
    host: 'localhost',
    port: 3000,
    url: 'http://localhost:3000',
    health: 'healthy',
    status: 'online',
    metadata: {
      environment: 'development',
      region: 'us-east-1',
      zone: 'zone-a',
      tags: ['web', 'bff', 'frontend'],
      capabilities: ['ssr', 'api-routes', 'dashboard'],
      load: 0,
      memory: 256,
      cpu: 15,
      endpoints: [
        {
          path: '/api/health',
          method: 'GET',
          description: 'Web BFF health check',
          version: '1.0.0',
          deprecated: false,
        },
        {
          path: '/dashboard',
          method: 'GET',
          description: 'Dashboard page',
          version: '1.0.0',
          deprecated: false,
        },
      ],
    },
  });

  logger.info('Default services registered');
};

registerDefaultServices();

// Endpoints de health
app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health/ready", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoints de rate limiting
app.get("/v1/rate-limit/organizations", (req, res) => {
  try {
    const organizations = rateLimiter.getAllOrganizations();
    res.json({
      success: true,
      data: {
        organizations: organizations.map(org => ({
          organizationId: org.organizationId,
          config: org.config,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to get organizations', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/rate-limit/organizations/:organizationId", (req, res) => {
  try {
    const { organizationId } = req.params;
    const stats = rateLimiter.getOrganizationStats(organizationId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      success: true,
      data: {
        organizationId,
        config: stats.config,
        state: stats.state,
        stats: stats.stats
      }
    });
  } catch (error) {
    logger.error('Failed to get organization stats', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/rate-limit/organizations", (req, res) => {
  try {
    const { organizationId, config } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    rateLimiter.addOrganization(organizationId, config || {});
    
    res.status(201).json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit added successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to add organization', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/rate-limit/organizations/:organizationId", (req, res) => {
  try {
    const { organizationId } = req.params;
    const { config } = req.body;
    
    const updated = rateLimiter.updateOrganization(organizationId, config || {});
    
    if (!updated) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update organization', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/rate-limit/organizations/:organizationId", (req, res) => {
  try {
    const { organizationId } = req.params;
    const removed = rateLimiter.removeOrganization(organizationId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit removed successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove organization', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/rate-limit/organizations/:organizationId/reset", (req, res) => {
  try {
    const { organizationId } = req.params;
    const reset = rateLimiter.resetOrganization(organizationId);
    
    if (!reset) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit reset successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to reset organization', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/rate-limit/stats", (req, res) => {
  try {
    const stats = rateLimiter.getGlobalStats();
    
    res.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get rate limit stats', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de alertas (con rate limiting específico)
app.get("/v1/alerts/rules", rateLimitByEndpoint, (req, res) => {
  try {
    const rules = alertSystem.getAllRules();
    res.json({
      success: true,
      data: {
        rules: rules,
        count: rules.length
      }
    });
  } catch (error) {
    logger.error('Failed to get alert rules', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/alerts/active", rateLimitByEndpoint, (req, res) => {
  try {
    const alerts = alertSystem.getActiveAlerts();
    res.json({
      success: true,
      data: {
        alerts: alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    logger.error('Failed to get active alerts', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/alerts/stats", rateLimitByEndpoint, (req, res) => {
  try {
    const stats = alertSystem.getAlertStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get alert stats', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/alerts/rules", rateLimitByEndpoint, (req, res) => {
  try {
    const rule = req.body;
    alertSystem.addRule(rule);
    
    res.status(201).json({
      success: true,
      data: {
        rule,
        message: 'Alert rule added successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to add alert rule', { error: error as Error });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.put("/v1/alerts/rules/:ruleId", rateLimitByEndpoint, (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const updated = alertSystem.updateRule(ruleId, updates);
    
    if (!updated) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({
      success: true,
      data: {
        ruleId,
        message: 'Alert rule updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update alert rule', { error: error as Error });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/alerts/rules/:ruleId", rateLimitByEndpoint, (req, res) => {
  try {
    const { ruleId } = req.params;
    const removed = alertSystem.removeRule(ruleId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({
      success: true,
      data: {
        ruleId,
        message: 'Alert rule removed successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove alert rule', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/alerts/:alertId/acknowledge", rateLimitByEndpoint, (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;
    
    const acknowledged = alertSystem.acknowledgeAlert(alertId, acknowledgedBy);
    
    if (!acknowledged) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      success: true,
      data: {
        alertId,
        message: 'Alert acknowledged successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/alerts/:alertId/resolve", rateLimitByEndpoint, (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy } = req.body;
    
    const resolved = alertSystem.resolveAlert(alertId, resolvedBy);
    
    if (!resolved) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      success: true,
      data: {
        alertId,
        message: 'Alert resolved successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to resolve alert', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de observabilidad
app.get("/v1/observability/logs", (req, res) => {
  try {
    const logs = logger.getRecentLogs();
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    logger.error('Failed to get logs', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/observability/metrics", (req, res) => {
  try {
    const metricsData = metrics.getMetrics();
    res.json({
      success: true,
      data: {
        summary: metricsData.summary,
        details: metricsData.details
      }
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/observability/metrics/prometheus", (req, res) => {
  try {
    const prometheusMetrics = metrics.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: error as Error });
    res.status(500).send('# Error generating Prometheus metrics\n');
  }
});

app.get("/v1/observability/traces", (req, res) => {
  try {
    const traces = tracing.getRecentTraces();
    res.json({
      success: true,
      data: {
        traces,
        count: traces.length
      }
    });
  } catch (error) {
    logger.error('Failed to get traces', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/observability/stats", (req, res) => {
  try {
    const stats = {
      logs: logger.getStats(),
      metrics: metrics.getStats(),
      traces: tracing.getStats()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get observability stats', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de caché
app.get("/v1/cache/stats", (req, res) => {
  try {
    const stats = cacheManager.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/cache/warmup", (req, res) => {
  try {
    cacheManager.warmupAll();
    res.json({
      success: true,
      data: {
        message: 'Cache warmup initiated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to initiate cache warmup', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/cache/warmup/start", (req, res) => {
  try {
    const { intervalMinutes = 60 } = req.body;
    cacheManager.startPeriodicWarmup(intervalMinutes);
    res.json({
      success: true,
      data: {
        message: 'Periodic cache warmup started',
        intervalMinutes
      }
    });
  } catch (error) {
    logger.error('Failed to start periodic cache warmup', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/cache/warmup/stop", (req, res) => {
  try {
    cacheManager.stopPeriodicWarmup();
    res.json({
      success: true,
      data: {
        message: 'Periodic cache warmup stopped'
      }
    });
  } catch (error) {
    logger.error('Failed to stop periodic cache warmup', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/cache/ai", (req, res) => {
  try {
    cacheManager.getAICache().clear();
    res.json({
      success: true,
      data: {
        message: 'AI cache cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to clear AI cache', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/cache/search", (req, res) => {
  try {
    cacheManager.getSearchCache().clear();
    res.json({
      success: true,
      data: {
        message: 'Search cache cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to clear search cache', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/cache/all", (req, res) => {
  try {
    cacheManager.getAICache().clear();
    cacheManager.getSearchCache().clear();
    res.json({
      success: true,
      data: {
        message: 'All caches cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to clear all caches', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de FinOps
app.get("/v1/finops/costs", (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const metrics = finOpsSystem.getCostMetrics(
      organizationId as string,
      period as string
    );
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get cost metrics', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/finops/budgets", (req, res) => {
  try {
    const { organizationId } = req.query;
    const budgets = organizationId 
      ? finOpsSystem.getBudgetsByOrganization(organizationId as string)
      : Array.from(finOpsSystem['budgets'].values());
    
    res.json({
      success: true,
      data: {
        budgets,
        count: budgets.length
      }
    });
  } catch (error) {
    logger.error('Failed to get budgets', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/finops/budgets", (req, res) => {
  try {
    const budgetData = req.body;
    const budgetId = finOpsSystem.createBudget(budgetData);
    
    res.status(201).json({
      success: true,
      data: {
        budgetId,
        message: 'Budget created successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to create budget', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.put("/v1/finops/budgets/:budgetId", (req, res) => {
  try {
    const { budgetId } = req.params;
    const updates = req.body;
    
    const updated = finOpsSystem.updateBudget(budgetId, updates);
    
    if (!updated) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      success: true,
      data: {
        budgetId,
        message: 'Budget updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update budget', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/finops/budgets/:budgetId", (req, res) => {
  try {
    const { budgetId } = req.params;
    const deleted = finOpsSystem.deleteBudget(budgetId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      success: true,
      data: {
        budgetId,
        message: 'Budget deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to delete budget', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/finops/alerts", (req, res) => {
  try {
    const { organizationId } = req.query;
    const alerts = finOpsSystem.getActiveAlerts(organizationId as string);
    
    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    logger.error('Failed to get budget alerts', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/finops/alerts/:alertId/acknowledge", (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;
    
    const acknowledged = finOpsSystem.acknowledgeAlert(alertId, acknowledgedBy);
    
    if (!acknowledged) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      success: true,
      data: {
        alertId,
        message: 'Alert acknowledged successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/finops/stats", (req, res) => {
  try {
    const stats = finOpsSystem.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get FinOps stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints adicionales para análisis avanzado
app.get("/v1/finops/budgets/:budgetId/usage", (req, res) => {
  try {
    const { budgetId } = req.params;
    const currentSpend = finOpsSystem.getCurrentBudgetSpend(budgetId);
    const usagePercentage = finOpsSystem.getBudgetUsagePercentage(budgetId);
    const budget = finOpsSystem.getBudget(budgetId);
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      success: true,
      data: {
        budgetId,
        budgetName: budget.name,
        currentSpend,
        budgetAmount: budget.amount,
        usagePercentage,
        remaining: budget.amount - currentSpend,
        currency: budget.currency,
        period: budget.period
      }
    });
  } catch (error) {
    logger.error('Failed to get budget usage', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/finops/budgets/near-limit", (req, res) => {
  try {
    const { threshold = 80 } = req.query;
    const budgetsNearLimit = finOpsSystem.getBudgetsNearLimit(Number(threshold));
    
    res.json({
      success: true,
      data: {
        budgets: budgetsNearLimit,
        count: budgetsNearLimit.length,
        threshold: Number(threshold)
      }
    });
  } catch (error) {
    logger.error('Failed to get budgets near limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/finops/organizations/:organizationId/cost", (req, res) => {
  try {
    const { organizationId } = req.params;
    const { period } = req.query;
    const totalCost = finOpsSystem.getOrganizationCost(organizationId, period as string);
    
    res.json({
      success: true,
      data: {
        organizationId,
        totalCost,
        period: period || 'all-time',
        currency: 'USD'
      }
    });
  } catch (error) {
    logger.error('Failed to get organization cost', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/finops/costs/estimate", (req, res) => {
  try {
    const { operation, service, responseSize, complexity } = req.body;
    
    // Simular cálculo de costo estimado
    const baseCosts: Record<string, number> = {
      'ai': 0.01,
      'chat': 0.02,
      'image': 0.05,
      'search': 0.005,
      'unknown': 0.001,
    };
    
    const baseCost = baseCosts[operation] || baseCosts['unknown'];
    const sizeMultiplier = Math.max(1, (responseSize || 1000) / 1000);
    const complexityMultiplier = complexity || 1;
    
    const estimatedCost = baseCost * sizeMultiplier * complexityMultiplier;
    
    res.json({
      success: true,
      data: {
        operation,
        service,
        estimatedCost,
        breakdown: {
          baseCost,
          sizeMultiplier,
          complexityMultiplier
        }
      }
    });
  } catch (error) {
    logger.error('Failed to estimate cost', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Row Level Security
app.get("/v1/rls/rules", rlsAccessControlMiddleware('rls', 'read'), (req, res) => {
  try {
    const { organizationId } = req.query;
    const rules = organizationId 
      ? rlsSystem.getRulesByOrganization(organizationId as string)
      : Array.from(rlsSystem['rules'].values());
    
    res.json({
      success: true,
      data: {
        rules,
        count: rules.length
      }
    });
  } catch (error) {
    logger.error('Failed to get RLS rules', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/rls/rules", rlsAccessControlMiddleware('rls', 'write'), rlsDataSanitizationMiddleware('rls_rules'), (req, res) => {
  try {
    const ruleData = req.body;
    const ruleId = rlsSystem.createRule(ruleData);
    
    res.status(201).json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule created successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to create RLS rule', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.put("/v1/rls/rules/:ruleId", rlsAccessControlMiddleware('rls', 'write'), rlsDataSanitizationMiddleware('rls_rules'), (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const updated = rlsSystem.updateRule(ruleId, updates);
    
    if (!updated) {
      return res.status(404).json({ error: 'RLS rule not found' });
    }

    res.json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update RLS rule', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/rls/rules/:ruleId", rlsAccessControlMiddleware('rls', 'write'), (req, res) => {
  try {
    const { ruleId } = req.params;
    const deleted = rlsSystem.deleteRule(ruleId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'RLS rule not found' });
    }

    res.json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to delete RLS rule', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/rls/context", (req, res) => {
  try {
    const context = rlsSystem.getContext();
    
    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    logger.error('Failed to get RLS context', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/rls/check-access", rlsDataSanitizationMiddleware('access_check'), (req, res) => {
  try {
    const { resource, action } = req.body;
    const hasAccess = rlsSystem.checkAccess(resource, action);
    
    res.json({
      success: true,
      data: {
        resource,
        action,
        hasAccess,
        context: rlsSystem.getContext()
      }
    });
  } catch (error) {
    logger.error('Failed to check access', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/rls/stats", (req, res) => {
  try {
    const stats = rlsSystem.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get RLS stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de API Gateway
app.get("/v1/gateway/services", (req, res) => {
  try {
    const services = apiGateway.getAllServices();
    
    res.json({
      success: true,
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    logger.error('Failed to get gateway services', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/gateway/services", (req, res) => {
  try {
    const serviceData = req.body;
    const serviceId = apiGateway.addService(serviceData);
    
    res.status(201).json({
      success: true,
      data: {
        serviceId,
        message: 'Service added to gateway successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to add service to gateway', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/gateway/services/:serviceId", (req, res) => {
  try {
    const { serviceId } = req.params;
    const deleted = apiGateway.removeService(serviceId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      data: {
        serviceId,
        message: 'Service removed from gateway successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove service from gateway', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/gateway/routes", (req, res) => {
  try {
    const routes = apiGateway.getAllRoutes();
    
    res.json({
      success: true,
      data: {
        routes,
        count: routes.length
      }
    });
  } catch (error) {
    logger.error('Failed to get gateway routes', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/gateway/routes", (req, res) => {
  try {
    const routeData = req.body;
    const routeId = apiGateway.addRoute(routeData);
    
    res.status(201).json({
      success: true,
      data: {
        routeId,
        message: 'Route added to gateway successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to add route to gateway', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/gateway/routes/:routeId", (req, res) => {
  try {
    const { routeId } = req.params;
    const deleted = apiGateway.removeRoute(routeId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({
      success: true,
      data: {
        routeId,
        message: 'Route removed from gateway successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove route from gateway', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/gateway/stats", (req, res) => {
  try {
    const stats = apiGateway.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get gateway stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/gateway/test-route", (req, res) => {
  try {
    const { path, method, headers, query } = req.body;
    const route = apiGateway.findRoute(path, method, headers || {}, query || {});
    
    if (!route) {
      return res.status(404).json({
        success: false,
        data: {
          message: 'No route found for the specified criteria'
        }
      });
    }

    const service = apiGateway.getService(route.serviceId);
    
    res.json({
      success: true,
      data: {
        route,
        service,
        message: 'Route found successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to test route', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Event Sourcing y CQRS
app.post("/v1/events/commands", async (req, res) => {
  try {
    const { type, aggregateId, data } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;

    const command = createCommand(type, aggregateId, data, {
      userId,
      organizationId,
      correlationId: req.headers['x-correlation-id'] as string,
      causationId: req.headers['x-causation-id'] as string,
    });

    await eventSourcingSystem.executeCommand(command);

    res.status(200).json({
      success: true,
      data: {
        commandId: command.id,
        message: 'Command executed successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to execute command', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/v1/events/queries", async (req, res) => {
  try {
    const { type, data } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;

    const query = createQuery(type, data, {
      userId,
      organizationId,
      correlationId: req.headers['x-correlation-id'] as string,
    });

    const result = await eventSourcingSystem.executeQuery(query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to execute query', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/events/aggregates/:aggregateId", async (req, res) => {
  try {
    const { aggregateId } = req.params;
    const { aggregateType } = req.query;

    if (!aggregateType) {
      return res.status(400).json({ error: 'aggregateType is required' });
    }

    // Por ahora solo soportamos UserAggregate
    if (aggregateType === 'User') {
      const { UserAggregate } = await import('./lib/aggregates/user.js');
      const user = await eventSourcingSystem.loadAggregate(aggregateId, UserAggregate);
      const state = user.getState();

      res.json({
        success: true,
        data: {
          aggregateId,
          aggregateType,
          version: user.version,
          state
        }
      });
    } else {
      res.status(400).json({ error: 'Unsupported aggregate type' });
    }
  } catch (error) {
    logger.error('Failed to load aggregate', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/events/events", async (req, res) => {
  try {
    const { fromTimestamp, eventType } = req.query;
    const { eventStore } = await import('./lib/events.js');

    let events;
    if (eventType) {
      events = await eventStore.getEventsByType(eventType as string, fromTimestamp ? new Date(fromTimestamp as string) : undefined);
    } else {
      events = await eventStore.getAllEvents(fromTimestamp ? new Date(fromTimestamp as string) : undefined);
    }

    res.json({
      success: true,
      data: {
        events,
        count: events.length
      }
    });
  } catch (error) {
    logger.error('Failed to get events', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/events/replay", async (req, res) => {
  try {
    const { fromTimestamp } = req.body;
    
    await eventSourcingSystem.replayEvents(fromTimestamp ? new Date(fromTimestamp) : undefined);

    res.json({
      success: true,
      data: {
        message: 'Event replay completed successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to replay events', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/events/stats", async (req, res) => {
  try {
    const stats = eventSourcingSystem.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get event sourcing stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Microservicios y Service Mesh
app.post("/v1/microservices/register", (req, res) => {
  try {
    const serviceData = req.body;
    const serviceId = serviceRegistry.register(serviceData);
    
    res.status(201).json({
      success: true,
      data: {
        serviceId,
        message: 'Service registered successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to register service', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/microservices/deregister/:serviceId", (req, res) => {
  try {
    const { serviceId } = req.params;
    const deregistered = serviceRegistry.deregister(serviceId);
    
    if (!deregistered) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      data: {
        serviceId,
        message: 'Service deregistered successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to deregister service', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/microservices/services", (req, res) => {
  try {
    const { name, version, environment, region, health, status } = req.query;
    
    let services = serviceRegistry.getAllServices();
    
    // Aplicar filtros
    if (name) {
      services = services.filter(s => s.name === name);
    }
    if (version) {
      services = services.filter(s => s.version === version);
    }
    if (environment) {
      services = services.filter(s => s.metadata.environment === environment);
    }
    if (region) {
      services = services.filter(s => s.metadata.region === region);
    }
    if (health) {
      services = services.filter(s => s.health === health);
    }
    if (status) {
      services = services.filter(s => s.status === status);
    }
    
    res.json({
      success: true,
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    logger.error('Failed to get services', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/microservices/discover/:serviceName", (req, res) => {
  try {
    const { serviceName } = req.params;
    const { version, environment, region, health, status } = req.query;
    
    const filters: any = {};
    if (version) filters.version = version;
    if (environment) filters.environment = environment;
    if (region) filters.region = region;
    if (health) filters.health = health;
    if (status) filters.status = status;
    
    const instances = serviceDiscovery.discover(serviceName, filters);
    
    res.json({
      success: true,
      data: {
        serviceName,
        instances,
        count: instances.length
      }
    });
  } catch (error) {
    logger.error('Failed to discover services', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/microservices/request", async (req, res) => {
  try {
    const { serviceName, path, method, headers, body, timeout, retries } = req.body;
    
    const response = await serviceMesh.request({
      serviceName,
      path,
      method,
      headers: headers || {},
      body,
      timeout,
      retries,
    });
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Service mesh request failed', { error: (error as Error).message });
    res.status(500).json({ 
      error: (error as Error).message,
      code: 'SERVICE_MESH_ERROR'
    });
  }
});

app.get("/v1/microservices/stats", (req, res) => {
  try {
    const meshStats = serviceMesh.getStats();
    const registryStats = {
      totalServices: serviceRegistry.getAllServices().length,
      healthyServices: serviceRegistry.getAllServices().filter(s => s.health === 'healthy').length,
      onlineServices: serviceRegistry.getAllServices().filter(s => s.status === 'online').length,
    };
    
    res.json({
      success: true,
      data: {
        serviceMesh: meshStats,
        serviceRegistry: registryStats,
      }
    });
  } catch (error) {
    logger.error('Failed to get microservices stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/microservices/heartbeat/:serviceId", (req, res) => {
  try {
    const { serviceId } = req.params;
    const success = serviceRegistry.heartbeat(serviceId);
    
    if (!success) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      data: {
        serviceId,
        message: 'Heartbeat received successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to process heartbeat', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/microservices/health/:serviceId", (req, res) => {
  try {
    const { serviceId } = req.params;
    const { health } = req.body;
    
    const success = serviceRegistry.updateHealth(serviceId, health);
    
    if (!success) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      data: {
        serviceId,
        health,
        message: 'Health updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update service health', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/microservices/circuit-breaker/reset/:serviceName", (req, res) => {
  try {
    const { serviceName } = req.params;
    const success = serviceMesh.resetCircuitBreaker(serviceName);
    
    if (!success) {
      return res.status(404).json({ error: 'Circuit breaker not found' });
    }

    res.json({
      success: true,
      data: {
        serviceName,
        message: 'Circuit breaker reset successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to reset circuit breaker', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints demo con rate limiting específico
app.get("/v1/demo/health", rateLimitByEndpoint, (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      organizationId: req.organizationId,
      requestId: req.requestId
    }
  });
});

app.get("/v1/demo/metrics", rateLimitByEndpoint, (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
      organizationId: req.organizationId,
      requestId: req.requestId
    }
  });
});

app.get("/v1/demo/ai", rateLimitByEndpoint, async (req, res) => {
  try {
    const { prompt = "Hello, how are you?", model = "gpt-4" } = req.query;
    
    // Check cache first
    const cachedResponse = await cacheManager.getAICache().getAIResponse(prompt as string, model as string);
    
    if (cachedResponse) {
      logger.info('AI response served from cache', { 
        prompt: prompt as string, 
        model: model as string,
        requestId: req.requestId 
      });
      
      return res.json({
        success: true,
        data: {
          ...cachedResponse,
          cached: true,
          timestamp: new Date().toISOString(),
          organizationId: req.organizationId,
          requestId: req.requestId
        }
      });
    }

    // Generate demo response
    const demoResponse = {
      content: `This is a demo AI response for: "${prompt}" using model: ${model}`,
      model: model as string,
      timestamp: Date.now(),
    };

    // Cache the response
    await cacheManager.getAICache().setAIResponse(prompt as string, model as string, demoResponse);
    
    logger.info('AI response generated and cached', { 
      prompt: prompt as string, 
      model: model as string,
      requestId: req.requestId 
    });

    res.json({
      success: true,
      data: {
        ...demoResponse,
        cached: false,
        timestamp: new Date().toISOString(),
        organizationId: req.organizationId,
        requestId: req.requestId
      }
    });
  } catch (error) {
    logger.error('Failed to process AI request', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/demo/search", rateLimitByEndpoint, async (req, res) => {
  try {
    const { query = "artificial intelligence", filters } = req.query;
    
    // Check cache first
    const cachedResults = await cacheManager.getSearchCache().getSearchResults(query as string, filters);
    
    if (cachedResults) {
      logger.info('Search results served from cache', { 
        query: query as string, 
        filters,
        requestId: req.requestId 
      });
      
      return res.json({
        success: true,
        data: {
          ...cachedResults,
          cached: true,
          timestamp: new Date().toISOString(),
          organizationId: req.organizationId,
          requestId: req.requestId
        }
      });
    }

    // Generate demo search results
    const demoResults = {
      items: [
        { title: `Demo result 1 for: ${query}`, url: "https://example.com/result1" },
        { title: `Demo result 2 for: ${query}`, url: "https://example.com/result2" },
        { title: `Demo result 3 for: ${query}`, url: "https://example.com/result3" },
      ],
      total: 3,
      query: query as string,
      filters,
      timestamp: Date.now(),
    };

    // Cache the results
    await cacheManager.getSearchCache().setSearchResults(query as string, demoResults, filters);
    
    logger.info('Search results generated and cached', { 
      query: query as string, 
      filters,
      requestId: req.requestId 
    });

    res.json({
      success: true,
      data: {
        ...demoResults,
        cached: false,
        timestamp: new Date().toISOString(),
        organizationId: req.organizationId,
        requestId: req.requestId
      }
    });
  } catch (error) {
    logger.error('Failed to process search request', { error: error as Error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/demo/crm", rateLimitByEndpoint, (req, res) => {
  res.json({
    success: true,
    data: {
      message: "CRM endpoint demo",
      timestamp: new Date().toISOString(),
      organizationId: req.organizationId,
      requestId: req.requestId
    }
  });
});

app.get("/v1/demo/products", rateLimitByEndpoint, (req, res) => {
  res.json({
    success: true,
    data: {
      message: "Products endpoint demo",
      timestamp: new Date().toISOString(),
      organizationId: req.organizationId,
      requestId: req.requestId
    }
  });
});

app.get("/v1/demo/dashboard", rateLimitByEndpoint, (req, res) => {
  res.json({
    success: true,
    data: {
      message: "Dashboard endpoint demo",
      timestamp: new Date().toISOString(),
      organizationId: req.organizationId,
      requestId: req.requestId
    }
  });
});

// Endpoint de métricas para Prometheus
app.get("/metrics", (req, res) => {
  try {
    const prometheusMetrics = metrics.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: error as Error });
    res.status(500).send('# Error generating Prometheus metrics\n');
  }
});

// Middleware de manejo de errores
app.use(errorObservabilityMiddleware);

// Middleware para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  logger.info(`API Express server running on port ${PORT}`);
  console.log(`🚀 API Express server running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`🔍 Health check at http://localhost:${PORT}/health/live`);
  console.log(`⚡ Rate limiting enabled with intelligent strategies`);
  console.log(`🚨 Alert system integrated and monitoring`);
  console.log(`💾 Cache system initialized with AI and Search caches`);
  console.log(`💰 FinOps system enabled with cost tracking and budget management`);
  console.log(`🔒 Row Level Security (RLS) enabled with multi-tenant isolation`);
  console.log(`🌐 API Gateway enabled with intelligent routing and load balancing`);
  console.log(`📊 Event Sourcing and CQRS system enabled with aggregates and projections`);
  console.log(`🔗 Microservices system enabled with service mesh and discovery`);
  
  // Inicializar warmup del caché
  try {
    await cacheManager.warmupAll();
    console.log(`🔥 Cache warmup completed successfully`);
  } catch (error) {
    console.log(`⚠️ Cache warmup failed: ${error}`);
  }
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});