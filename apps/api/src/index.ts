import express, { type Application } from "express";
import cors, { type CorsOptions } from "cors";
import { logger } from './lib/logger.js';
import { metrics } from './lib/metrics.js';
import { finopsHeaders } from './middleware/finops.js';
import { finopsGuardDefault } from './middleware/finops.guard.js';
import { tracing } from './lib/tracing.js';
import { observabilityMiddleware, errorObservabilityMiddleware, healthCheckMiddleware } from './middleware/observability.js';
import { rateLimitMiddleware, rateLimitByEndpoint, rateLimitByUser, rateLimitByApiKey } from './middleware/rate-limiting.js';
import { alertSystem } from './lib/alerts.js';
import { rateLimiter } from './lib/rate-limiting.js';
import { CacheManager } from './lib/cache.js';
import { finOpsSystem } from './lib/finops.js';
import { rlsSystem } from './lib/rls.js';
import { rlsMiddleware, rlsAccessControlMiddleware, rlsDataSanitizationMiddleware, rlsResponseValidationMiddleware, rlsCleanupMiddleware } from './middleware/rls.js';
import { apiGateway } from './lib/gateway.js';
import { gatewayRoutingMiddleware, gatewayProxyMiddleware, gatewayMetricsMiddleware, gatewayCircuitBreakerMiddleware } from './middleware/gateway.js';
import { eventSourcingSystem, createCommand, createQuery } from './lib/events.js';
import { registerUserHandlers } from './lib/handlers/user-handlers.js';
import { serviceRegistry, serviceDiscovery } from './lib/service-discovery.js';
import { serviceMesh } from './lib/service-mesh.js';
import { configurationManager } from './lib/configuration.js';
import { featureFlagInfoMiddleware, requireFeatureFlag } from './middleware/feature-flags.js';
import { workflowEngine } from './lib/workflows.js';
import { inventorySystem } from './lib/inventory.js';
import { securitySystem } from './lib/security.js';
import sepaRouter from './routes/sepa.js';
import progressRouter from './routes/progress.js';
import hilRouter from './routes/hil.js';
import { agentsRoutes } from './routes/agents.js';
import { makeHealthRouter } from './routes/integrations.make.health.js';
import { runAutoCancel } from './jobs/hil-autocancel.js';
import { startHilExpirer } from './cron/hil-expirer.js';
import { latency } from './middleware/latency.js';
import { hilApprovals } from './routes/hil.approvals.js';
import { hilAliasRouter } from './routes/hil.alias.js';
import { hilApprovalsRouterV2 } from './routes/hil.approvals.v2.js';
import adminFinopsRouter from './routes/admin.finops.js';
// NOTE: Avoid static import of the DB package to keep tests lightweight.
// We'll dynamically import and init Prisma only when DB env is present.

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Inicializar cache manager
const cacheManager = new CacheManager();

// Middleware básico
// CORS endurecido: sólo orígenes explícitos y manejo de preflight
const allowedOrigins = Array.from(new Set([
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean) : []),
  process.env.WEB_URL,
  process.env.NEXT_PUBLIC_WEB_URL,
  "https://www.econeura.com",
].filter(Boolean)));

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Correlation-Id",
    "X-Request-Id",
    "X-Trace-Id",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Middleware de Feature Flags (agregar información a todas las respuestas)
app.use(featureFlagInfoMiddleware());

// Middleware de observabilidad
app.use(observabilityMiddleware);

// Middleware de rate limiting (aplicar antes de las rutas)
app.use(rateLimitMiddleware);

// FinOps guard + headers en todas las rutas /v1/*
app.use('/v1', finopsGuardDefault);
app.use('/v1', finopsHeaders());
// Latency header para todas las rutas
app.use(latency());

// Middleware de health check
app.use(healthCheckMiddleware);

// Middleware de Row Level Security
app.use(rlsMiddleware);
app.use(rlsCleanupMiddleware);

// Inicializar Prisma middleware sólo si hay configuración de BD disponible (sin await de nivel superior)
(() => {
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    import('@econeura/db')
      .then((mod: any) => {
        const init = mod.initPrisma ?? mod.default?.initPrisma;
        if (typeof init === 'function') init();
      })
      .catch((err: any) => {
        logger.warn('initPrisma failed', { error: (err as Error).message });
      });
  }
})();

