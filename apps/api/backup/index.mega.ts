import express from "express";
import cors from "cors";
import helmet from "helmet";
import { structuredLogger } from "./lib/structured-logger.js";
import { ErrorHandler } from "./lib/error-handler.js";

// Import health modes (PR-22)
import { healthModeManager } from './lib/health-modes.js';
import { healthMonitor } from './lib/health-monitor.js';
import { cacheManager } from './lib/advanced-cache.js';

// Import FinOps services (PR-45)
import { finOpsSystem } from './lib/finops.js';
import { BudgetManagerService } from './lib/budget-manager.service.js';
import { CostTrackerService } from './lib/cost-tracker.service.js';
import { CostOptimizerService } from './lib/cost-optimizer.service.js';

// Import SEPA services (PR-42)
import { SEPAParserService } from './lib/sepa-parser.service.js';

// Import GDPR services (PR-43)
import { GDPRExportService } from './lib/gdpr-export.service.js';
import { GDPREraseService } from './lib/gdpr-erase.service.js';
import { GDPRAuditService } from './lib/gdpr-audit.service.js';

// Import middlewares (PR-27, PR-28, PR-29)
import { observabilityMiddleware } from './middleware/observability.js';
import { finOpsMiddleware } from './middleware/finops.js';

// Import routers for working PRs
import { analyticsRouter } from './routes/analytics.js';
import { eventsRouter } from './routes/events.js';
import { cockpitRouter } from './routes/cockpit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const errorHandler = new ErrorHandler();
const budgetManager = new BudgetManagerService();
const costTracker = new CostTrackerService();
const costOptimizer = new CostOptimizerService();
const sepaParser = new SEPAParserService();
const gdprExport = new GDPRExportService();
const gdprErase = new GDPREraseService();
const gdprAudit = new GDPRAuditService();

// Security middleware (PR-28)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration (PR-28)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 'X-Correlation-ID'],
  exposedHeaders: ['X-System-Mode', 'X-Est-Cost-EUR', 'X-Budget-Pct', 'X-Latency-ms', 'X-Route']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply observability middleware (PR-23)
app.use(observabilityMiddleware);

// Apply FinOps middleware (PR-29)
app.use(finOpsMiddleware);

// Simple rate limiting (PR-29)
const rateLimitStore = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const record = rateLimitStore.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
});

// Basic validation middleware (PR-27)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    if (req.body && typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }
  }
  next();
});

// Basic health check endpoint (< 200ms, no external dependencies)
app.get("/health", (req, res) => {
  const ts = new Date().toISOString();
  const version = process.env.npm_package_version || "1.0.0";
  const currentMode = healthModeManager.getCurrentMode();
  res.set('X-System-Mode', currentMode);
  res.status(200).json({
    status: "ok",
    ts,
    version,
    mode: currentMode
  });
});

// Enhanced Health check endpoints (PR-22)
app.get("/health/live", async (req, res) => {
  try {
    const result = await healthModeManager.getLivenessProbe();
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.set('X-System-Mode', result.mode);
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: "error",
      mode: "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      error: (error as Error).message
    });
  }
});

app.get("/health/ready", async (req, res) => {
  try {
    const result = await healthModeManager.getReadinessProbe();
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.set('X-System-Mode', result.mode);
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: "error",
      mode: "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      error: (error as Error).message
    });
  }
});

// FinOps endpoints (PR-45)
app.get("/v1/finops/budgets", async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const budgets = await budgetManager.getBudgetsByOrganization(orgId);

    res.set({
      'X-Est-Cost-EUR': '0.0020',
      'X-Budget-Pct': '0.3',
      'X-Latency-ms': '45',
      'X-Route': 'local'
    });

    res.json({
      success: true,
      data: budgets,
      count: budgets.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get budgets',
      message: (error as Error).message
    });
  }
});

