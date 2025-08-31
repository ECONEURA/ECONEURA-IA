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
import { configurationManager } from "./lib/configuration.js";
import { featureFlagInfoMiddleware, requireFeatureFlag } from "./middleware/feature-flags.js";
import { notificationSystem } from "./lib/notifications.js";
// import { workflowEngine } from "./lib/workflows.js";
// import { inventorySystem } from "./lib/inventory.js";
import { advancedAIChatSystem } from "./lib/ai-chat.js";
// import { analyticsSystem } from "./lib/analytics.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Inicializar cache manager
const cacheManager = new CacheManager();

// Middleware básico
app.use(cors());
app.use(express.json());

// Middleware de Feature Flags (agregar información a todas las respuestas)
app.use(featureFlagInfoMiddleware());

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

// Endpoints de Configuración y Feature Flags
app.get("/v1/config/feature-flags", (req, res) => {
  try {
    const { environment } = req.query;
    
    let flags = configurationManager.getAllFeatureFlags();
    if (environment) {
      flags = flags.filter(flag => flag.environment === environment);
    }
    
    res.json({
      success: true,
      data: {
        flags,
        count: flags.length
      }
    });
  } catch (error) {
    logger.error('Failed to get feature flags', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/feature-flags", (req, res) => {
  try {
    const flagData = req.body;
    const flagId = configurationManager.createFeatureFlag(flagData);
    
    res.status(201).json({
      success: true,
      data: {
        flagId,
        message: 'Feature flag created successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to create feature flag', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.put("/v1/config/feature-flags/:flagId", (req, res) => {
  try {
    const { flagId } = req.params;
    const updates = req.body;
    
    const updated = configurationManager.updateFeatureFlag(flagId, updates);
    
    if (!updated) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    res.json({
      success: true,
      data: {
        flagId,
        message: 'Feature flag updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update feature flag', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/config/feature-flags/:flagId", (req, res) => {
  try {
    const { flagId } = req.params;
    const deleted = configurationManager.deleteFeatureFlag(flagId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    res.json({
      success: true,
      data: {
        flagId,
        message: 'Feature flag deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to delete feature flag', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/feature-flags/:flagId/check", (req, res) => {
  try {
    const { flagId } = req.params;
    const context = req.body;
    
    const isEnabled = configurationManager.isFeatureEnabled(flagId, context);
    
    res.json({
      success: true,
      data: {
        flagId,
        isEnabled,
        context
      }
    });
  } catch (error) {
    logger.error('Failed to check feature flag', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/config/environments", (req, res) => {
  try {
    const { name } = req.query;
    
    if (name) {
      const config = configurationManager.getEnvironmentConfig(name as string);
      if (!config) {
        return res.status(404).json({ error: 'Environment not found' });
      }
      
      res.json({
        success: true,
        data: config
      });
    } else {
      const stats = configurationManager.getStats();
      res.json({
        success: true,
        data: {
          environments: stats.environments,
          count: stats.environments.length
        }
      });
    }
  } catch (error) {
    logger.error('Failed to get environments', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/config/environments/:environment", (req, res) => {
  try {
    const { environment } = req.params;
    const config = req.body;
    
    const updated = configurationManager.setEnvironmentConfig(environment, config);
    
    if (!updated) {
      return res.status(400).json({ error: 'Failed to update environment config' });
    }

    res.json({
      success: true,
      data: {
        environment,
        message: 'Environment config updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update environment config', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/config/values/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { environment, defaultValue } = req.query;
    
    const value = configurationManager.getConfigValue(key, environment as string, defaultValue);
    
    res.json({
      success: true,
      data: {
        key,
        value,
        environment: environment || 'default'
      }
    });
  } catch (error) {
    logger.error('Failed to get config value', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/config/values/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { value, environment } = req.body;
    
    const set = configurationManager.setConfigValue(key, value, environment);
    
    if (!set) {
      return res.status(400).json({ error: 'Failed to set config value' });
    }

    res.json({
      success: true,
      data: {
        key,
        value,
        environment: environment || 'default',
        message: 'Config value set successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to set config value', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/config/secrets/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { environment } = req.query;
    
    const secret = configurationManager.getSecret(key, environment as string);
    
    if (!secret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    res.json({
      success: true,
      data: {
        key,
        hasValue: true,
        environment: environment || 'default'
      }
    });
  } catch (error) {
    logger.error('Failed to get secret', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/config/secrets/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { value, environment } = req.body;
    
    const set = configurationManager.setSecret(key, value, environment);
    
    if (!set) {
      return res.status(400).json({ error: 'Failed to set secret' });
    }

    res.json({
      success: true,
      data: {
        key,
        hasValue: true,
        environment: environment || 'default',
        message: 'Secret set successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to set secret', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/config/stats", (req, res) => {
  try {
    const stats = configurationManager.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get config stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/validate", (req, res) => {
  try {
    const isValid = configurationManager.validateConfiguration();
    
    res.json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Configuration is valid' : 'Configuration has errors'
      }
    });
  } catch (error) {
    logger.error('Failed to validate configuration', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/reload", (req, res) => {
  try {
    configurationManager.reloadConfiguration();
    
    res.json({
      success: true,
      data: {
        message: 'Configuration reloaded successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to reload configuration', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint demo con feature flag requerido
app.get("/v1/config/beta-features", requireFeatureFlag('beta_features'), (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Beta features endpoint accessed successfully',
      features: [
        'Advanced Analytics',
        'AI Chat',
        'Real-time Dashboard',
        'Custom Integrations'
      ]
    }
  });
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

// ============================================================================
// ENDPOINTS DEL SISTEMA DE AI CHAT AVANZADO (COMENTADO - NO IMPLEMENTADO EN ESTA RAMA)
// ============================================================================

/*
// Endpoints de Sesiones
app.get("/v1/ai-chat/sessions", async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }
    const sessions = await advancedAIChatSystem.listSessions(userId as string, orgId as string);
    res.json(sessions);
  } catch (error) {
    logger.error('Failed to get sessions', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/ai-chat/sessions", async (req, res) => {
  try {
    const { userId, orgId, title, model } = req.body;
    const session = await advancedAIChatSystem.createSession(userId, orgId, title, model);
    res.status(201).json(session);
  } catch (error) {
    logger.error('Failed to create session', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/ai-chat/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await advancedAIChatSystem.getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    logger.error('Failed to get session', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/ai-chat/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await advancedAIChatSystem.deleteSession(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete session', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Endpoints de Chat
app.post("/v1/ai-chat/chat", async (req, res) => {
  try {
    const chatRequest = req.body;
    const response = await advancedAIChatSystem.processMessage(chatRequest);
    res.json(response);
  } catch (error) {
    logger.error('Failed to process chat message', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Endpoints de Modelos
app.get("/v1/ai-chat/models", async (req, res) => {
  try {
    const models = advancedAIChatSystem.getAvailableModels();
    res.json(models);
  } catch (error) {
    logger.error('Failed to get models', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Funciones
app.get("/v1/ai-chat/functions", async (req, res) => {
  try {
    const functions = advancedAIChatSystem.getAvailableFunctions();
    res.json(functions);
  } catch (error) {
    logger.error('Failed to get functions', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Análisis de Sentimientos
app.post("/v1/ai-chat/sentiment", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const sentiment = await advancedAIChatSystem.analyzeSentiment(text);
    res.json(sentiment);
  } catch (error) {
    logger.error('Failed to analyze sentiment', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Estadísticas
app.get("/v1/ai-chat/stats", async (req, res) => {
  try {
    const stats = await advancedAIChatSystem.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get statistics', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/ai-chat/sessions/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await advancedAIChatSystem.getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const duration = session.updatedAt.getTime() - session.createdAt.getTime();
    const stats = {
      messageCount: session.metadata?.messageCount || 0,
      totalTokens: session.metadata?.totalTokens || 0,
      totalCost: session.metadata?.totalCost || 0,
      averageSentiment: session.metadata?.averageSentiment || null,
      duration,
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get session stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/

// ============================================================================
// ENDPOINTS DEL SISTEMA DE ANALYTICS DE DATOS (COMENTADO - NO IMPLEMENTADO EN ESTA RAMA)
// ============================================================================

// Endpoints de Métricas
app.post("/v1/analytics/metrics", async (req, res) => {
  try {
    const query = req.body;
    const result = await analyticsSystem.getMetrics(query);
    res.json(result);
  } catch (error) {
    logger.error('Failed to get metrics', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/v1/analytics/metrics/realtime", async (req, res) => {
  try {
    const { metrics } = req.body;
    const result = await analyticsSystem.getRealTimeMetrics(metrics);
    res.json(result);
  } catch (error) {
    logger.error('Failed to get real-time metrics', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/analytics/metrics/available", async (req, res) => {
  try {
    const metrics = await analyticsSystem.getAvailableMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get available metrics', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/analytics/dimensions/available", async (req, res) => {
  try {
    const dimensions = await analyticsSystem.getAvailableDimensions();
    res.json(dimensions);
  } catch (error) {
    logger.error('Failed to get available dimensions', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/analytics/sample-data", async (req, res) => {
  try {
    const data = await analyticsSystem.getSampleData();
    res.json(data);
  } catch (error) {
    logger.error('Failed to get sample data', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Dashboards
app.get("/v1/analytics/dashboards", async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }
    const dashboards = await analyticsSystem.listDashboards(userId as string, orgId as string);
    res.json(dashboards);
  } catch (error) {
    logger.error('Failed to get dashboards', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/analytics/dashboards", async (req, res) => {
  try {
    const dashboard = req.body;
    const result = await analyticsSystem.createDashboard(dashboard);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to create dashboard', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/analytics/dashboards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dashboard = await analyticsSystem.getDashboard(id);
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json(dashboard);
  } catch (error) {
    logger.error('Failed to get dashboard', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/analytics/dashboards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await analyticsSystem.updateDashboard(id, updates);
    res.json(result);
  } catch (error) {
    logger.error('Failed to update dashboard', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/analytics/dashboards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await analyticsSystem.deleteDashboard(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete dashboard', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Endpoints de Reportes
app.get("/v1/analytics/reports", async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }
    const reports = await analyticsSystem.listReports(userId as string, orgId as string);
    res.json(reports);
  } catch (error) {
    logger.error('Failed to get reports', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/analytics/reports", async (req, res) => {
  try {
    const report = req.body;
    const result = await analyticsSystem.createReport(report);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to create report', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/analytics/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const report = await analyticsSystem.getReport(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    logger.error('Failed to get report', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/analytics/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await analyticsSystem.updateReport(id, updates);
    res.json(result);
  } catch (error) {
    logger.error('Failed to update report', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/analytics/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await analyticsSystem.deleteReport(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete report', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/v1/analytics/reports/:id/generate", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await analyticsSystem.generateReport(id);
    res.json(result);
  } catch (error) {
    logger.error('Failed to generate report', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// ENDPOINTS DEL SISTEMA DE NOTIFICACIONES
// ============================================================================

// GET /v1/notifications - Listar notificaciones
app.get("/v1/notifications", async (req, res) => {
  try {
    const { userId, orgId, status, type, priority, limit, offset } = req.query;
    
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const notifications = await notificationSystem.getNotifications(userId as string, orgId as string, filters);
    res.json(notifications);
  } catch (error) {
    logger.error('Failed to get notifications', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/notifications - Crear notificación
app.post("/v1/notifications", async (req, res) => {
  try {
    const notification = await notificationSystem.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    logger.error('Failed to create notification', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /v1/notifications/:id - Obtener notificación específica
app.get("/v1/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationSystem.getNotification(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    logger.error('Failed to get notification', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/notifications/:id - Actualizar notificación
app.put("/v1/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const notification = await notificationSystem.updateNotification(id, updates);
    res.json(notification);
  } catch (error) {
    logger.error('Failed to update notification', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// DELETE /v1/notifications/:id - Eliminar notificación
app.delete("/v1/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await notificationSystem.deleteNotification(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete notification', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /v1/notifications/:id/read - Marcar como leída
app.post("/v1/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationSystem.markAsRead(id);
    res.json(notification);
  } catch (error) {
    logger.error('Failed to mark notification as read', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /v1/notifications/read-all - Marcar todas como leídas
app.post("/v1/notifications/read-all", async (req, res) => {
  try {
    const { userId, orgId } = req.body;
    
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }

    const result = await notificationSystem.markAllAsRead(userId, orgId);
    res.json(result);
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /v1/notifications/unread-count - Contar no leídas
app.get("/v1/notifications/unread-count", async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }

    const count = await notificationSystem.getUnreadCount(userId as string, orgId as string);
    res.json({ count });
  } catch (error) {
    logger.error('Failed to get unread count', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/notifications/templates - Listar templates
app.get("/v1/notifications/templates", async (req, res) => {
  try {
    const { orgId } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }

    const templates = await notificationSystem.getTemplates(orgId as string);
    res.json(templates);
  } catch (error) {
    logger.error('Failed to get templates', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/notifications/templates - Crear template
app.post("/v1/notifications/templates", async (req, res) => {
  try {
    const template = await notificationSystem.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    logger.error('Failed to create template', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /v1/notifications/templates/:id - Obtener template específico
app.get("/v1/notifications/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const template = await notificationSystem.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    logger.error('Failed to get template', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/notifications/templates/:id - Actualizar template
app.put("/v1/notifications/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const template = await notificationSystem.updateTemplate(id, updates);
    res.json(template);
  } catch (error) {
    logger.error('Failed to update template', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// DELETE /v1/notifications/templates/:id - Eliminar template
app.delete("/v1/notifications/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await notificationSystem.deleteTemplate(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete template', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /v1/notifications/preferences - Obtener preferencias
app.get("/v1/notifications/preferences", async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }

    const preferences = await notificationSystem.getPreferences(userId as string, orgId as string);
    res.json(preferences);
  } catch (error) {
    logger.error('Failed to get preferences', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/notifications/preferences - Actualizar preferencias
app.put("/v1/notifications/preferences", async (req, res) => {
  try {
    const preferences = await notificationSystem.updatePreferences(req.body);
    res.json(preferences);
  } catch (error) {
    logger.error('Failed to update preferences', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /v1/notifications/send - Enviar notificación
app.post("/v1/notifications/send", async (req, res) => {
  try {
    const result = await notificationSystem.sendNotification(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Failed to send notification', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /v1/notifications/send/bulk - Enviar notificaciones en lote
app.post("/v1/notifications/send/bulk", async (req, res) => {
  try {
    const { notifications } = req.body;
    const result = await notificationSystem.sendBulkNotifications(notifications);
    res.json(result);
  } catch (error) {
    logger.error('Failed to send bulk notifications', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /v1/notifications/schedule - Programar notificación
app.post("/v1/notifications/schedule", async (req, res) => {
  try {
    const { notification, scheduledAt } = req.body;
    const result = await notificationSystem.scheduleNotification(notification, new Date(scheduledAt));
    res.json(result);
  } catch (error) {
    logger.error('Failed to schedule notification', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /v1/notifications/stats - Obtener estadísticas
app.get("/v1/notifications/stats", async (req, res) => {
  try {
    const { orgId } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }

    const stats = await notificationSystem.getStats(orgId as string);
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get notification stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
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
  console.log(`⚙️ Configuration system enabled with feature flags and environment management`);
  console.log(`📧 Notification system enabled with templates and multi-channel delivery`);
  
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