// Middleware de API Gateway
app.use(gatewayMetricsMiddleware);
app.use(gatewayCircuitBreakerMiddleware);
app.use(gatewayRoutingMiddleware);
app.use(gatewayProxyMiddleware);

// SEPA import/reconciliation (PR-42 scaffold)
app.use('/v1/sepa', sepaRouter);
// Serve generated progress status
app.use(progressRouter);
app.use(hilRouter);
app.use(hilApprovals);
app.use(hilAliasRouter);
app.use(hilApprovalsRouterV2);
// Admin FinOps endpoints
app.use(adminFinopsRouter);
// Agents endpoints
app.use(agentsRoutes);
// Integrations health endpoints
app.use(makeHealthRouter);

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

// Run auto-cancel job in background (best-effort)
runAutoCancel().catch(err => logger.warn('HIL auto-cancel job failed', { error: (err as Error).message }));

// Start HIL expirer cron (best-effort, only when DB is configured)
try {
  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (hasDb) {
    // Lazy getter to avoid importing @econeura/db at module init
    const getPrisma = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@econeura/db');
      return (mod.getPrisma ?? mod.default?.getPrisma)();
    };
    startHilExpirer(getPrisma);
  }
} catch (err) {
  logger.warn('HIL expirer not started', { error: (err as Error).message });
}

  // Inicializar workflows de ejemplo
  const initializeExampleWorkflows = () => {
    // Workflow BPMN de ejemplo: Proceso de Onboarding
    // TODO: Fix workflow type definitions
    /*
    const onboardingWorkflowId = workflowEngine.createWorkflow({
    name: 'User Onboarding Process',
    version: 1.0,
    description: 'BPMN workflow for user onboarding',
    type: 'bpmn',
    definition: {
      elements: [
        {
          id: 'start',
          type: 'startEvent',
          name: 'Start Onboarding',
          position: { x: 100, y: 100 },
          properties: {},
          actions: ['sendEmail'],
        },
        {
          id: 'validate',
          type: 'task',
          name: 'Validate User Data',
          position: { x: 300, y: 100 },
          properties: { timeout: 5000 },
          actions: ['httpRequest'],
        },
        {
          id: 'approve',
          type: 'gateway',
          name: 'Approve User',
          position: { x: 500, y: 100 },
          properties: {},
          conditions: '${userType} === "premium"',
        },
        {
          id: 'premium',
          type: 'task',
          name: 'Premium Setup',
          position: { x: 700, y: 50 },
          properties: {},
          actions: ['notification'],
        },
        {
          id: 'standard',
          type: 'task',
          name: 'Standard Setup',
          position: { x: 700, y: 150 },
          properties: {},
          actions: ['delay'],
        },
        {
          id: 'complete',
          type: 'endEvent',
          name: 'Onboarding Complete',
          position: { x: 900, y: 100 },
          properties: {},
          actions: ['sendEmail'],
        },
      ],
      flows: [
        { id: 'flow1', sourceId: 'start', targetId: 'validate', properties: {} },
        { id: 'flow2', sourceId: 'validate', targetId: 'approve', properties: {} },
        { id: 'flow3', sourceId: 'approve', targetId: 'premium', condition: '${userType} === "premium"', properties: {} },
        { id: 'flow4', sourceId: 'approve', targetId: 'standard', condition: '${userType} !== "premium"', properties: {} },
        { id: 'flow5', sourceId: 'premium', targetId: 'complete', properties: {} },
        { id: 'flow6', sourceId: 'standard', targetId: 'complete', properties: {} },
      ],
      startEvent: 'start',
      endEvents: ['complete'],
    },
    metadata: {
      author: 'System',
      category: 'User Management',
      tags: ['onboarding', 'user', 'bpmn'],
      priority: 1,
      timeout: 300000, // 5 minutos
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000,
      },
      notifications: [
        {
          type: 'email',
          trigger: 'complete',
          config: { template: 'onboarding-complete' },
        },
      ],
    },
  });

  // Workflow State Machine de ejemplo: Order Processing
  const orderWorkflowId = workflowEngine.createWorkflow({
    name: 'Order Processing State Machine',
    version: 1.0,
    description: 'State machine for order processing',
    type: 'state_machine',
    definition: {
      states: [
        {
          id: 'pending',
          name: 'Pending',
          type: 'initial',
          actions: [
            {
              type: 'notification',
              name: 'sendOrderConfirmation',
              config: { template: 'order-confirmation' },
              order: 1,
            },
          ],
          properties: {},
        },
        {
          id: 'processing',
          name: 'Processing',
          type: 'intermediate',
          actions: [
            {
              type: 'http',
              name: 'validatePayment',
              config: { url: '/api/payment/validate' },
              order: 1,
            },
            {
              type: 'function',
              name: 'updateInventory',
              config: { function: 'updateInventory' },
              order: 2,
            },
          ],
          timeout: 30000, // 30 segundos
          properties: {},
        },
        {
          id: 'shipped',
          name: 'Shipped',
          type: 'intermediate',
          actions: [
            {
              type: 'notification',
              name: 'sendShippingNotification',
              config: { template: 'shipping-notification' },
              order: 1,
            },
          ],
          properties: {},
        },
        {
          id: 'delivered',
          name: 'Delivered',
          type: 'final',
          actions: [
            {
              type: 'notification',
              name: 'sendDeliveryConfirmation',
              config: { template: 'delivery-confirmation' },
              order: 1,
            },
          ],
          properties: {},
        },
        {
          id: 'cancelled',
          name: 'Cancelled',
          type: 'final',
          actions: [
            {
              type: 'notification',
              name: 'sendCancellationNotification',
              config: { template: 'cancellation-notification' },
              order: 1,
            },
          ],
          properties: {},
        },
      ],
      transitions: [
        {
          id: 'start-processing',
          fromState: 'pending',
          toState: 'processing',
          event: 'start_processing',
          actions: [],
          properties: {},
        },
        {
          id: 'ship-order',
          fromState: 'processing',
          toState: 'shipped',
          event: 'ship',
          condition: '${paymentValid} === true && ${inventoryAvailable} === true',
          actions: [],
          properties: {},
        },
        {
          id: 'deliver-order',
          fromState: 'shipped',
          toState: 'delivered',
          event: 'deliver',
          actions: [],
          properties: {},
        },
        {
          id: 'cancel-order',
          fromState: 'pending',
          toState: 'cancelled',
          event: 'cancel',
          actions: [],
          properties: {},
        },
        {
          id: 'cancel-processing',
          fromState: 'processing',
          toState: 'cancelled',
          event: 'cancel',
          actions: [],
          properties: {},
        },
      ],
      initialState: 'pending',
      finalStates: ['delivered', 'cancelled'],
    },
    metadata: {
      author: 'System',
      category: 'Order Management',
      tags: ['order', 'processing', 'state-machine'],
      priority: 'critical',
      timeout: 86400000, // 24 horas
      retryPolicy: {
        maxRetries: 5,
        backoffStrategy: 'linear',
        initialDelay: 2000,
        maxDelay: 30000,
      },
      notifications: [
        {
          type: 'email',
          trigger: 'complete',
          config: { template: 'order-complete' },
        },
        {
          type: 'webhook',
          trigger: 'error',
          config: { url: '/api/webhooks/order-error' },
        },
      ],
    },
  });

  */
  logger.info('Example workflows initialized - temporarily disabled');
};