app.post("/v1/finops/budgets", async (req, res) => {
  try {
    const budget = await budgetManager.createBudget(req.body);

    res.set({
      'X-Est-Cost-EUR': '0.0050',
      'X-Budget-Pct': '0.8',
      'X-Latency-ms': '120',
      'X-Route': 'local'
    });

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create budget',
      message: (error as Error).message
    });
  }
});

app.get("/v1/finops/costs", async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const costs = await costTracker.getCostsByOrganization(orgId);

    res.set({
      'X-Est-Cost-EUR': '0.0030',
      'X-Budget-Pct': '0.5',
      'X-Latency-ms': '85',
      'X-Route': 'local'
    });

    res.json({
      success: true,
      data: costs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get costs',
      message: (error as Error).message
    });
  }
});

// GDPR endpoints (PR-43)
app.post("/v1/gdpr/export", async (req, res) => {
  try {
    const { userId, dataTypes } = req.body;
    const exportResult = await gdprExport.exportUserData(userId, dataTypes);

    res.json({
      success: true,
      data: exportResult,
      message: 'Data export initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: (error as Error).message
    });
  }
});

app.delete("/v1/gdpr/erase/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const eraseResult = await gdprErase.eraseUserData(userId);

    res.json({
      success: true,
      data: eraseResult,
      message: 'Data erasure initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to erase data',
      message: (error as Error).message
    });
  }
});

app.get("/v1/gdpr/audit", async (req, res) => {
  try {
    const auditLogs = await gdprAudit.getAuditLogs(req.query);

    res.json({
      success: true,
      data: auditLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs',
      message: (error as Error).message
    });
  }
});

// SEPA endpoints (PR-42)
app.post("/v1/sepa/parse", async (req, res) => {
  try {
    const { xmlData } = req.body;
    const parsedData = await sepaParser.parseXML(xmlData);

    res.json({
      success: true,
      data: parsedData,
      message: 'SEPA data parsed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to parse SEPA data',
      message: (error as Error).message
    });
  }
});

