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
import { workflowEngine } from "./lib/workflows.js";
import { inventorySystem } from "./lib/inventory.js";
import { securitySystem } from "./lib/security.js";
import { SEPAParserService } from "./lib/sepa-parser.service.js";
import { MatchingEngineService } from "./lib/matching-engine.service.js";
import { ReconciliationService } from "./lib/reconciliation.service.js";
import { RuleEngineService } from "./lib/rule-engine.service.js";
import { GDPRExportService } from "./lib/gdpr-export.service.js";
import { GDPREraseService } from "./lib/gdpr-erase.service.js";
import { GDPRAuditService } from "./lib/gdpr-audit.service.js";
import { RLSPolicyGeneratorService } from "./lib/rls-policy-generator.service.js";
import { RLSPolicyValidatorService } from "./lib/rls-policy-validator.service.js";
import { RLSPolicyDeployerService } from "./lib/rls-policy-deployer.service.js";
import { RLSCICDService } from "./lib/rls-cicd.service.js";
import { ErrorHandler, ValidationError, NotFoundError } from "./lib/error-handler.js";
import { structuredLogger } from "./lib/structured-logger.js";
import { ValidationMiddleware } from "./middleware/validation.js";
import { RateLimitMiddleware } from "./middleware/rate-limiter.js";
import { SecurityMiddleware } from "./middleware/security.js";
import { advancedCache, cacheManager } from "./lib/advanced-cache.js";
import { healthMonitor } from "./lib/health-monitor.js";
import { databasePool } from "./lib/database-pool.js";
import { processManager } from "./lib/process-manager.js";
import { CostTrackerService } from "./lib/cost-tracker.service.js";
import { BudgetManagerService } from "./lib/budget-manager.service.js";
import { CostOptimizerService } from "./lib/cost-optimizer.service.js";
import { ReportingEngineService } from "./lib/reporting-engine.service.js";
import { QuietHoursService } from "./lib/quiet-hours.service.js";
import { OnCallService } from "./lib/oncall.service.js";
import { EscalationService } from "./lib/escalation.service.js";
import { NotificationIntelligenceService } from "./lib/notification-intelligence.service.js";
import { WarmupService } from "./lib/warmup.service.js";
import { IntelligentSearchService } from "./lib/intelligent-search.service.js";
import { SmartCacheService } from "./lib/smart-cache.service.js";
import { PerformanceOptimizationService } from "./lib/performance-optimization.service.js";
import { AdvancedAnalyticsService } from "./lib/advanced-analytics.service.js";
import { BusinessIntelligenceService } from "./lib/business-intelligence.service.js";
import { IntelligentReportingService } from "./lib/intelligent-reporting.service.js";
import { ExecutiveDashboardService } from "./lib/executive-dashboard.service.js";
import { AdvancedSecurityService } from "./lib/advanced-security.service.js";
import { ComplianceManagementService } from "./lib/compliance-management.service.js";
import { ComprehensiveAuditService } from "./lib/comprehensive-audit.service.js";
import { ThreatDetectionService } from "./lib/threat-detection.service.js";
import { chaosMiddleware, createChaosToggleEndpoints } from "./middleware/chaos.js";
import { AGENTS_REGISTRY, getAgentById, getAgentsByCategory, getAllCategories, getRegistryStats, AgentExecutionRequest, AgentExecutionRecord } from "@econeura/agents";

const app = express();
const PORT = process.env.PORT || 4000;

// Inicializar cache manager
const cacheManager = new CacheManager();

// Inicializar servicios SEPA
const sepaParser = new SEPAParserService();
const matchingEngine = new MatchingEngineService();
const reconciliationService = new ReconciliationService();
const ruleEngine = new RuleEngineService();

// Inicializar servicios GDPR
const gdprExport = new GDPRExportService();
const gdprErase = new GDPREraseService();
const gdprAudit = new GDPRAuditService();

// Inicializar servicios RLS
const rlsGenerator = new RLSPolicyGeneratorService();
const rlsValidator = new RLSPolicyValidatorService();
const rlsDeployer = new RLSPolicyDeployerService();
const rlsCICD = new RLSCICDService();

// Inicializar servicios FinOps
const costTracker = new CostTrackerService();
const budgetManager = new BudgetManagerService();
const costOptimizer = new CostOptimizerService();
const reportingEngine = new ReportingEngineService();
const quietHours = new QuietHoursService();
const onCall = new OnCallService();
const escalation = new EscalationService();
const notificationIntelligence = new NotificationIntelligenceService();
const warmup = new WarmupService();
const intelligentSearch = new IntelligentSearchService();
const smartCache = new SmartCacheService();
const performanceOptimization = new PerformanceOptimizationService();
const advancedAnalytics = new AdvancedAnalyticsService();
const businessIntelligence = new BusinessIntelligenceService();
const intelligentReporting = new IntelligentReportingService();
const executiveDashboard = new ExecutiveDashboardService();
const advancedSecurity = new AdvancedSecurityService();
const complianceManagement = new ComplianceManagementService();
const comprehensiveAudit = new ComprehensiveAuditService();
const threatDetection = new ThreatDetectionService();

// Middleware básico con mejoras de seguridad
app.use(SecurityMiddleware.createSecurityHeaders());
app.use(SecurityMiddleware.createCORS());
app.use(SecurityMiddleware.createRequestSanitization());
app.use(SecurityMiddleware.createRequestSizeLimit('10mb'));

// Rate limiting
app.use('/v1/auth', RateLimitMiddleware.configs.auth);
app.use('/v1/api', RateLimitMiddleware.configs.api);
app.use('/v1/gdpr', RateLimitMiddleware.configs.gdpr);
app.use('/v1/rls', RateLimitMiddleware.configs.rls);
app.use('/v1/sepa', RateLimitMiddleware.configs.sepa);

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
  
  structuredLogger.setRequestId(requestId);
  structuredLogger.requestStart(req.method, req.path, {
    requestId,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    structuredLogger.requestEnd(req.method, req.path, res.statusCode, duration, {
      requestId
    });
    healthMonitor.recordRequest(duration, res.statusCode >= 400);
  });

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de Feature Flags (agregar información a todas las respuestas)
app.use(featureFlagInfoMiddleware());

// Middleware de observabilidad
app.use(observabilityMiddleware);

// Chaos engineering (light) - enable via env CHAOS_ENABLED=true
app.use(chaosMiddleware());

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