initializeExampleWorkflows();

// Endpoints de health
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
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
  return res.json({
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
  return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/rate-limit/organizations/:organizationId", (req, res) => {
  try {
    const { organizationId } = req.params;
    const stats = rateLimiter.getOrganizationStats(organizationId);

    if (!stats) {
      return res.status(404).json({ error: 'Organization not found' });
    }

  return res.json({
      success: true,
      data: {
        organizationId,
        config: stats.config,
        state: stats.state,
        stats: stats.stats
      }
    });
  } catch (error) {
    logger.error('Failed to get organization stats', { error: (error as Error).message });
  return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/rate-limit/organizations", (req, res) => {
  try {
    const { organizationId, config } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    rateLimiter.addOrganization(organizationId, config || {});

  return res.status(201).json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit added successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to add organization', { error: (error as Error).message });
  return res.status(500).json({ error: 'Internal server error' });
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

  return res.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update organization', { error: (error as Error).message });
  return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/rate-limit/organizations/:organizationId", (req, res) => {
  try {
    const { organizationId } = req.params;
    const removed = rateLimiter.removeOrganization(organizationId);

    if (!removed) {
      return res.status(404).json({ error: 'Organization not found' });
    }

  return res.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit removed successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove organization', { error: (error as Error).message });
  return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/rate-limit/organizations/:organizationId/reset", (req, res) => {
  try {
    const { organizationId } = req.params;
    const reset = rateLimiter.resetOrganization(organizationId);

    if (!reset) {
      return res.status(404).json({ error: 'Organization not found' });
    }

  return res.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit reset successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to reset organization', { error: (error as Error).message });
  return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/rate-limit/stats", (req, res) => {
  try {
    const stats = rateLimiter.getGlobalStats();

  return res.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get rate limit stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de alertas (con rate limiting específico)
app.get("/v1/alerts/rules", rateLimitByEndpoint, (req, res) => {
  try {
    const rules = alertSystem.getAllRules();
  return res.json({
      success: true,
      data: {
        rules: rules,
        count: rules.length
      }
    });
  } catch (error) {
    logger.error('Failed to get alert rules', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/alerts/active", rateLimitByEndpoint, (req, res) => {
  try {
    const alerts = alertSystem.getActiveAlerts();
  return res.json({
      success: true,
      data: {
        alerts: alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    logger.error('Failed to get active alerts', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/alerts/stats", rateLimitByEndpoint, (req, res) => {
  try {
    const stats = alertSystem.getAlertStats();
  return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get alert stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/alerts/rules", rateLimitByEndpoint, (req, res) => {
  try {
    const rule = req.body;
    alertSystem.addRule(rule);

  return res.status(201).json({
      success: true,
      data: {
        rule,
        message: 'Alert rule added successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to add alert rule', { error: (error as Error).message });
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

  return res.json({
      success: true,
      data: {
        ruleId,
        message: 'Alert rule updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update alert rule', { error: (error as Error).message });
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

  return res.json({
      success: true,
      data: {
        ruleId,
        message: 'Alert rule removed successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove alert rule', { error: (error as Error).message });
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

  return res.json({
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

app.post("/v1/alerts/:alertId/resolve", rateLimitByEndpoint, (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy } = req.body;

    const resolved = alertSystem.resolveAlert(alertId);

    if (!resolved) {
      return res.status(404).json({ error: 'Alert not found' });
    }

  return res.json({
      success: true,
      data: {
        alertId,
        message: 'Alert resolved successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to resolve alert', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de observabilidad
app.get("/v1/observability/logs", (req, res) => {
  try {
    const logs = logger.getLogs();
  return res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    logger.error('Failed to get logs', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/observability/metrics", (req, res) => {
  try {
    const metricsData = metrics.getMetricsSummary();
  return res.json({
      success: true,
      data: {
        summary: metricsData,
        details: metrics.getAllMetrics()
      }
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/observability/metrics/prometheus", async (req, res) => {
  try {
    const [contentType, prometheusMetrics] = await Promise.all([
      metrics.getMetricsContentType(),
      metrics.exportPrometheus(),
    ]);
    res.set('Content-Type', contentType || 'text/plain');
    return res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: (error as Error).message });
    res.status(500).send('# Error generating Prometheus metrics\n');
  }
});

app.get("/v1/observability/traces", (req, res) => {
  try {
    const traces = tracing.getTraces();
  return res.json({
      success: true,
      data: {
        traces,
        count: traces.length
      }
    });
  } catch (error) {
    logger.error('Failed to get traces', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/observability/stats", (req, res) => {
  try {
    const stats = {
      logs: logger.getStats(),
      metrics: metrics.getMetricsStats(),
      traces: tracing.getStats()
    };

  return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get observability stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de caché
app.get("/v1/cache/stats", (req, res) => {
  try {
    const stats = cacheManager.getStats();
  return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/cache/warmup", (req, res) => {
  try {
    cacheManager.warmupAll();
  return res.json({
      success: true,
      data: {
        message: 'Cache warmup initiated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to initiate cache warmup', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/cache/warmup/start", (req, res) => {
  try {
    const { intervalMinutes = 60 } = req.body;
    cacheManager.startPeriodicWarmup(intervalMinutes);
  return res.json({
      success: true,
      data: {
        message: 'Periodic cache warmup started',
        intervalMinutes
      }
    });
  } catch (error) {
    logger.error('Failed to start periodic cache warmup', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/cache/warmup/stop", (req, res) => {
  try {
    cacheManager.stopPeriodicWarmup();
  return res.json({
      success: true,
      data: {
        message: 'Periodic cache warmup stopped'
      }
    });
  } catch (error) {
    logger.error('Failed to stop periodic cache warmup', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/cache/ai", (req, res) => {
  try {
    cacheManager.getAICache().clear();
  return res.json({
      success: true,
      data: {
        message: 'AI cache cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to clear AI cache', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/cache/search", (req, res) => {
  try {
    cacheManager.getSearchCache().clear();
  return res.json({
      success: true,
      data: {
        message: 'Search cache cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to clear search cache', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/cache/all", (req, res) => {
  try {
    cacheManager.getAICache().clear();
    cacheManager.getSearchCache().clear();
  return res.json({
      success: true,
      data: {
        message: 'All caches cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to clear all caches', { error: (error as Error).message });
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

  return res.json({
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

  return res.json({
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

  return res.status(201).json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.status(201).json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

  return res.json({
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

// Endpoints de Workflows y BPMN
app.get("/v1/workflows", async (req, res) => {
  try {
    const { type, category, status, tags } = req.query;

    const filters: any = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (tags) {
      if (Array.isArray(tags)) {
        filters.tags = tags;
      } else {
        filters.tags = [tags];
      }
    }

    const workflows = await workflowEngine.listWorkflows(filters);

    res.json(workflows);
  } catch (error) {
    logger.error('Failed to get workflows', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/workflows", async (req, res) => {
  try {
    const workflowData = req.body;
    const workflow = await workflowEngine.createWorkflow(workflowData);

    res.status(201).json({
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    logger.error('Failed to create workflow', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = await workflowEngine.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({
      data: workflow,
      message: 'Workflow retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get workflow', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const workflow = await workflowEngine.updateWorkflow(workflowId, updates);

    res.json({
      data: workflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update workflow', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = req.params;
    await workflowEngine.deleteWorkflow(workflowId);

    res.json({
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete workflow', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/workflows/:workflowId/start", async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { context = {}, metadata = {} } = req.body;

    const instance = await workflowEngine.startWorkflow(workflowId, context, metadata);

    res.status(200).json({
      data: instance,
      message: 'Workflow started successfully'
    });
  } catch (error) {
    logger.error('Failed to start workflow', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/workflows/instances", async (req, res) => {
  try {
    const { workflowId, status, userId, orgId, fromDate, toDate } = req.query;

    const filters: any = {};
    if (workflowId) filters.workflowId = workflowId;
    if (status) filters.status = status;
    if (userId) filters.userId = userId;
    if (orgId) filters.orgId = orgId;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const instances = await workflowEngine.listInstances(filters);

    res.json(instances);
  } catch (error) {
    logger.error('Failed to get workflow instances', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/workflows/instances/:instanceId", async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = await workflowEngine.getInstance(instanceId);

    if (!instance) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }

    res.json({
      data: instance,
      message: 'Workflow instance retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get workflow instance', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/workflows/instances/:instanceId/pause", async (req, res) => {
  try {
    const { instanceId } = req.params;
    await workflowEngine.pauseInstance(instanceId);

    res.json({
      message: 'Workflow instance paused successfully'
    });
  } catch (error) {
    logger.error('Failed to pause workflow instance', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/workflows/instances/:instanceId/resume", async (req, res) => {
  try {
    const { instanceId } = req.params;
    await workflowEngine.resumeInstance(instanceId);

    res.json({
      message: 'Workflow instance resumed successfully'
    });
  } catch (error) {
    logger.error('Failed to resume workflow instance', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/workflows/instances/:instanceId/cancel", async (req, res) => {
  try {
    const { instanceId } = req.params;
    await workflowEngine.cancelInstance(instanceId);

    res.json({
      message: 'Workflow instance cancelled successfully'
    });
  } catch (error) {
    logger.error('Failed to cancel workflow instance', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/workflows/instances/:instanceId/actions", async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { actionId } = req.body;

    await workflowEngine.executeAction(instanceId, actionId);

    res.json({
      message: 'Action executed successfully'
    });
  } catch (error) {
    logger.error('Failed to execute action', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/workflows/stats", async (req, res) => {
  try {
    const stats = await workflowEngine.getStats();

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get workflow stats', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints demo con rate limiting específico
app.get("/v1/demo/health", rateLimitByEndpoint, (req: any, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
  organizationId: String(req.organizationId ?? ''),
  requestId: String(req.requestId ?? '')
    }
  });
});

app.get("/v1/demo/metrics", rateLimitByEndpoint, (req: any, res) => {
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

app.get("/v1/demo/ai", rateLimitByEndpoint, async (req: any, res) => {
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
          organizationId: String(req.organizationId ?? ''),
          requestId: String(req.requestId ?? '')
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
      prompt: String(prompt ?? ''),
      model: String(model ?? ''),
      requestId: req.requestId
    });

  res.json({
      success: true,
      data: {
        ...demoResponse,
        cached: false,
        timestamp: new Date().toISOString(),
    organizationId: String(req.organizationId ?? ''),
    requestId: String(req.requestId ?? '')
      }
    });
  } catch (error) {
    logger.error('Failed to process AI request', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/demo/search", rateLimitByEndpoint, async (req: any, res) => {
  try {
    const { query = "artificial intelligence", filters } = req.query;

    // Check cache first
    const cachedResults = await cacheManager.getSearchCache().getSearchResults(query as string, filters);

    if (cachedResults) {
      logger.info('Search results served from cache', {
        queryJson: JSON.stringify({ q: query, filters }),
        filters,
        requestId: req.requestId
      });

    return res.json({
        success: true,
        data: {
          ...cachedResults,
          cached: true,
          timestamp: new Date().toISOString(),
      organizationId: String(req.organizationId ?? ''),
      requestId: String(req.requestId ?? '')
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
      queryJson: JSON.stringify({ q: query, filters }),
      filters,
      requestId: req.requestId
    });

  res.json({
      success: true,
      data: {
        ...demoResults,
        cached: false,
        timestamp: new Date().toISOString(),
    organizationId: String(req.organizationId ?? ''),
    requestId: String(req.requestId ?? '')
      }
    });
  } catch (error) {
    logger.error('Failed to process search request', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/demo/crm", rateLimitByEndpoint, (req: any, res) => {
  res.json({
    success: true,
    data: {
      message: "CRM endpoint demo",
      timestamp: new Date().toISOString(),
  organizationId: String(req.organizationId ?? ''),
  requestId: String(req.requestId ?? '')
    }
  });
});

app.get("/v1/demo/products", rateLimitByEndpoint, (req: any, res) => {
  res.json({
    success: true,
    data: {
      message: "Products endpoint demo",
      timestamp: new Date().toISOString(),
  organizationId: String(req.organizationId ?? ''),
  requestId: String(req.requestId ?? '')
    }
  });
});

app.get("/v1/demo/dashboard", rateLimitByEndpoint, (req: any, res) => {
  res.json({
    success: true,
    data: {
      message: "Dashboard endpoint demo",
      timestamp: new Date().toISOString(),
  organizationId: String(req.organizationId ?? ''),
  requestId: String(req.requestId ?? '')
    }
  });
});

// ============================================================================
// ENDPOINTS DEL SISTEMA DE INVENTARIO
// ============================================================================

// Endpoints de Productos
app.get("/v1/inventory/products", async (req, res) => {
  try {
    const { category, supplier, location, lowStock, outOfStock, overstock, expiring, tags } = req.query;
    const filters: any = {};
    if (category) filters.category = category;
    if (supplier) filters.supplier = supplier;
    if (location) filters.location = location;
    if (lowStock === 'true') filters.lowStock = true;
    if (outOfStock === 'true') filters.outOfStock = true;
    if (overstock === 'true') filters.overstock = true;
    if (expiring === 'true') filters.expiring = true;
    if (tags) {
      if (Array.isArray(tags)) {
        filters.tags = tags;
      } else {
        filters.tags = [tags];
      }
    }
    const products = await inventorySystem.listProducts(filters);
    res.json(products);
  } catch (error) {
    logger.error('Failed to get products', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/inventory/products", async (req, res) => {
  try {
    const productData = req.body;
    const product = await inventorySystem.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    logger.error('Failed to create product', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/inventory/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await inventorySystem.getProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    logger.error('Failed to get product', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/inventory/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const product = await inventorySystem.updateProduct(id, updates);
    res.json(product);
  } catch (error) {
    logger.error('Failed to update product', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/inventory/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await inventorySystem.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete product', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Endpoints de Transacciones
app.get("/v1/inventory/transactions", async (req, res) => {
  try {
    const { productId, type, fromDate, toDate, userId, orgId } = req.query;
    const filters: any = {};
    if (productId) filters.productId = productId;
    if (type) filters.type = type;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);
    if (userId) filters.userId = userId;
    if (orgId) filters.orgId = orgId;
    const transactions = await inventorySystem.listTransactions(filters);
    res.json(transactions);
  } catch (error) {
    logger.error('Failed to get transactions', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/inventory/transactions", async (req, res) => {
  try {
    const transactionData = req.body;
    const transaction = await inventorySystem.addTransaction(transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    logger.error('Failed to create transaction', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/inventory/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await inventorySystem.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    logger.error('Failed to get transaction', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de Alertas
app.get("/v1/inventory/alerts", async (req, res) => {
  try {
    const { productId, type, status, severity, fromDate, toDate, orgId } = req.query;
    const filters: any = {};
    if (productId) filters.productId = productId;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);
    if (orgId) filters.orgId = orgId;
    const alerts = await inventorySystem.listAlerts(filters);
    res.json(alerts);
  } catch (error) {
    logger.error('Failed to get alerts', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/inventory/alerts", async (req, res) => {
  try {
    const alertData = req.body;
    const alert = await inventorySystem.createAlert(alertData);
    res.status(201).json(alert);
  } catch (error) {
    logger.error('Failed to create alert', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/inventory/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await inventorySystem.getAlert(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    logger.error('Failed to get alert', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/v1/inventory/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const alert = await inventorySystem.updateAlert(id, updates);
    res.json(alert);
  } catch (error) {
    logger.error('Failed to update alert', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/v1/inventory/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await inventorySystem.deleteAlert(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete alert', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/v1/inventory/alerts/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    await inventorySystem.acknowledgeAlert(id, userId);
    res.status(200).json({ message: 'Alert acknowledged successfully' });
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/v1/inventory/alerts/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    await inventorySystem.resolveAlert(id);
    res.status(200).json({ message: 'Alert resolved successfully' });
  } catch (error) {
    logger.error('Failed to resolve alert', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Endpoints de Reportes
app.get("/v1/inventory/report", async (req, res) => {
  try {
    const report = await inventorySystem.getInventoryReport();
    res.json(report);
  } catch (error) {
    logger.error('Failed to get inventory report', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/inventory/products/:id/report", async (req, res) => {
  try {
    const { id } = req.params;
    const report = await inventorySystem.getProductReport(id);
    res.json(report);
  } catch (error) {
    logger.error('Failed to get product report', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/inventory/products/:id/kardex", async (req, res) => {
  try {
    const { id } = req.params;
    const kardex = await inventorySystem.getProductKardex(id);
    res.json(kardex);
  } catch (error) {
    logger.error('Failed to get product kardex', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/inventory/products/:id/kardex-report", async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;
    const from = fromDate ? new Date(fromDate as string) : undefined;
    const to = toDate ? new Date(toDate as string) : undefined;
    const report = await inventorySystem.getKardexReport(id, from, to);
    res.json(report);
  } catch (error) {
    logger.error('Failed to get kardex report', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// ADVANCED SECURITY SYSTEM ENDPOINTS
// ============================================================================

// User Management
app.post("/v1/security/users", async (req, res) => {
  try {
    const { email, username, password, roles } = req.body;
    const user = await securitySystem.createUser(email, username, password, roles);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Failed to create user', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/v1/security/users", async (req, res) => {
  try {
    const users = await securitySystem.getUsers();
    res.json(users);
  } catch (error) {
    logger.error('Failed to get users', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/security/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await securitySystem.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Failed to get user', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Authentication
app.post("/v1/security/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await securitySystem.authenticateUser(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result);
  } catch (error) {
    logger.error('Authentication failed', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// MFA Management
app.post("/v1/security/mfa/setup", async (req, res) => {
  try {
    const { userId, method } = req.body;
    if (!userId || !method) {
      return res.status(400).json({ error: 'userId and method are required' });
    }

    const result = await securitySystem.setupMFA(userId, method);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to setup MFA', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/security/mfa/verify", async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ error: 'userId and code are required' });
    }

    const isValid = await securitySystem.verifyMFA(userId, code);
    res.json({ valid: isValid });
  } catch (error) {
    logger.error('MFA verification failed', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Role and Permission Management
app.post("/v1/security/roles", async (req, res) => {
  try {
    const { name, description, permissions, orgId } = req.body;
    if (!name || !orgId) {
      return res.status(400).json({ error: 'name and orgId are required' });
    }

    const role = await securitySystem.createRole(name, description || '', permissions || [], orgId);
    res.status(201).json(role);
  } catch (error) {
    logger.error('Failed to create role', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Role and Permission Management
// (ruta duplicada eliminada: POST /v1/security/roles)

app.get("/v1/security/roles", async (req, res) => {
  try {
    const roles = await securitySystem.getRoles();
    res.json(roles);
  } catch (error) {
    logger.error('Failed to get roles', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/security/permissions", async (req, res) => {
  try {
    const { name, description, resource, action, orgId } = req.body;
    if (!name || !resource || !action || !orgId) {
      return res.status(400).json({ error: 'name, resource, action, and orgId are required' });
    }

    const permission = await securitySystem.createPermission(name, description || '', resource, action, orgId);
    res.status(201).json(permission);
  } catch (error) {
    logger.error('Failed to create permission', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/security/permissions", async (req, res) => {
  try {
    const permissions = await securitySystem.getPermissions();
    res.json(permissions);
  } catch (error) {
    logger.error('Failed to get permissions', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/security/permissions/check", async (req, res) => {
  try {
    const { userId, resource, action } = req.body;
    if (!userId || !resource || !action) {
      return res.status(400).json({ error: 'userId, resource, and action are required' });
    }

    const hasPermission = await securitySystem.checkPermission(userId, resource, action);
    res.json({ hasPermission });
  } catch (error) {
    logger.error('Permission check failed', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Audit Logs
app.get("/v1/security/audit", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await securitySystem.getAuditLogs(limit);
    res.json(logs);
  } catch (error) {
    logger.error('Failed to get audit logs', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Security Events
app.get("/v1/security/events", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = await securitySystem.getSecurityEvents(limit);
    res.json(events);
  } catch (error) {
    logger.error('Failed to get security events', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Threat Intelligence
app.get("/v1/security/threats", async (req, res) => {
  try {
    const ipAddress = req.query.ip as string;
    if (!ipAddress) {
      return res.status(400).json({ error: 'ipAddress is required' });
    }

    const threatIntel = await securitySystem.checkIPReputation(ipAddress);
    res.json(threatIntel);
  } catch (error) {
    logger.error('Failed to get threat intelligence', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/security/threats/check", async (req, res) => {
  try {
    const { ipAddress } = req.body;
    if (!ipAddress) {
      return res.status(400).json({ error: 'ipAddress is required' });
    }

    const threatIntel = await securitySystem.checkIPReputation(ipAddress);
    res.json(threatIntel);
  } catch (error) {
    logger.error('IP reputation check failed', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Security Stats
app.get("/v1/security/stats", async (req, res) => {
  try {
    const stats = await securitySystem.getSecurityStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get security stats', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Endpoint de métricas para Prometheus
app.get("/metrics", async (req, res) => {
  try {
    const [contentType, prometheusMetrics] = await Promise.all([
      metrics.getMetricsContentType(),
      metrics.getPrometheusMetrics(),
    ]);
    res.set('Content-Type', contentType || 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: (error as Error).message });
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

// Iniciar servidor (evitar durante tests)
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
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
    console.log(`🔄 Workflow system enabled with BPMN and state machines`);
    console.log(`🔐 Advanced Security system enabled with MFA, RBAC, and threat detection`);
    console.log(`🔥 Server ready and listening on port ${PORT}`);
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
}

export default app;