// System metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    const cacheStats = cacheManager.getAllStats();
    const memoryUsage = process.memoryUsage();

    // Generate Prometheus-style metrics
    const metrics = `
# HELP econeura_cache_hits_total Total number of cache hits
# TYPE econeura_cache_hits_total counter
econeura_cache_hits_total{cache="all"} ${Object.values(cacheStats).reduce((sum: number, stats: any) => sum + (stats?.hits || 0), 0)}

# HELP econeura_cache_misses_total Total number of cache misses
# TYPE econeura_cache_misses_total counter
econeura_cache_misses_total{cache="all"} ${Object.values(cacheStats).reduce((sum: number, stats: any) => sum + (stats?.misses || 0), 0)}

# HELP econeura_system_memory_heap_used_bytes Memory heap used in bytes
# TYPE econeura_system_memory_heap_used_bytes gauge
econeura_system_memory_heap_used_bytes ${memoryUsage.heapUsed}

# HELP econeura_system_memory_heap_total_bytes Memory heap total in bytes
# TYPE econeura_system_memory_heap_total_bytes gauge
econeura_system_memory_heap_total_bytes ${memoryUsage.heapTotal}

# HELP econeura_system_uptime_seconds System uptime in seconds
# TYPE econeura_system_uptime_seconds counter
econeura_system_uptime_seconds ${process.uptime()}
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: (error as Error).message
    });
  }
});

// Cache statistics endpoint
app.get("/cache/stats", (req, res) => {
  try {
    const stats = cacheManager.getAllStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: (error as Error).message
    });
  }
});

// API info endpoint with comprehensive feature list
app.get("/", (req, res) => {
  res.json({
    name: "ECONEURA API",
    version: process.env.npm_package_version || "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    features: [
      "PR-22: Health modes (live/ready/degraded)",
      "PR-23: Observability coherente (logs + métricas + traces)",
      "PR-24: Analytics events with Zod validation",
      "PR-27: Validación básica en requests",
      "PR-28: Security headers completos + CORS + Helmet",
      "PR-29: Rate limiting + Budget guard",
      "PR-42: SEPA Ingest + Parsing",
      "PR-43: GDPR Export/Erase + Audit",
      "PR-45: FinOps Panel completo",
      "SSE: Real-time events and notifications",
      "Cockpit: Operational dashboard endpoints",
      "Cache: Advanced caching with statistics",
      "Metrics: Prometheus-compatible metrics endpoint"
    ],
    endpoints: [
      "GET /health - Basic health check",
      "GET /health/live - Liveness probe (PR-22)",
      "GET /health/ready - Readiness probe (PR-22)",
      "GET /metrics - Prometheus metrics (PR-23)",
      "GET /cache/stats - Cache statistics",
      "POST /v1/analytics/events - Track analytics events (PR-24)",
      "GET /v1/analytics/events - Query analytics events (PR-24)",
      "GET /v1/analytics/metrics - Get aggregated metrics (PR-24)",
      "GET /v1/events - Server-Sent Events for real-time updates",
      "POST /v1/events/broadcast - Broadcast events to organization",
      "GET /v1/events/stats - SSE connection statistics",
      "GET /v1/cockpit/overview - Operational overview dashboard",
      "GET /v1/cockpit/agents - Agent execution details",
      "GET /v1/cockpit/costs - Cost breakdown by org/playbook",
      "GET /v1/cockpit/system - System metrics and health",
      "GET /v1/finops/budgets - List budgets (PR-45)",
      "POST /v1/finops/budgets - Create budget (PR-45)",
      "GET /v1/finops/costs - Cost tracking (PR-45)",
      "POST /v1/gdpr/export - Export user data (PR-43)",
      "DELETE /v1/gdpr/erase/:userId - Erase user data (PR-43)",
      "GET /v1/gdpr/audit - GDPR audit logs (PR-43)",
      "POST /v1/sepa/parse - Parse SEPA XML data (PR-42)"
    ]
  });
});

// Mount Analytics routes (PR-24)
app.use('/v1/analytics', analyticsRouter);

// Mount Events (SSE) routes
app.use('/v1/events', eventsRouter);

// Mount Cockpit routes
app.use('/v1/cockpit', cockpitRouter);

// Basic error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  structuredLogger.error('Unhandled error', error, {
    errorId,
    path: req.path,
    method: req.method,
    headers: req.headers
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    errorId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health', 'GET /health/live', 'GET /health/ready', 'GET /metrics',
      'GET /v1/analytics/*', 'GET /v1/events/*', 'GET /v1/cockpit/*',
      'GET /v1/finops/*', 'POST /v1/finops/*',
      'POST /v1/gdpr/*', 'DELETE /v1/gdpr/*', 'GET /v1/gdpr/*',
      'POST /v1/sepa/*'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  structuredLogger.info(`ECONEURA API Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    features: [
      'PR-22: Health modes (live/ready/degraded)',
      'PR-23: Observability coherente (logs + métricas + traces)',
      'PR-24: Analytics events with Zod validation',
      'PR-27: Validación básica en requests',
      'PR-28: Security headers completos + CORS + Helmet',
      'PR-29: Rate limiting + Budget guard',
      'PR-42: SEPA Ingest + Parsing',
      'PR-43: GDPR Export/Erase + Audit',
      'PR-45: FinOps Panel completo',
      'SSE: Real-time events and notifications',
      'Cockpit: Operational dashboard endpoints',
      'Cache: Advanced caching with statistics',
      'Metrics: Prometheus-compatible metrics endpoint'
    ],
    services: [
      'FinOps System: Budget management, cost tracking, optimization',
      'GDPR Services: Export, erase, audit compliance',
      'SEPA Parser: XML parsing and transaction matching',
      'Analytics: Event tracking and metrics',
      'Cache Manager: Multi-layer caching system',
      'Health Monitor: System health and degradation detection',
      'SSE Manager: Real-time event streaming'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  structuredLogger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    structuredLogger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  structuredLogger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    structuredLogger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