// Enhanced Health check endpoints
app.get("/health/live", async (req, res) => {
  try {
    const result = await healthMonitor.getLivenessProbe();
    res.json(result);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// Chaos toggle/control endpoints
createChaosToggleEndpoints(app);

app.get("/health/ready", async (req, res) => {
  try {
    const result = await healthMonitor.getReadinessProbe();
    const statusCode = result.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

app.get("/health", (req, res) => {
  // ECONEURA spec: /health MUST NOT touch DB/externals and respond <200ms
  const ts = new Date().toISOString();
  const version = process.env.npm_package_version || "1.0.0";
  
  res.status(200).json({
    status: "ok",
    ts,
    version
  });
});

// ECONEURA spec: /v1/ping endpoint
app.get("/v1/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    ts: new Date().toISOString(),
    message: "pong"
  });
});

app.get("/health/detailed", async (req, res) => {
  try {
    const result = await healthMonitor.getDetailedHealth();
    res.json(result);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// Process information endpoint
app.get("/process/info", (req, res) => {
  try {
    const info = processManager.getProcessInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    res.status(500).json(ErrorHandler.createErrorResponse(error as Error, 500));
  }
});

app.get("/process/health", (req, res) => {
  try {
    const health = processManager.getProcessHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json(ErrorHandler.createErrorResponse(error as Error, 500));
  }
});

app.get("/process/stats", (req, res) => {
  try {
    const stats = processManager.getProcessStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json(ErrorHandler.createErrorResponse(error as Error, 500));
  }
});

// Cache statistics endpoint
app.get("/cache/stats", (req, res) => {
  try {
    const stats = cacheManager.getAllStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json(ErrorHandler.createErrorResponse(error as Error, 500));
  }
});

// Database health endpoint
app.get("/database/health", async (req, res) => {
  try {
    const health = await databasePool.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json(ErrorHandler.createErrorResponse(error as Error, 500));
  }
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(400).json({ error: (error as Error).message });
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
    return res.status(400).json({ error: (error as Error).message });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoints de observabilidad
app.get("/v1/observability/logs", (req, res) => {
  try {
    const logs = logger.getLogs();
    res.json({
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
    res.json({
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

app.get("/v1/observability/metrics/prometheus", (req, res) => {
  try {
    const prometheusMetrics = metrics.exportPrometheus();
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: (error as Error).message });
    res.status(500).send('# Error generating Prometheus metrics\n');
  }
});

app.get("/v1/observability/traces", (req, res) => {
  try {
    const traces = tracing.getTraces();
    res.json({
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
    
    res.json({
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
    res.json({
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
    res.json({
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
    res.json({
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
    res.json({
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
    res.json({
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
    res.json({
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
    res.json({
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

    return res.json({
      success: true,
      data: {
        budgetId,
        message: 'Budget updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update budget', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update RLS rule', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        serviceId,
        message: 'Service removed from gateway successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove service from gateway', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        routeId,
        message: 'Route removed from gateway successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to remove route from gateway', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/gateway/stats", (req, res) => {
  try {
    const stats = apiGateway.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get gateway stats', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
    
    return res.json({
      success: true,
      data: {
        route,
        service,
        message: 'Route found successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to test route', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

      return res.json({
        success: true,
        data: {
          aggregateId,
          aggregateType,
          version: user.version,
          state
        }
      });
    } else {
      return res.status(400).json({ error: 'Unsupported aggregate type' });
    }
  } catch (error) {
    logger.error('Failed to load aggregate', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        serviceId,
        message: 'Service deregistered successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to deregister service', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        serviceId,
        message: 'Heartbeat received successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to process heartbeat', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        serviceId,
        health,
        message: 'Health updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update service health', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/microservices/circuit-breaker/reset/:serviceName", (req, res) => {
  try {
    const { serviceName } = req.params;
    const success = serviceMesh.resetCircuitBreaker(serviceName);
    
    if (!success) {
      return res.status(404).json({ error: 'Circuit breaker not found' });
    }

    return res.json({
      success: true,
      data: {
        serviceName,
        message: 'Circuit breaker reset successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to reset circuit breaker', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        flagId,
        message: 'Feature flag updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update feature flag', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/v1/config/feature-flags/:flagId", (req, res) => {
  try {
    const { flagId } = req.params;
    const deleted = configurationManager.deleteFeatureFlag(flagId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    return res.json({
      success: true,
      data: {
        flagId,
        message: 'Feature flag deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to delete feature flag', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/feature-flags/:flagId/check", (req, res) => {
  try {
    const { flagId } = req.params;
    const context = req.body;
    
    const isEnabled = configurationManager.isFeatureEnabled(flagId, context);
    
    return res.json({
      success: true,
      data: {
        flagId,
        isEnabled,
        context
      }
    });
  } catch (error) {
    logger.error('Failed to check feature flag', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
      
      return res.json({
        success: true,
        data: config
      });
    } else {
      const stats = configurationManager.getStats();
      return res.json({
        success: true,
        data: {
          environments: stats.environments,
          count: stats.environments.length
        }
      });
    }
  } catch (error) {
    logger.error('Failed to get environments', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        environment,
        message: 'Environment config updated successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to update environment config', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/config/values/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { environment, defaultValue } = req.query;
    
    const value = configurationManager.getConfigValue(key, environment as string, defaultValue);
    
    return res.json({
      success: true,
      data: {
        key,
        value,
        environment: environment || 'default'
      }
    });
  } catch (error) {
    logger.error('Failed to get config value', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
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
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      success: true,
      data: {
        key,
        hasValue: true,
        environment: environment || 'default'
      }
    });
  } catch (error) {
    logger.error('Failed to get secret', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/config/stats", (req, res) => {
  try {
    const stats = configurationManager.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get config stats', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/validate", (req, res) => {
  try {
    const isValid = configurationManager.validateConfiguration();
    
    return res.json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Configuration is valid' : 'Configuration has errors'
      }
    });
  } catch (error) {
    logger.error('Failed to validate configuration', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/v1/config/reload", (req, res) => {
  try {
    configurationManager.reloadConfiguration();
    
    return res.json({
      success: true,
      data: {
        message: 'Configuration reloaded successfully'
      }
    });
  } catch (error) {
    logger.error('Failed to reload configuration', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      data: workflow,
      message: 'Workflow retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get workflow', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({
      data: instance,
      message: 'Workflow instance retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get workflow instance', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
      organizationId: req.organizationId,
      requestId: req.requestId
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

    return res.json({
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
    logger.error('Failed to process AI request', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/demo/search", rateLimitByEndpoint, async (req: any, res) => {
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

    return res.json({
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
    logger.error('Failed to process search request', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/demo/crm", rateLimitByEndpoint, (req: any, res) => {
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

app.get("/v1/demo/products", rateLimitByEndpoint, (req: any, res) => {
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

app.get("/v1/demo/dashboard", rateLimitByEndpoint, (req: any, res) => {
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
    return res.json(product);
  } catch (error) {
    logger.error('Failed to get product', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.json(transaction);
  } catch (error) {
    logger.error('Failed to get transaction', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.json(alert);
  } catch (error) {
    logger.error('Failed to get alert', { error: (error as Error).message });
    return res.status(500).json({ error: 'Internal server error' });
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
// SEPA SYSTEM ENDPOINTS
// ============================================================================

// Upload de archivos SEPA
app.post("/v1/sepa/upload", async (req, res) => {
  try {
    const { fileContent, fileType, fileName } = req.body;
    
    if (!fileContent || !fileType) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "fileContent and fileType are required"
      });
    }

    let result;
    if (fileType === 'camt') {
      result = await sepaParser.parseCAMT(fileContent);
    } else if (fileType === 'mt940') {
      result = await sepaParser.parseMT940(fileContent);
    } else {
      return res.status(400).json({ 
        error: "Invalid file type",
        message: "fileType must be 'camt' or 'mt940'"
      });
    }

    logger.info("SEPA file uploaded and parsed", {
      fileName: result.fileName,
      transactionsCount: result.transactionsCount,
      status: result.status
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error("SEPA upload failed", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "SEPA upload failed",
      message: (error as Error).message
    });
  }
});

// Lista de transacciones SEPA
app.get("/v1/sepa/transactions", async (req, res) => {
  try {
    const transactions = sepaParser.getTransactions();
    
    return res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get SEPA transactions", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get SEPA transactions",
      message: (error as Error).message
    });
  }
});

// Matching de transacciones
app.post("/v1/sepa/matching", async (req, res) => {
  try {
    const { sepaTransactions, existingTransactions } = req.body;
    
    if (!sepaTransactions || !existingTransactions) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "sepaTransactions and existingTransactions are required"
      });
    }

    const results = await matchingEngine.matchTransactions(sepaTransactions, existingTransactions);
    
    logger.info("SEPA matching completed", {
      sepaTransactionsCount: sepaTransactions.length,
      existingTransactionsCount: existingTransactions.length,
      matchesFound: results.length
    });

    return res.json({
      success: true,
      data: {
        results,
        stats: matchingEngine.getMatchingStats()
      }
    });
  } catch (error: any) {
    logger.error("SEPA matching failed", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "SEPA matching failed",
      message: (error as Error).message
    });
  }
});

// Conciliación bancaria
app.post("/v1/sepa/reconciliation", async (req, res) => {
  try {
    const { sepaTransactions, existingTransactions } = req.body;
    
    if (!sepaTransactions || !existingTransactions) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "sepaTransactions and existingTransactions are required"
      });
    }

    const result = await reconciliationService.performReconciliation(sepaTransactions, existingTransactions);
    
    logger.info("SEPA reconciliation completed", {
      totalTransactions: result.summary.total,
      autoReconciled: result.summary.autoReconciled,
      successRate: result.summary.successRate
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error("SEPA reconciliation failed", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "SEPA reconciliation failed",
      message: (error as Error).message
    });
  }
});

// Gestión de reglas de matching
app.get("/v1/sepa/rules", async (req, res) => {
  try {
    const rules = ruleEngine.getRules();
    
    return res.json({
      success: true,
      data: {
        rules,
        stats: ruleEngine.getRuleStats()
      }
    });
  } catch (error: any) {
    logger.error("Failed to get SEPA rules", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get SEPA rules",
      message: (error as Error).message
    });
  }
});

app.post("/v1/sepa/rules", async (req, res) => {
  try {
    const ruleData = req.body;
    
    const validation = ruleEngine.validateRule(ruleData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: "Invalid rule",
        message: "Rule validation failed",
        details: validation.errors
      });
    }

    const rule = ruleEngine.addRule(ruleData);
    
    logger.info("SEPA rule created", { ruleId: rule.id, ruleName: rule.name });

    return res.json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    logger.error("Failed to create SEPA rule", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to create SEPA rule",
      message: (error as Error).message
    });
  }
});

app.put("/v1/sepa/rules/:ruleId", async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const rule = ruleEngine.updateRule(ruleId, updates);
    if (!rule) {
      return res.status(404).json({ 
        error: "Rule not found",
        message: `Rule with ID ${ruleId} not found`
      });
    }

    logger.info("SEPA rule updated", { ruleId, ruleName: rule.name });

    return res.json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    logger.error("Failed to update SEPA rule", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to update SEPA rule",
      message: (error as Error).message
    });
  }
});

app.delete("/v1/sepa/rules/:ruleId", async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    const deleted = ruleEngine.deleteRule(ruleId);
    if (!deleted) {
      return res.status(404).json({ 
        error: "Rule not found",
        message: `Rule with ID ${ruleId} not found`
      });
    }

    logger.info("SEPA rule deleted", { ruleId });

    return res.json({
      success: true,
      message: "Rule deleted successfully"
    });
  } catch (error: any) {
    logger.error("Failed to delete SEPA rule", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to delete SEPA rule",
      message: (error as Error).message
    });
  }
});

// Estadísticas SEPA
app.get("/v1/sepa/stats", async (req, res) => {
  try {
    const matchingStats = matchingEngine.getMatchingStats();
    const reconciliationStats = reconciliationService.getReconciliationStats();
    const ruleStats = ruleEngine.getRuleStats();
    
    return res.json({
      success: true,
      data: {
        matching: matchingStats,
        reconciliation: reconciliationStats,
        rules: ruleStats
      }
    });
  } catch (error: any) {
    logger.error("Failed to get SEPA stats", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get SEPA stats",
      message: (error as Error).message
    });
  }
});

// ============================================================================
// RLS GENERATIVE SUITE ENDPOINTS
// ============================================================================

// RLS Policy Generator
app.post("/v1/rls/generate", async (req, res) => {
  try {
    const { schemaId, tableName, policyType, templateId, variables, rules, options } = req.body;
    
    if (!schemaId || !tableName || !policyType || !templateId) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "schemaId, tableName, policyType, and templateId are required"
      });
    }

    const policy = await rlsGenerator.generatePolicy(
      schemaId,
      tableName,
      policyType,
      templateId,
      variables || {},
      rules || [],
      options || {},
      req.headers['x-user-id'] as string || 'system'
    );

    logger.info("RLS policy generated", {
      policyId: policy.id,
      tableName,
      policyType,
      templateId
    });

    return res.json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    logger.error("Failed to generate RLS policy", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to generate RLS policy",
      message: (error as Error).message
    });
  }
});

app.get("/v1/rls/policies", async (req, res) => {
  try {
    const { tableName, schemaName } = req.query;
    let policies = rlsGenerator.getPolicies();
    
    if (tableName) {
      policies = policies.filter(p => p.tableName === tableName);
    }
    
    if (schemaName) {
      policies = policies.filter(p => p.schemaName === schemaName);
    }
    
    return res.json({
      success: true,
      data: {
        policies,
        count: policies.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get RLS policies", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get RLS policies",
      message: (error as Error).message
    });
  }
});

app.get("/v1/rls/policies/:policyId", async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = rlsGenerator.getPolicy(policyId);
    
    if (!policy) {
      return res.status(404).json({ 
        error: "Policy not found",
        message: `RLS policy with ID ${policyId} not found`
      });
    }

    return res.json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    logger.error("Failed to get RLS policy", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get RLS policy",
      message: (error as Error).message
    });
  }
});

// RLS Policy Templates
app.get("/v1/rls/templates", async (req, res) => {
  try {
    const { category } = req.query;
    let templates = rlsGenerator.getTemplates();
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    return res.json({
      success: true,
      data: {
        templates,
        count: templates.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get RLS templates", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get RLS templates",
      message: (error as Error).message
    });
  }
});

app.get("/v1/rls/templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = rlsGenerator.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({ 
        error: "Template not found",
        message: `RLS template with ID ${templateId} not found`
      });
    }

    return res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    logger.error("Failed to get RLS template", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get RLS template",
      message: (error as Error).message
    });
  }
});

// RLS Policy Validator
app.post("/v1/rls/validate", async (req, res) => {
  try {
    const { policyId, validationTypes } = req.body;
    
    if (!policyId) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "policyId is required"
      });
    }

    const policy = rlsGenerator.getPolicy(policyId);
    if (!policy) {
      return res.status(404).json({ 
        error: "Policy not found",
        message: `RLS policy with ID ${policyId} not found`
      });
    }

    const results = await rlsValidator.validatePolicy(
      policy,
      validationTypes || ['syntax', 'semantic', 'performance', 'security', 'compliance'],
      req.headers['x-user-id'] as string || 'system'
    );

    logger.info("RLS policy validated", {
      policyId,
      validationTypes,
      results: results.map(r => ({ type: r.validationType, status: r.status, score: r.score }))
    });

    return res.json({
      success: true,
      data: {
        policyId,
        results,
        count: results.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to validate RLS policy", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to validate RLS policy",
      message: (error as Error).message
    });
  }
});

app.get("/v1/rls/validation-results", async (req, res) => {
  try {
    const { policyId } = req.query;
    const results = rlsValidator.getValidationResults(policyId as string);
    
    return res.json({
      success: true,
      data: {
        results,
        count: results.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get validation results", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get validation results",
      message: (error as Error).message
    });
  }
});

// RLS Policy Deployer
app.post("/v1/rls/deploy", async (req, res) => {
  try {
    const { policyId, environment, strategy, options } = req.body;
    
    if (!policyId || !environment || !strategy) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "policyId, environment, and strategy are required"
      });
    }

    const policy = rlsGenerator.getPolicy(policyId);
    if (!policy) {
      return res.status(404).json({ 
        error: "Policy not found",
        message: `RLS policy with ID ${policyId} not found`
      });
    }

    const deployment = await rlsDeployer.deployPolicy(
      policy,
      environment,
      strategy,
      req.headers['x-user-id'] as string || 'system',
      options || {}
    );

    logger.info("RLS policy deployment initiated", {
      deploymentId: deployment.id,
      policyId,
      environment,
      strategy
    });

    return res.json({
      success: true,
      data: deployment
    });
  } catch (error: any) {
    logger.error("Failed to deploy RLS policy", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to deploy RLS policy",
      message: (error as Error).message
    });
  }
});

app.get("/v1/rls/deployments", async (req, res) => {
  try {
    const { policyId, environment, strategy } = req.query;
    let deployments = rlsDeployer.getDeployments(policyId as string);
    
    if (environment) {
      deployments = deployments.filter(d => d.environment === environment);
    }
    
    if (strategy) {
      deployments = deployments.filter(d => d.strategy === strategy);
    }
    
    return res.json({
      success: true,
      data: {
        deployments,
        count: deployments.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get deployments", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get deployments",
      message: (error as Error).message
    });
  }
});

app.post("/v1/rls/deployments/:deploymentId/rollback", async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { reason } = req.body;
    
    const deployment = await rlsDeployer.rollbackDeployment(
      deploymentId,
      req.headers['x-user-id'] as string || 'system',
      reason
    );

    if (!deployment) {
      return res.status(404).json({ 
        error: "Deployment not found",
        message: `Deployment with ID ${deploymentId} not found`
      });
    }

    logger.info("RLS policy deployment rollback initiated", {
      deploymentId,
      reason
    });

    return res.json({
      success: true,
      data: deployment
    });
  } catch (error: any) {
    logger.error("Failed to rollback deployment", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to rollback deployment",
      message: (error as Error).message
    });
  }
});

// RLS CI/CD Integration
app.get("/v1/rls/cicd/integrations", async (req, res) => {
  try {
    const { provider } = req.query;
    let integrations = rlsCICD.getIntegrations();
    
    if (provider) {
      integrations = integrations.filter(i => i.provider === provider);
    }
    
    return res.json({
      success: true,
      data: {
        integrations,
        count: integrations.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get CI/CD integrations", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get CI/CD integrations",
      message: (error as Error).message
    });
  }
});

app.post("/v1/rls/cicd/integrations", async (req, res) => {
  try {
    const { name, provider, repository, branch, pipeline, webhookUrl, secret, events } = req.body;
    
    if (!name || !provider || !repository || !branch || !pipeline) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "name, provider, repository, branch, and pipeline are required"
      });
    }

    const integration = await rlsCICD.createIntegration(
      name,
      provider,
      repository,
      branch,
      pipeline,
      webhookUrl || '',
      secret || '',
      events || []
    );

    logger.info("CI/CD integration created", {
      integrationId: integration.id,
      name,
      provider,
      repository
    });

    return res.json({
      success: true,
      data: integration
    });
  } catch (error: any) {
    logger.error("Failed to create CI/CD integration", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to create CI/CD integration",
      message: (error as Error).message
    });
  }
});

app.post("/v1/rls/cicd/webhook/:integrationId", async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { eventType, payload } = req.body;
    
    if (!eventType || !payload) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "eventType and payload are required"
      });
    }

    await rlsCICD.handleWebhookEvent(integrationId, eventType, payload);

    logger.info("Webhook event processed", {
      integrationId,
      eventType
    });

    return res.json({
      success: true,
      message: "Webhook event processed successfully"
    });
  } catch (error: any) {
    logger.error("Failed to process webhook event", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to process webhook event",
      message: (error as Error).message
    });
  }
});

app.get("/v1/rls/cicd/pipeline-config/:integrationId", async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { type } = req.query;
    
    if (!type) {
      return res.status(400).json({ 
        error: "Missing required parameter",
        message: "type parameter is required"
      });
    }

    const config = await rlsCICD.generatePipelineConfig(
      integrationId,
      type as any
    );

    return res.json({
      success: true,
      data: {
        integrationId,
        type,
        config
      }
    });
  } catch (error: any) {
    logger.error("Failed to generate pipeline config", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to generate pipeline config",
      message: (error as Error).message
    });
  }
});

// RLS Statistics
app.get("/v1/rls/stats", async (req, res) => {
  try {
    const policyStats = rlsGenerator.getPolicyStats();
    const validationStats = rlsValidator.getValidationStats();
    const deploymentStats = rlsDeployer.getDeploymentStats();
    const cicdStats = rlsCICD.getCICDStats();
    
    return res.json({
      success: true,
      data: {
        policies: policyStats,
        validations: validationStats,
        deployments: deploymentStats,
        cicd: cicdStats
      }
    });
  } catch (error: any) {
    logger.error("Failed to get RLS stats", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get RLS stats",
      message: (error as Error).message
    });
  }
});

// ============================================================================
// FINOPS SYSTEM ENDPOINTS
// ============================================================================

// Cost Tracking
app.get("/v1/finops/costs", async (req, res) => {
  try {
    const { organizationId, service, category, startDate, endDate, userId, projectId, departmentId } = req.query;
    const filters: any = {};
    
    if (organizationId) filters.organizationId = organizationId as string;
    if (service) filters.service = service as string;
    if (category) filters.category = category as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (userId) filters.userId = userId as string;
    if (projectId) filters.projectId = projectId as string;
    if (departmentId) filters.departmentId = departmentId as string;

    const costs = costTracker.getCosts(filters);
    res.json({
      success: true,
      data: {
        costs,
        count: costs.length
      }
    });
  } catch (error) {
    logger.error('Failed to get costs', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/costs", async (req, res) => {
  try {
    const costData = req.body;
    const cost = await costTracker.recordCost(costData);
    res.status(201).json({
      success: true,
      data: cost
    });
  } catch (error) {
    logger.error('Failed to record cost', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/costs/:costId", async (req, res) => {
  try {
    const { costId } = req.params;
    const cost = costTracker.getCostById(costId);
    
    if (!cost) {
      return res.status(404).json({
        success: false,
        error: { message: 'Cost not found' }
      });
    }

    res.json({
      success: true,
      data: cost
    });
  } catch (error) {
    logger.error('Failed to get cost', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/costs/trends", async (req, res) => {
  try {
    const { organizationId, service, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (organizationId) filters.organizationId = organizationId as string;
    if (service) filters.service = service as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const trends = costTracker.getCostTrends(filters);
    res.json({
      success: true,
      data: {
        trends,
        count: trends.length
      }
    });
  } catch (error) {
    logger.error('Failed to get cost trends', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/costs/stats", async (req, res) => {
  try {
    const { organizationId } = req.query;
    const stats = costTracker.getCostStats(organizationId as string);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get cost stats', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Budget Management
app.get("/v1/finops/budgets", async (req, res) => {
  try {
    const { organizationId } = req.query;
    const budgets = budgetManager.getBudgets(organizationId as string);
    res.json({
      success: true,
      data: {
        budgets,
        count: budgets.length
      }
    });
  } catch (error) {
    logger.error('Failed to get budgets', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/budgets", async (req, res) => {
  try {
    const budgetData = req.body;
    const budget = await budgetManager.createBudget(budgetData);
    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    logger.error('Failed to create budget', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/budgets/:budgetId", async (req, res) => {
  try {
    const { budgetId } = req.params;
    const budget = budgetManager.getBudget(budgetId);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: { message: 'Budget not found' }
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    logger.error('Failed to get budget', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/v1/finops/budgets/:budgetId", async (req, res) => {
  try {
    const { budgetId } = req.params;
    const updates = req.body;
    const budget = await budgetManager.updateBudget(budgetId, updates);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: { message: 'Budget not found' }
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    logger.error('Failed to update budget', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/v1/finops/budgets/:budgetId", async (req, res) => {
  try {
    const { budgetId } = req.params;
    const deleted = await budgetManager.deleteBudget(budgetId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Budget not found' }
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete budget', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/budgets/status", async (req, res) => {
  try {
    const { organizationId } = req.query;
    const status = budgetManager.getBudgetStatus(organizationId as string);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get budget status', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/budgets/alerts", async (req, res) => {
  try {
    const { organizationId, budgetId } = req.query;
    const alerts = budgetManager.getBudgetAlerts(organizationId as string, budgetId as string);
    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    logger.error('Failed to get budget alerts', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/budgets/alerts/:alertId/acknowledge", async (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;
    const alert = await budgetManager.acknowledgeAlert(alertId, acknowledgedBy);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Cost Optimization
app.get("/v1/finops/optimization/recommendations", async (req, res) => {
  try {
    const { status, type, priority, effort, impact } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status as string;
    if (type) filters.type = type as string;
    if (priority) filters.priority = priority as string;
    if (effort) filters.effort = effort as string;
    if (impact) filters.impact = impact as string;

    const recommendations = costOptimizer.getRecommendations(filters);
    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length
      }
    });
  } catch (error) {
    logger.error('Failed to get optimization recommendations', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/optimization/recommendations/:recommendationId", async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const recommendation = costOptimizer.getRecommendation(recommendationId);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Recommendation not found' }
      });
    }

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    logger.error('Failed to get recommendation', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/optimization/recommendations/:recommendationId/approve", async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { approvedBy } = req.body;
    const recommendation = await costOptimizer.approveRecommendation(recommendationId, approvedBy);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Recommendation not found' }
      });
    }

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    logger.error('Failed to approve recommendation', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/optimization/recommendations/:recommendationId/reject", async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { rejectedBy, reason } = req.body;
    const recommendation = await costOptimizer.rejectRecommendation(recommendationId, rejectedBy, reason);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Recommendation not found' }
      });
    }

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    logger.error('Failed to reject recommendation', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/optimization/recommendations/:recommendationId/implement", async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { implementedBy } = req.body;
    const optimization = await costOptimizer.implementRecommendation(recommendationId, implementedBy);
    
    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: { message: 'Recommendation not found' }
      });
    }

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    logger.error('Failed to implement recommendation', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/optimization/optimizations", async (req, res) => {
  try {
    const { status, type } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status as string;
    if (type) filters.type = type as string;

    const optimizations = costOptimizer.getOptimizations(filters);
    res.json({
      success: true,
      data: {
        optimizations,
        count: optimizations.length
      }
    });
  } catch (error) {
    logger.error('Failed to get optimizations', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/optimization/stats", async (req, res) => {
  try {
    const stats = costOptimizer.getOptimizationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get optimization stats', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Reporting
app.get("/v1/finops/reports", async (req, res) => {
  try {
    const { organizationId, type, status, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (organizationId) filters.organizationId = organizationId as string;
    if (type) filters.type = type as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const reports = reportingEngine.getReports(filters);
    res.json({
      success: true,
      data: {
        reports,
        count: reports.length
      }
    });
  } catch (error) {
    logger.error('Failed to get reports', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/reports", async (req, res) => {
  try {
    const { name, type, organizationId, period, format, generatedBy } = req.body;
    const report = await reportingEngine.generateReport(
      name,
      type,
      organizationId,
      period,
      format,
      generatedBy
    );
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to generate report', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/reports/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reportingEngine.getReport(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { message: 'Report not found' }
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to get report', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/forecasts", async (req, res) => {
  try {
    const { organizationId } = req.query;
    const forecasts = reportingEngine.getCostForecasts(organizationId as string);
    res.json({
      success: true,
      data: {
        forecasts,
        count: forecasts.length
      }
    });
  } catch (error) {
    logger.error('Failed to get forecasts', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/finops/forecasts", async (req, res) => {
  try {
    const { organizationId, period, model } = req.body;
    const forecasts = await reportingEngine.generateCostForecast(organizationId, period, model);
    res.json({
      success: true,
      data: {
        forecasts,
        count: forecasts.length
      }
    });
  } catch (error) {
    logger.error('Failed to generate forecast', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/metrics", async (req, res) => {
  try {
    const { organizationId } = req.query;
    const metrics = await reportingEngine.generateFinOpsMetrics(organizationId as string);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get FinOps metrics', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/v1/finops/stats", async (req, res) => {
  try {
    const stats = {
      costTracker: costTracker.getCostStats('org_1'),
      budgetManager: budgetManager.getBudgetStats('org_1'),
      costOptimizer: costOptimizer.getOptimizationStats(),
      reportingEngine: reportingEngine.getReportingStats()
    };
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get FinOps stats', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// QUIET HOURS + ON-CALL SYSTEM ENDPOINTS
// ============================================================================

// Quiet Hours Management
app.get("/v1/quiet-hours", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const configs = await quietHours.getQuietHoursConfigs(organizationId);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/quiet-hours", async (req, res) => {
  try {
    const config = await quietHours.createQuietHoursConfig(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/quiet-hours/:id", async (req, res) => {
  try {
    const config = await quietHours.getQuietHoursConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Quiet hours configuration not found' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/quiet-hours/:id", async (req, res) => {
  try {
    const config = await quietHours.updateQuietHoursConfig(req.params.id, req.body);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Quiet hours configuration not found' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/quiet-hours/:id", async (req, res) => {
  try {
    const deleted = await quietHours.deleteQuietHoursConfig(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Quiet hours configuration not found' });
    }
    res.json({ success: true, message: 'Quiet hours configuration deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/quiet-hours/status", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const serviceName = req.query.service as string;
    const status = await quietHours.getQuietHoursStatus(organizationId, serviceName);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/quiet-hours/override", async (req, res) => {
  try {
    const { organizationId, serviceName, startTime, endTime, reason, requestedBy } = req.body;
    const override = await quietHours.createQuietHoursOverride(
      organizationId, serviceName, new Date(startTime), new Date(endTime), reason, requestedBy
    );
    res.status(201).json({ success: true, data: override });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// On-Call Management
app.get("/v1/oncall/schedules", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const schedules = await onCall.getOnCallSchedules(organizationId);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/oncall/schedules", async (req, res) => {
  try {
    const schedule = await onCall.createOnCallSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/oncall/schedules/:id", async (req, res) => {
  try {
    const schedule = await onCall.getOnCallSchedule(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'On-call schedule not found' });
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/oncall/schedules/:id", async (req, res) => {
  try {
    const schedule = await onCall.updateOnCallSchedule(req.params.id, req.body);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'On-call schedule not found' });
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/oncall/schedules/:id", async (req, res) => {
  try {
    const deleted = await onCall.deleteOnCallSchedule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'On-call schedule not found' });
    }
    res.json({ success: true, message: 'On-call schedule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/oncall/current", async (req, res) => {
  try {
    const scheduleId = req.query.scheduleId as string;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'scheduleId is required' });
    }
    const currentOnCall = await onCall.getCurrentOnCall(scheduleId);
    res.json({ success: true, data: currentOnCall });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/oncall/history", async (req, res) => {
  try {
    const scheduleId = req.query.scheduleId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'scheduleId is required' });
    }
    const history = await onCall.getOnCallHistory(scheduleId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/oncall/override", async (req, res) => {
  try {
    const { scheduleId, originalUserId, overrideUserId, startTime, endTime, reason, requestedBy } = req.body;
    const override = await onCall.createOnCallOverride(
      scheduleId, originalUserId, overrideUserId, new Date(startTime), new Date(endTime), reason, requestedBy
    );
    res.status(201).json({ success: true, data: override });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Escalation Management
app.get("/v1/escalation/rules", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const rules = await escalation.getEscalationRules(organizationId);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/escalation/rules", async (req, res) => {
  try {
    const rule = await escalation.createEscalationRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/escalation/rules/:id", async (req, res) => {
  try {
    const rule = await escalation.getEscalationRule(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Escalation rule not found' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/escalation/rules/:id", async (req, res) => {
  try {
    const rule = await escalation.updateEscalationRule(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Escalation rule not found' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/escalation/rules/:id", async (req, res) => {
  try {
    const deleted = await escalation.deleteEscalationRule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Escalation rule not found' });
    }
    res.json({ success: true, message: 'Escalation rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/escalation/trigger", async (req, res) => {
  try {
    const event = await escalation.triggerEscalation(req.body);
    if (!event) {
      return res.status(400).json({ success: false, error: 'No matching escalation rules found' });
    }
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/escalation/status", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const status = await escalation.getEscalationStatus(organizationId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/escalation/:eventId/acknowledge", async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await escalation.acknowledgeEscalation(req.params.eventId, userId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Escalation event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notification Intelligence
app.get("/v1/notifications/preferences", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'user_1';
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const preferences = await notificationIntelligence.getNotificationPreferences(userId, organizationId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/notifications/preferences", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'user_1';
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const preferences = await notificationIntelligence.updateNotificationPreferences(userId, organizationId, req.body);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/notifications/send", async (req, res) => {
  try {
    const notification = await notificationIntelligence.sendNotification(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/notifications/history", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'user_1';
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await notificationIntelligence.getNotificationHistory(userId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/notifications/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analytics = await notificationIntelligence.getNotificationAnalytics(organizationId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/notifications/:id/read", async (req, res) => {
  try {
    const notification = await notificationIntelligence.markNotificationAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/notifications/digest", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'user_1';
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const digest = await notificationIntelligence.sendDigestNotification(userId, organizationId);
    res.status(201).json({ success: true, data: digest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WARM-UP IA/SEARCH SYSTEM ENDPOINTS
// ============================================================================

// Warm-up Management
app.get("/v1/warmup/configs", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const configs = await warmup.getWarmupConfigs(organizationId);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/warmup/configs", async (req, res) => {
  try {
    const config = await warmup.createWarmupConfig(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/warmup/configs/:id", async (req, res) => {
  try {
    const config = await warmup.getWarmupConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Warm-up configuration not found' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/warmup/configs/:id", async (req, res) => {
  try {
    const config = await warmup.updateWarmupConfig(req.params.id, req.body);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Warm-up configuration not found' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/warmup/configs/:id", async (req, res) => {
  try {
    const deleted = await warmup.deleteWarmupConfig(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Warm-up configuration not found' });
    }
    res.json({ success: true, message: 'Warm-up configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Warm-up Execution
app.post("/v1/warmup/execute", async (req, res) => {
  try {
    const { configId, organizationId, serviceName } = req.body;
    const result = await warmup.executeWarmup(configId, organizationId, serviceName);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/warmup/status", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const serviceName = req.query.service as string;
    const status = await warmup.getWarmupStatus(organizationId, serviceName);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/warmup/metrics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const serviceName = req.query.service as string;
    const metrics = await warmup.getWarmupMetrics(organizationId, serviceName);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Intelligent Search
app.post("/v1/search/query", async (req, res) => {
  try {
    const { query, filters, organizationId, userId } = req.body;
    const results = await intelligentSearch.search(query, filters, organizationId, userId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/search/suggestions", async (req, res) => {
  try {
    const { q: query, organizationId } = req.query;
    const suggestions = await intelligentSearch.getSuggestions(query as string, organizationId as string);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/search/index", async (req, res) => {
  try {
    const { documents, organizationId } = req.body;
    const result = await intelligentSearch.indexDocuments(documents, organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/search/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analytics = await intelligentSearch.getSearchAnalytics(organizationId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Smart Cache Management
app.get("/v1/cache/smart/configs", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const configs = await smartCache.getCacheConfigs(organizationId);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/cache/smart/configs", async (req, res) => {
  try {
    const config = await smartCache.createCacheConfig(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/cache/smart/stats", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const stats = await smartCache.getCacheStats(organizationId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/cache/smart/invalidate", async (req, res) => {
  try {
    const { patterns, organizationId } = req.body;
    const result = await smartCache.invalidateCache(patterns, organizationId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Performance Optimization
app.get("/v1/performance/metrics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const metrics = await performanceOptimization.getPerformanceMetrics(organizationId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/performance/recommendations", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const recommendations = await performanceOptimization.getOptimizationRecommendations(organizationId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/performance/optimize", async (req, res) => {
  try {
    const { optimizationType, organizationId, parameters } = req.body;
    const result = await performanceOptimization.executeOptimization(optimizationType, organizationId, parameters);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ADVANCED ANALYTICS & BUSINESS INTELLIGENCE ENDPOINTS
// ============================================================================

// Advanced Analytics Endpoints
app.get("/v1/analytics/metrics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const metrics = await advancedAnalytics.getMetrics(organizationId, filters);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/analytics/metrics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const metric = await advancedAnalytics.createMetric(req.body, organizationId);
    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/analytics/metrics/:id", async (req, res) => {
  try {
    const metric = await advancedAnalytics.getMetric(req.params.id);
    if (!metric) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }
    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/analytics/metrics/:id", async (req, res) => {
  try {
    const metric = await advancedAnalytics.updateMetric(req.params.id, req.body);
    if (!metric) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }
    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/analytics/metrics/:id", async (req, res) => {
  try {
    const deleted = await advancedAnalytics.deleteMetric(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }
    res.json({ success: true, message: 'Metric deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/analytics/metrics/:id/record", async (req, res) => {
  try {
    const { value, metadata } = req.body;
    await advancedAnalytics.recordMetric(req.params.id, value, metadata);
    res.json({ success: true, message: 'Metric recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/analytics/trends/:metricId", async (req, res) => {
  try {
    const period = req.query.period as string || 'daily';
    const trend = await advancedAnalytics.analyzeTrends(req.params.metricId, period as any);
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/analytics/anomalies", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const metricId = req.query.metricId as string;
    const anomalies = metricId 
      ? await advancedAnalytics.getAnomalies(metricId)
      : await advancedAnalytics.getAllAnomalies(organizationId);
    res.json({ success: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/analytics/query", async (req, res) => {
  try {
    const result = await advancedAnalytics.executeQuery(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Business Intelligence Endpoints
app.get("/v1/bi/kpis", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const kpis = await businessIntelligence.getKPIs(organizationId, filters);
    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/bi/kpis", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const kpi = await businessIntelligence.createKPI(req.body, organizationId);
    res.status(201).json({ success: true, data: kpi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/kpis/:id", async (req, res) => {
  try {
    const kpi = await businessIntelligence.getKPI(req.params.id);
    if (!kpi) {
      return res.status(404).json({ success: false, error: 'KPI not found' });
    }
    res.json({ success: true, data: kpi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/bi/kpis/:id", async (req, res) => {
  try {
    const kpi = await businessIntelligence.updateKPI(req.params.id, req.body);
    if (!kpi) {
      return res.status(404).json({ success: false, error: 'KPI not found' });
    }
    res.json({ success: true, data: kpi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/bi/kpis/:id", async (req, res) => {
  try {
    const deleted = await businessIntelligence.deleteKPI(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'KPI not found' });
    }
    res.json({ success: true, message: 'KPI deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/bi/kpis/:id/update-value", async (req, res) => {
  try {
    const { value } = req.body;
    const kpi = await businessIntelligence.updateKPIValue(req.params.id, value);
    if (!kpi) {
      return res.status(404).json({ success: false, error: 'KPI not found' });
    }
    res.json({ success: true, data: kpi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/insights", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const kpiId = req.query.kpiId as string;
    const insights = kpiId 
      ? await businessIntelligence.getBusinessIntelligence(kpiId)
      : await businessIntelligence.getAllBusinessIntelligence(organizationId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/risks", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const kpiId = req.query.kpiId as string;
    const risks = kpiId 
      ? await businessIntelligence.getRiskFactors(kpiId)
      : await businessIntelligence.getAllRiskFactors(organizationId);
    res.json({ success: true, data: risks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/opportunities", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const kpiId = req.query.kpiId as string;
    const opportunities = kpiId 
      ? await businessIntelligence.getOpportunities(kpiId)
      : await businessIntelligence.getAllOpportunities(organizationId);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/bi/competitive-analysis", async (req, res) => {
  try {
    const { organizationId, competitors } = req.body;
    const analysis = await businessIntelligence.performCompetitiveAnalysis(organizationId, competitors);
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/competitive-analyses", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analyses = await businessIntelligence.getCompetitiveAnalyses(organizationId);
    res.json({ success: true, data: analyses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/bi/roi-analysis", async (req, res) => {
  try {
    const { organizationId, initiatives } = req.body;
    const analysis = await businessIntelligence.performROIAnalysis(organizationId, initiatives);
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/roi-analyses", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analyses = await businessIntelligence.getROIAnalyses(organizationId);
    res.json({ success: true, data: analyses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/benchmarking", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const benchmarking = await businessIntelligence.performBenchmarking(organizationId);
    res.json({ success: true, data: benchmarking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/bi/strategic-insights", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const insights = await businessIntelligence.generateStrategicInsights(organizationId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Intelligent Reporting Endpoints
app.get("/v1/reports", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const reports = await intelligentReporting.getReports(organizationId, filters);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/reports", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const createdBy = req.headers['x-user-id'] as string || 'user_1';
    const report = await intelligentReporting.createReport(req.body, organizationId, createdBy);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/reports/:id", async (req, res) => {
  try {
    const report = await intelligentReporting.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/reports/:id", async (req, res) => {
  try {
    const report = await intelligentReporting.updateReport(req.params.id, req.body);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/reports/:id", async (req, res) => {
  try {
    const deleted = await intelligentReporting.deleteReport(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/reports/:id/generate", async (req, res) => {
  try {
    const generatedBy = req.headers['x-user-id'] as string || 'user_1';
    const parameters = req.body;
    const generation = await intelligentReporting.generateReport(req.params.id, generatedBy, parameters);
    res.status(201).json({ success: true, data: generation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/reports/:id/export", async (req, res) => {
  try {
    const report = await intelligentReporting.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    // In a real implementation, this would return the actual file
    res.json({ success: true, data: { fileUrl: `/reports/${report.id}.${report.format}` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/reports/templates", async (req, res) => {
  try {
    const templates = await intelligentReporting.getReportTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/reports/:id/generations", async (req, res) => {
  try {
    const generations = await intelligentReporting.getReportGenerations(req.params.id);
    res.json({ success: true, data: generations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/reports/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analytics = await intelligentReporting.getReportAnalytics(organizationId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Executive Dashboard Endpoints
app.get("/v1/dashboard/executive", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const dashboard = await executiveDashboard.getExecutiveDashboard(organizationId);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/dashboards", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const dashboards = await executiveDashboard.getDashboards(organizationId, filters);
    res.json({ success: true, data: dashboards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/dashboards", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const createdBy = req.headers['x-user-id'] as string || 'user_1';
    const dashboard = await executiveDashboard.createDashboard(req.body, organizationId, createdBy);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/dashboards/:id", async (req, res) => {
  try {
    const dashboard = await executiveDashboard.getDashboard(req.params.id);
    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/dashboards/:id", async (req, res) => {
  try {
    const dashboard = await executiveDashboard.updateDashboard(req.params.id, req.body);
    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/dashboards/:id", async (req, res) => {
  try {
    const deleted = await executiveDashboard.deleteDashboard(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }
    res.json({ success: true, message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/dashboards/:id/alerts", async (req, res) => {
  try {
    const alerts = await executiveDashboard.getDashboardAlerts(req.params.id);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/dashboard/alerts/critical", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const alerts = await executiveDashboard.getCriticalAlerts(organizationId);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/dashboard/alerts/:id/trigger", async (req, res) => {
  try {
    await executiveDashboard.triggerAlert(req.params.id);
    res.json({ success: true, message: 'Alert triggered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/dashboard/performance", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const performance = await executiveDashboard.getPerformanceMetrics(organizationId);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/dashboard/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analytics = await executiveDashboard.getDashboardAnalytics(organizationId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ADVANCED SECURITY & COMPLIANCE ENDPOINTS
// ============================================================================

// Advanced Security Endpoints
app.get("/v1/security/events", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const events = await advancedSecurity.getSecurityEvents(organizationId, filters);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/security/events", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const userId = req.headers['x-user-id'] as string;
    const event = await advancedSecurity.createSecurityEvent(req.body, organizationId, userId);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/security/events/:id", async (req, res) => {
  try {
    const event = await advancedSecurity.getSecurityEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Security event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/security/events/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const event = await advancedSecurity.updateSecurityEventStatus(req.params.id, status);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Security event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/security/vulnerabilities", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const vulnerabilities = await advancedSecurity.getVulnerabilities(organizationId, filters);
    res.json({ success: true, data: vulnerabilities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/security/vulnerabilities", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const vulnerability = await advancedSecurity.createVulnerability(req.body, organizationId);
    res.status(201).json({ success: true, data: vulnerability });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/security/vulnerability-scan", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const initiatedBy = req.headers['x-user-id'] as string || 'user_1';
    const scan = await advancedSecurity.performVulnerabilityScan({
      ...req.body,
      organizationId,
      initiatedBy
    });
    res.status(201).json({ success: true, data: scan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/security/vulnerability-scans", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const scans = await advancedSecurity.getVulnerabilityScans(organizationId);
    res.json({ success: true, data: scans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/security/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analytics = await advancedSecurity.getSecurityAnalytics(organizationId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance Management Endpoints
app.get("/v1/compliance/requirements", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const requirements = await complianceManagement.getComplianceRequirements(organizationId, filters);
    res.json({ success: true, data: requirements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/compliance/requirements", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const requirement = await complianceManagement.createComplianceRequirement(req.body, organizationId);
    res.status(201).json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/compliance/requirements/:id", async (req, res) => {
  try {
    const requirement = await complianceManagement.getComplianceRequirement(req.params.id);
    if (!requirement) {
      return res.status(404).json({ success: false, error: 'Compliance requirement not found' });
    }
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/compliance/requirements/:id", async (req, res) => {
  try {
    const requirement = await complianceManagement.updateComplianceRequirement(req.params.id, req.body);
    if (!requirement) {
      return res.status(404).json({ success: false, error: 'Compliance requirement not found' });
    }
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/v1/compliance/requirements/:id", async (req, res) => {
  try {
    const deleted = await complianceManagement.deleteComplianceRequirement(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Compliance requirement not found' });
    }
    res.json({ success: true, message: 'Compliance requirement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/compliance/requirements/:id/evidence", async (req, res) => {
  try {
    const evidence = await complianceManagement.addComplianceEvidence(req.params.id, req.body);
    if (!evidence) {
      return res.status(404).json({ success: false, error: 'Compliance requirement not found' });
    }
    res.status(201).json({ success: true, data: evidence });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/compliance/requirements/:id/controls", async (req, res) => {
  try {
    const control = await complianceManagement.addComplianceControl(req.params.id, req.body);
    if (!control) {
      return res.status(404).json({ success: false, error: 'Compliance requirement not found' });
    }
    res.status(201).json({ success: true, data: control });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/compliance/assessments", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const assessor = req.headers['x-user-id'] as string || 'user_1';
    const assessment = await complianceManagement.performComplianceAssessment({
      ...req.body,
      organizationId,
      assessor
    });
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/compliance/assessments", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const assessments = await complianceManagement.getComplianceAssessments(organizationId);
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/compliance/status", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const standard = req.query.standard as string;
    const status = await complianceManagement.getComplianceStatus(organizationId, standard);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/compliance/reports", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const standard = req.body.standard;
    const report = await complianceManagement.generateComplianceReport(organizationId, standard);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comprehensive Audit Endpoints
app.get("/v1/audit/logs", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const logs = await comprehensiveAudit.getAuditLogs(organizationId, filters);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/audit/logs", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const userId = req.headers['x-user-id'] as string;
    const log = await comprehensiveAudit.createAuditLog(req.body, organizationId, userId);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/audit/logs/:id", async (req, res) => {
  try {
    const log = await comprehensiveAudit.getAuditLog(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Audit log not found' });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/audit/trails", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const trails = await comprehensiveAudit.getAuditTrails(organizationId, filters);
    res.json({ success: true, data: trails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/audit/trails/:entityType/:entityId", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const trails = await comprehensiveAudit.getAuditTrail(
      req.params.entityType,
      req.params.entityId,
      organizationId
    );
    res.json({ success: true, data: trails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/audit/reports", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const report = await comprehensiveAudit.createAuditReport({
      ...req.body,
      organizationId
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/audit/reports/:id/execute", async (req, res) => {
  try {
    const report = await comprehensiveAudit.getAuditReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Audit report not found' });
    }
    const executedReport = await comprehensiveAudit.executeAudit(report);
    res.json({ success: true, data: executedReport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/audit/reports", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const reports = await comprehensiveAudit.getAuditReports(organizationId);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/audit/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const period = req.query.period ? JSON.parse(req.query.period as string) : undefined;
    const analytics = await comprehensiveAudit.getAuditAnalytics(organizationId, period);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/audit/forensic", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const analysis = await comprehensiveAudit.performForensicAnalysis(organizationId, req.body);
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Threat Detection Endpoints
app.get("/v1/threats/detections", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const detections = await threatDetection.getThreatDetections(organizationId, filters);
    res.json({ success: true, data: detections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/threats/detections", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const detection = await threatDetection.detectThreat({
      ...req.body,
      organizationId
    });
    res.status(201).json({ success: true, data: detection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/threats/detections/:id", async (req, res) => {
  try {
    const detection = await threatDetection.getThreatDetection(req.params.id);
    if (!detection) {
      return res.status(404).json({ success: false, error: 'Threat detection not found' });
    }
    res.json({ success: true, data: detection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/threats/incidents", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const filters = req.query;
    const incidents = await threatDetection.getSecurityIncidents(organizationId, filters);
    res.json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/v1/threats/incidents", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const reportedBy = req.headers['x-user-id'] as string || 'user_1';
    const incident = await threatDetection.createSecurityIncident(req.body, organizationId, reportedBy);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/threats/incidents/:id", async (req, res) => {
  try {
    const incident = await threatDetection.getSecurityIncident(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Security incident not found' });
    }
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/v1/threats/incidents/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const incident = await threatDetection.updateIncidentStatus(req.params.id, status);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Security incident not found' });
    }
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/v1/threats/analytics", async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string || 'org_1';
    const period = req.query.period ? JSON.parse(req.query.period as string) : undefined;
    const analytics = await threatDetection.getThreatAnalytics(organizationId, period);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// GDPR SYSTEM ENDPOINTS
// ============================================================================

// GDPR Requests Management
app.post("/v1/gdpr/requests", async (req, res) => {
  try {
    const { userId, type, dataCategories, scope, priority, reason } = req.body;
    
    if (!userId || !type || !dataCategories) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "userId, type, and dataCategories are required"
      });
    }

    const gdprRequest = await gdprAudit.createGDPRRequest(
      userId,
      type,
      req.headers['x-user-id'] as string || 'system',
      dataCategories,
      scope || 'user',
      priority || 'medium',
      reason
    );

    logger.info("GDPR request created", {
      requestId: gdprRequest.id,
      userId,
      type,
      dataCategories
    });

    return res.json({
      success: true,
      data: gdprRequest
    });
  } catch (error: any) {
    logger.error("Failed to create GDPR request", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to create GDPR request",
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/requests", async (req, res) => {
  try {
    const { userId } = req.query;
    const requests = gdprAudit.getGDPRRequests(userId as string);
    
    return res.json({
      success: true,
      data: {
        requests,
        count: requests.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get GDPR requests", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get GDPR requests",
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = gdprAudit.getGDPRRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        error: "Request not found",
        message: `GDPR request with ID ${requestId} not found`
      });
    }

    return res.json({
      success: true,
      data: request
    });
  } catch (error: any) {
    logger.error("Failed to get GDPR request", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get GDPR request",
      message: (error as Error).message
    });
  }
});

// GDPR Data Export
app.post("/v1/gdpr/export", async (req, res) => {
  try {
    const { userId, dataCategories, format, scope } = req.body;
    
    if (!userId || !dataCategories) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "userId and dataCategories are required"
      });
    }

    const dataExport = await gdprExport.createExportRequest(
      userId,
      req.headers['x-user-id'] as string || 'system',
      dataCategories,
      format || 'zip',
      scope || 'user'
    );

    logger.info("GDPR export request created", {
      exportId: dataExport.id,
      userId,
      dataCategories,
      format
    });

    return res.json({
      success: true,
      data: dataExport
    });
  } catch (error: any) {
    logger.error("Failed to create export request", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to create export request",
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/export/:exportId", async (req, res) => {
  try {
    const { exportId } = req.params;
    const dataExport = gdprExport.getExport(exportId);
    
    if (!dataExport) {
      return res.status(404).json({ 
        error: "Export not found",
        message: `Export with ID ${exportId} not found`
      });
    }

    return res.json({
      success: true,
      data: dataExport
    });
  } catch (error: any) {
    logger.error("Failed to get export", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get export",
      message: (error as Error).message
    });
  }
});

// GDPR Data Erase
app.post("/v1/gdpr/erase", async (req, res) => {
  try {
    const { userId, dataCategories, type, reason } = req.body;
    
    if (!userId || !dataCategories) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "userId and dataCategories are required"
      });
    }

    const dataErase = await gdprErase.createEraseRequest(
      userId,
      req.headers['x-user-id'] as string || 'system',
      dataCategories,
      type || 'soft',
      reason
    );

    logger.info("GDPR erase request created", {
      eraseId: dataErase.id,
      userId,
      dataCategories,
      type
    });

    return res.json({
      success: true,
      data: dataErase
    });
  } catch (error: any) {
    logger.error("Failed to create erase request", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to create erase request",
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/erase/:eraseId", async (req, res) => {
  try {
    const { eraseId } = req.params;
    const dataErase = gdprErase.getErase(eraseId);
    
    if (!dataErase) {
      return res.status(404).json({ 
        error: "Erase not found",
        message: `Erase with ID ${eraseId} not found`
      });
    }

    return res.json({
      success: true,
      data: dataErase
    });
  } catch (error: any) {
    logger.error("Failed to get erase", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get erase",
      message: (error as Error).message
    });
  }
});

// GDPR Legal Holds
app.get("/v1/gdpr/legal-holds", async (req, res) => {
  try {
    const legalHolds = gdprErase.getLegalHolds();
    
    return res.json({
      success: true,
      data: {
        legalHolds,
        count: legalHolds.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get legal holds", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get legal holds",
      message: (error as Error).message
    });
  }
});

app.post("/v1/gdpr/legal-holds", async (req, res) => {
  try {
    const legalHoldData = req.body;
    
    const legalHold = gdprErase.addLegalHold(legalHoldData);
    
    logger.info("Legal hold created", { holdId: legalHold.id, name: legalHold.name });

    return res.json({
      success: true,
      data: legalHold
    });
  } catch (error: any) {
    logger.error("Failed to create legal hold", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to create legal hold",
      message: (error as Error).message
    });
  }
});

// GDPR Audit and Compliance
app.get("/v1/gdpr/audit", async (req, res) => {
  try {
    const { requestId } = req.query;
    const auditEntries = gdprAudit.getAuditEntries(requestId as string);
    
    return res.json({
      success: true,
      data: {
        auditEntries,
        count: auditEntries.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get audit entries", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get audit entries",
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/breaches", async (req, res) => {
  try {
    const breaches = gdprAudit.getBreaches();
    
    return res.json({
      success: true,
      data: {
        breaches,
        count: breaches.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get breaches", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get breaches",
      message: (error as Error).message
    });
  }
});

app.post("/v1/gdpr/breaches", async (req, res) => {
  try {
    const { type, severity, description, affectedDataCategories, affectedDataSubjects } = req.body;
    
    if (!type || !severity || !description || !affectedDataCategories || !affectedDataSubjects) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "type, severity, description, affectedDataCategories, and affectedDataSubjects are required"
      });
    }

    const breach = await gdprAudit.recordBreach(
      type,
      severity,
      description,
      affectedDataCategories,
      affectedDataSubjects,
      req.headers['x-user-id'] as string || 'system'
    );

    logger.warn("Data breach recorded", {
      breachId: breach.id,
      type,
      severity,
      affectedDataSubjects
    });

    return res.json({
      success: true,
      data: breach
    });
  } catch (error: any) {
    logger.error("Failed to record breach", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to record breach",
      message: (error as Error).message
    });
  }
});

// GDPR Statistics and Reports
app.get("/v1/gdpr/stats", async (req, res) => {
  try {
    const gdprStats = gdprAudit.getGDPRStats();
    const exportStats = gdprExport.getExportStats();
    const eraseStats = gdprErase.getEraseStats();
    
    return res.json({
      success: true,
      data: {
        gdpr: gdprStats,
        exports: exportStats,
        erasures: eraseStats
      }
    });
  } catch (error: any) {
    logger.error("Failed to get GDPR stats", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get GDPR stats",
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/compliance-report", async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        error: "Missing required parameters",
        message: "start and end dates are required"
      });
    }

    const period = {
      start: new Date(start as string),
      end: new Date(end as string)
    };

    const report = gdprAudit.getComplianceReport(period);
    
    return res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error("Failed to get compliance report", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get compliance report",
      message: (error as Error).message
    });
  }
});

// GDPR Data Categories
app.get("/v1/gdpr/data-categories", async (req, res) => {
  try {
    const dataCategories = gdprExport.getDataCategories();
    
    return res.json({
      success: true,
      data: {
        dataCategories,
        count: dataCategories.length
      }
    });
  } catch (error: any) {
    logger.error("Failed to get data categories", { error: (error as Error).message });
    return res.status(500).json({ 
      error: "Failed to get data categories",
      message: (error as Error).message
    });
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
    return res.json(user);
  } catch (error) {
    logger.error('Failed to get user', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
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
    
    return res.json(result);
  } catch (error) {
    logger.error('Authentication failed', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
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
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to setup MFA', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/security/mfa/verify", async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ error: 'userId and code are required' });
    }
    
    const isValid = await securitySystem.verifyMFA(userId, code);
    return res.json({ valid: isValid });
  } catch (error) {
    logger.error('MFA verification failed', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
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
    return res.status(201).json(role);
  } catch (error) {
    logger.error('Failed to create role', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Role and Permission Management
app.post("/v1/security/roles", async (req, res) => {
  try {
    const { name, description, permissions, orgId } = req.body;
    const role = await securitySystem.createRole(name, description || '', permissions || [], orgId);
    res.json(role);
  } catch (error) {
    logger.error('Failed to create role', { error: (error as Error).message });
    res.status(500).json({ error: (error as Error).message });
  }
});

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
    return res.status(201).json(permission);
  } catch (error) {
    logger.error('Failed to create permission', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
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
    return res.json({ hasPermission });
  } catch (error) {
    logger.error('Permission check failed', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
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
    return res.json(threatIntel);
  } catch (error) {
    logger.error('Failed to get threat intelligence', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/v1/security/threats/check", async (req, res) => {
  try {
    const { ipAddress } = req.body;
    if (!ipAddress) {
      return res.status(400).json({ error: 'ipAddress is required' });
    }
    
    const threatIntel = await securitySystem.checkIPReputation(ipAddress);
    return res.json(threatIntel);
  } catch (error) {
    logger.error('IP reputation check failed', { error: (error as Error).message });
    return res.status(500).json({ error: (error as Error).message });
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
app.get("/metrics", (req, res) => {
  try {
    const prometheusMetrics = metrics.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: (error as Error).message });
    res.status(500).send('# Error generating Prometheus metrics\n');
  }
});

// =============================================================================
// ECONEURA AGENTS ENDPOINTS (60 AGENTS REGISTRY)
// =============================================================================

// Agent registry endpoints
app.get("/v1/agents", (req, res) => {
  try {
    const { category } = req.query;
    
    let agents = AGENTS_REGISTRY;
    if (category) {
      agents = getAgentsByCategory(category as any);
    }
    
    const agentsInfo = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      version: agent.version,
      costHint: agent.costHint,
      tags: agent.tags,
      deprecated: agent.deprecated,
      policy: agent.policy,
    }));
    
    res.json({
      success: true,
      data: {
        agents: agentsInfo,
        count: agentsInfo.length,
        categories: getAllCategories(),
        stats: getRegistryStats(),
      }
    });
  } catch (error) {
    logger.error('Failed to get agents registry', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/agents/:agentId", (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = getAgentById(agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const agentInfo = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      version: agent.version,
      costHint: agent.costHint,
      tags: agent.tags,
      deprecated: agent.deprecated,
      policy: agent.policy,
      inputSchema: agent.inputs._def,
      outputSchema: agent.outputs._def,
    };
    
    res.json({
      success: true,
      data: agentInfo
    });
  } catch (error) {
    logger.error('Failed to get agent details', { error: (error as Error).message, agentId: req.params.agentId });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent execution endpoint
app.post("/v1/agents/run", finOpsBudgetCheckMiddleware, async (req, res) => {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] as string || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { agentId, inputs, context } = req.body;
    
    if (!agentId || !inputs) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'agentId and inputs are required' 
      });
    }
    
    const agent = getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (agent.deprecated) {
      return res.status(410).json({ 
        error: 'Agent deprecated', 
        message: `Agent ${agentId} is deprecated and no longer available` 
      });
    }
    
    // Create execution context
    const executionContext = {
      orgId: context?.orgId || req.headers['x-org-id'] as string || 'default',
      userId: context?.userId || req.headers['x-user-id'] as string || 'system',
      correlationId,
      idempotencyKey: context?.idempotencyKey,
      metadata: {
        ...context?.metadata,
        requestId: req.headers['x-request-id'],
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    };
    
    // Validate inputs
    try {
      agent.inputs.parse(inputs);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Invalid inputs',
        message: 'Agent inputs validation failed',
        details: (validationError as any).errors || validationError,
      });
    }
    
    // Execute agent
    const result = await agent.run(inputs, executionContext);
    const executionTimeMs = Date.now() - startTime;
    
    // Validate outputs if successful
    if (result.success && result.data) {
      try {
        agent.outputs.parse(result.data);
      } catch (outputValidationError) {
        logger.error('Agent output validation failed', { 
          agentId, 
          error: (outputValidationError as Error).message,
          correlationId 
        });
        // Continue anyway, but log the issue
      }
    }
    
    // Add FinOps headers
    const costEur = result.costEur || 0;
    const budgetPct = await finOpsSystem.calculateBudgetPercentage(executionContext.orgId, costEur);
    
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': budgetPct.toFixed(1),
      'X-Latency-ms': executionTimeMs.toString(),
      'X-Route': 'agent-execution',
      'X-Correlation-Id': correlationId,
    });
    
    // Track cost
    await finOpsSystem.trackCost({
      organizationId: executionContext.orgId,
      service: 'agents',
      operation: `agent_${agentId}`,
      costEur,
      metadata: {
        agentId,
        category: agent.category,
        executionTimeMs,
        success: result.success,
      },
    });
    
    res.json({
      success: true,
      data: {
        executionId: correlationId,
        agentId,
        result,
        executionTimeMs,
        costEur,
      }
    });
    
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    
    logger.error('Agent execution failed', { 
      error: (error as Error).message, 
      agentId: req.body.agentId,
      correlationId,
      executionTimeMs,
    });
    
    // Track failed execution cost
    await finOpsSystem.trackCost({
      organizationId: req.headers['x-org-id'] as string || 'default',
      service: 'agents',
      operation: `agent_${req.body.agentId}_failed`,
      costEur: 0.01, // Minimal cost for failed execution
      metadata: {
        agentId: req.body.agentId,
        executionTimeMs,
        success: false,
        error: (error as Error).message,
      },
    });
    
    res.status(500).json({ 
      error: 'Agent execution failed', 
      message: (error as Error).message,
      correlationId,
    });
  }
});

// Agent execution status endpoint
app.get("/v1/agents/runs/:executionId", async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // In a real implementation, this would query a database
    // For now, return a mock response
    const mockExecution: AgentExecutionRecord = {
      id: executionId,
      agentId: 'unknown',
      status: 'completed',
      inputs: {},
      outputs: {},
      context: {
        orgId: 'default',
        userId: 'system',
        correlationId: executionId,
      },
      startedAt: new Date(),
      completedAt: new Date(),
      costEur: 0.05,
      executionTimeMs: 1500,
      retryCount: 0,
    };
    
    res.json({
      success: true,
      data: mockExecution
    });
  } catch (error) {
    logger.error('Failed to get agent execution status', { 
      error: (error as Error).message, 
      executionId: req.params.executionId 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cockpit overview endpoint
app.get("/v1/cockpit/overview", async (req, res) => {
  try {
    const organizationId = req.headers['x-org-id'] as string || 'default';
    
    // Get agent statistics
    const agentStats = getRegistryStats();
    
    // Mock data for cockpit overview
    const overview = {
      agents: {
        total: agentStats.total,
        byCategory: agentStats.byCategory,
        byCostCategory: agentStats.byCostCategory,
        running: Math.floor(Math.random() * 10) + 1,
        failed: Math.floor(Math.random() * 3),
        completed: Math.floor(Math.random() * 50) + 20,
      },
      queues: {
        pending: Math.floor(Math.random() * 15) + 5,
        processing: Math.floor(Math.random() * 8) + 2,
        failed: Math.floor(Math.random() * 3),
      },
      performance: {
        cacheHitRate: (Math.random() * 0.3 + 0.7).toFixed(2), // 70-100%
        p95ResponseTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
        errorRate5xx: (Math.random() * 0.02).toFixed(4), // 0-2%
      },
      budget: await finOpsSystem.getBudgetStatus(organizationId),
      dunning: {
        upcoming7Days: Math.floor(Math.random() * 12) + 3,
        overdue: Math.floor(Math.random() * 5) + 1,
      },
    };
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Failed to get cockpit overview', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent categories endpoint
app.get("/v1/agents/categories", (req, res) => {
  try {
    const categories = getAllCategories();
    const categoryStats = getRegistryStats().byCategory;
    
    const categoriesWithStats = categories.map(category => ({
      name: category,
      count: categoryStats[category] || 0,
      agents: getAgentsByCategory(category as any).map(agent => ({
        id: agent.id,
        name: agent.name,
        costHint: agent.costHint,
        deprecated: agent.deprecated,
      })),
    }));
    
    res.json({
      success: true,
      data: {
        categories: categoriesWithStats,
        total: categories.length,
      }
    });
  } catch (error) {
    logger.error('Failed to get agent categories', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware de manejo de errores
app.use(errorObservabilityMiddleware);

// Global error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  structuredLogger.error('Unhandled error', err, {
    requestId,
    operation: 'error_handler',
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Determine error response
  let statusCode = 500;
  let message = 'Internal server error';
  let context: Record<string, unknown> = {};

  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
    context = err.context || {};
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
    context = err.context || {};
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  const errorResponse = ErrorHandler.createErrorResponse(err, statusCode, {
    requestId,
    path: req.path,
    method: req.method,
    ...context
  });

  res.status(statusCode).json(errorResponse);
});

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
  console.log(`🔄 Workflow system enabled with BPMN and state machines`);
  console.log(`🔐 Advanced Security system enabled with MFA, RBAC, and threat detection`);
  console.log(`🏦 SEPA system enabled with CAMT/MT940 parsing and intelligent matching`);
  console.log(`🔒 GDPR system enabled with export/erase and compliance management`);
  console.log(`🛡️ RLS generative suite enabled with CI/CD integration`);
  console.log(`💰 FinOps system enabled with cost tracking, budget management, optimization, and reporting`);
  console.log(`🔇 Quiet Hours + On-Call system enabled with intelligent scheduling, escalation, and notifications`);
  console.log(`🔥 Warm-up IA/Search system enabled with intelligent caching, search optimization, and performance monitoring`);
  console.log(`📊 Advanced Analytics & BI system enabled with real-time analytics, business intelligence, intelligent reporting, and executive dashboards`);
console.log(`🛡️ Advanced Security & Compliance system enabled with threat detection, compliance management, comprehensive auditing, and security monitoring`);
  console.log(`🔧 Advanced improvements enabled: Error handling, Logging, Validation, Rate limiting, Caching, Health monitoring, Security, Process management`);
  
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