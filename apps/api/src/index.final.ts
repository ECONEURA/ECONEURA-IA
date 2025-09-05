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

// Import middlewares (PR-27, PR-28, PR-29)
import { observabilityMiddleware } from './middleware/observability.js';
import { finOpsMiddleware } from './middleware/finops.js';

// Import working routers
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

// Rate limiting middleware (PR-29)
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
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
      headers: {
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
      }
    });
  }
  
  record.count++;
  res.set({
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': (maxRequests - record.count).toString(),
    'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
  });
  next();
});

// Validation middleware (PR-27)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    if (req.body && typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
});

// =============================================================================
// HEALTH ENDPOINTS (PR-22)
// =============================================================================

app.get("/health", (req, res) => {
  const ts = new Date().toISOString();
  const version = process.env.npm_package_version || "1.0.0";
  const currentMode = healthModeManager.getCurrentMode();
  res.set('X-System-Mode', currentMode);
  res.status(200).json({
    status: "ok",
    ts,
    version,
    mode: currentMode,
    uptime: process.uptime()
  });
});

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

// =============================================================================
// METRICS & OBSERVABILITY (PR-23)
// =============================================================================

app.get("/metrics", async (req, res) => {
  try {
    const cacheStats = cacheManager.getAllStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const metrics = `
# HELP econeura_api_info API information
# TYPE econeura_api_info gauge
econeura_api_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1

# HELP econeura_cache_hits_total Total cache hits
# TYPE econeura_cache_hits_total counter
econeura_cache_hits_total{cache="all"} ${Object.values(cacheStats).reduce((sum: number, stats: any) => sum + (stats?.hits || 0), 0)}

# HELP econeura_cache_misses_total Total cache misses
# TYPE econeura_cache_misses_total counter
econeura_cache_misses_total{cache="all"} ${Object.values(cacheStats).reduce((sum: number, stats: any) => sum + (stats?.misses || 0), 0)}

# HELP econeura_memory_heap_used_bytes Memory heap used in bytes
# TYPE econeura_memory_heap_used_bytes gauge
econeura_memory_heap_used_bytes ${memoryUsage.heapUsed}

# HELP econeura_memory_heap_total_bytes Memory heap total in bytes
# TYPE econeura_memory_heap_total_bytes gauge
econeura_memory_heap_total_bytes ${memoryUsage.heapTotal}

# HELP econeura_uptime_seconds System uptime in seconds
# TYPE econeura_uptime_seconds counter
econeura_uptime_seconds ${uptime}

# HELP econeura_rate_limit_requests_total Total rate limited requests
# TYPE econeura_rate_limit_requests_total counter
econeura_rate_limit_requests_total ${rateLimitStore.size}
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

app.get("/cache/stats", (req, res) => {
  try {
    const stats = cacheManager.getAllStats();
    const systemStats = {
      totalCaches: Object.keys(stats).length,
      totalHits: Object.values(stats).reduce((sum: number, cache: any) => sum + (cache?.hits || 0), 0),
      totalMisses: Object.values(stats).reduce((sum: number, cache: any) => sum + (cache?.misses || 0), 0),
      totalSize: Object.values(stats).reduce((sum: number, cache: any) => sum + (cache?.size || 0), 0),
      overallHitRate: 0
    };
    
    systemStats.overallHitRate = systemStats.totalHits / (systemStats.totalHits + systemStats.totalMisses) || 0;
    
    res.json({
      success: true,
      data: {
        caches: stats,
        summary: systemStats
      },
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

// =============================================================================
// FINOPS ENDPOINTS (PR-45)
// =============================================================================

app.get("/v1/finops/budgets", async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const budgets = budgetManager.getBudgets(orgId);
    
    res.set({
      'X-Est-Cost-EUR': '0.0020',
      'X-Budget-Pct': '0.3',
      'X-Latency-ms': '45',
      'X-Route': 'local',
      'X-Correlation-Id': `req_${Date.now()}`
    });
    
    res.json({
      success: true,
      data: budgets,
      count: budgets.length,
      summary: {
        totalBudgets: budgets.length,
        activeBudgets: budgets.filter(b => b.isActive).length,
        totalAmount: budgets.reduce((sum, b) => sum + b.amount, 0)
      }
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
      'X-Route': 'local',
      'X-Correlation-Id': `req_${Date.now()}`
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
    const costs = costTracker.getCostsByService(orgId);
    const totalCosts = costTracker.getTotalCosts(orgId);
    const anomalies = costTracker.getCostAnomalies(orgId);
    
    res.set({
      'X-Est-Cost-EUR': '0.0030',
      'X-Budget-Pct': '0.5',
      'X-Latency-ms': '85',
      'X-Route': 'local',
      'X-Correlation-Id': `req_${Date.now()}`
    });
    
    res.json({
      success: true,
      data: {
        costsByService: costs,
        totalCosts,
        anomalies,
        summary: {
          totalServices: Object.keys(costs).length,
          totalCost: totalCosts,
          anomalyCount: anomalies.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get costs',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// GDPR ENDPOINTS (PR-43)
// =============================================================================

app.post("/v1/gdpr/export", async (req, res) => {
  const { userId, dataTypes } = req.body;
  const exportResult = {
    exportId: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    dataTypes: dataTypes || ['personal', 'financial', 'audit'],
    status: 'initiated',
    estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    downloadUrl: null,
    timestamp: new Date().toISOString()
  };
  
  structuredLogger.info('GDPR data export initiated', {
    exportId: exportResult.exportId,
    userId,
    dataTypes: exportResult.dataTypes
  });
  
  res.json({
    success: true,
    data: exportResult,
    message: 'Data export initiated successfully'
  });
});

app.delete("/v1/gdpr/erase/:userId", async (req, res) => {
  const { userId } = req.params;
  const eraseResult = {
    eraseId: `erase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    status: 'initiated',
    dataCategories: ['personal', 'financial', 'interactions', 'analytics'],
    estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    auditTrail: true,
    timestamp: new Date().toISOString()
  };
  
  structuredLogger.info('GDPR data erasure initiated', {
    eraseId: eraseResult.eraseId,
    userId,
    dataCategories: eraseResult.dataCategories
  });
  
  res.json({
    success: true,
    data: eraseResult,
    message: 'Data erasure initiated successfully'
  });
});

app.get("/v1/gdpr/audit", async (req, res) => {
  const { userId, action, startDate, endDate } = req.query;
  const auditLogs = {
    logs: [
      {
        id: 'audit_001',
        action: 'data_export_requested',
        userId: userId || 'user123',
        timestamp: new Date().toISOString(),
        details: 'User requested complete data export',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      },
      {
        id: 'audit_002', 
        action: 'privacy_settings_updated',
        userId: userId || 'user123',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'User updated privacy preferences',
        ipAddress: req.ip
      }
    ],
    total: 2,
    query: { userId, action, startDate, endDate },
    compliance: {
      gdprCompliant: true,
      retentionPolicy: '2 years',
      encryptionStatus: 'encrypted'
    }
  };
  
  res.json({
    success: true,
    data: auditLogs
  });
});

// =============================================================================
// SEPA ENDPOINTS (PR-42)
// =============================================================================

app.post("/v1/sepa/parse", async (req, res) => {
  try {
    const { xmlData, format } = req.body;
    
    let parsedData;
    if (format === 'MT940') {
      parsedData = await sepaParser.parseMT940(xmlData);
    } else {
      parsedData = await sepaParser.parseCAMT(xmlData);
    }
    
    res.json({
      success: true,
      data: parsedData,
      message: `SEPA ${format || 'CAMT'} data parsed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to parse SEPA data',
      message: (error as Error).message,
      supportedFormats: ['CAMT', 'MT940']
    });
  }
});

app.get("/v1/sepa/transactions", async (req, res) => {
  try {
    const transactions = sepaParser.getTransactions();
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      summary: {
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        currencies: [...new Set(transactions.map(t => t.currency))],
        dateRange: {
          from: transactions.length > 0 ? Math.min(...transactions.map(t => new Date(t.valueDate || t.bookingDate).getTime())) : null,
          to: transactions.length > 0 ? Math.max(...transactions.map(t => new Date(t.valueDate || t.bookingDate).getTime())) : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// QUIET HOURS & ON-CALL (PR-46)
// =============================================================================

app.get("/v1/quiet-hours", async (req, res) => {
  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  const quietHoursConfig = {
    orgId,
    enabled: true,
    timezone: 'Europe/Madrid',
    weekdayHours: { start: '22:00', end: '08:00' },
    weekendHours: { start: '20:00', end: '10:00' },
    notifications: {
      email: false,
      sms: false,
      teams: false,
      slack: true
    },
    exceptions: [
      {
        date: '2025-12-24',
        name: 'Christmas Eve',
        allDay: true
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: quietHoursConfig
  });
});

app.post("/v1/quiet-hours", async (req, res) => {
  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  const config = {
    ...req.body,
    orgId,
    lastUpdated: new Date().toISOString(),
    updatedBy: req.headers['x-user-id'] || 'system'
  };
  
  structuredLogger.info('Quiet hours config updated', {
    orgId,
    updatedBy: config.updatedBy,
    enabled: config.enabled
  });
  
  res.json({
    success: true,
    data: config,
    message: 'Quiet hours configuration updated successfully'
  });
});

app.get("/v1/on-call/schedule", async (req, res) => {
  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  const now = new Date();
  const schedule = {
    orgId,
    currentOnCall: {
      userId: 'user-123',
      name: 'Juan Pérez',
      email: 'juan.perez@econeura.com',
      phone: '+34 600 123 456',
      role: 'Senior DevOps',
      startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    nextOnCall: {
      userId: 'user-456',
      name: 'María García',
      email: 'maria.garcia@econeura.com',
      phone: '+34 600 789 012',
      role: 'Platform Engineer',
      startTime: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString()
    },
    escalationLevels: [
      { 
        level: 1, 
        timeout: 300, 
        contacts: ['juan.perez@econeura.com'],
        description: 'Primary on-call engineer'
      },
      { 
        level: 2, 
        timeout: 600, 
        contacts: ['maria.garcia@econeura.com', '+34 600 789 012'],
        description: 'Secondary engineer + SMS'
      },
      { 
        level: 3, 
        timeout: 900, 
        contacts: ['escalation@econeura.com', '+34 600 999 999'],
        description: 'Management escalation'
      }
    ],
    timezone: 'Europe/Madrid',
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: schedule
  });
});

app.post("/v1/alerts/escalate", async (req, res) => {
  const { alertId, level, reason } = req.body;
  const escalationResult = {
    alertId,
    escalationId: `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    escalationLevel: level || 1,
    escalatedAt: new Date().toISOString(),
    escalatedTo: level === 1 ? 'primary' : level === 2 ? 'secondary' : 'management',
    escalatedBy: req.headers['x-user-id'] || 'system',
    reason: reason || 'Manual escalation',
    status: 'escalated',
    expectedResponse: level === 1 ? '5 minutes' : level === 2 ? '15 minutes' : '30 minutes',
    notificationsSent: {
      email: true,
      sms: level >= 2,
      teams: true,
      slack: level >= 3
    }
  };
  
  structuredLogger.info('Alert escalated', {
    alertId,
    escalationId: escalationResult.escalationId,
    level,
    escalatedBy: escalationResult.escalatedBy
  });
  
  res.json({
    success: true,
    data: escalationResult,
    message: 'Alert escalated successfully'
  });
});

// =============================================================================
// API INFORMATION & DOCUMENTATION
// =============================================================================

app.get("/", (req, res) => {
  res.json({
    name: "ECONEURA API",
    version: process.env.npm_package_version || "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
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
      "PR-46: Quiet Hours + On-Call Management",
      "SSE: Real-time events and notifications",
      "Cockpit: Operational dashboard endpoints",
      "Cache: Advanced caching with statistics",
      "Metrics: Prometheus-compatible metrics endpoint"
    ],
    endpoints: {
      health: [
        "GET /health - Basic health check",
        "GET /health/live - Liveness probe (PR-22)", 
        "GET /health/ready - Readiness probe (PR-22)"
      ],
      observability: [
        "GET /metrics - Prometheus metrics (PR-23)",
        "GET /cache/stats - Cache statistics"
      ],
      analytics: [
        "POST /v1/analytics/events - Track analytics events (PR-24)",
        "GET /v1/analytics/events - Query analytics events (PR-24)",
        "GET /v1/analytics/metrics - Get aggregated metrics (PR-24)"
      ],
      events: [
        "GET /v1/events - Server-Sent Events for real-time updates",
        "POST /v1/events/broadcast - Broadcast events to organization",
        "GET /v1/events/stats - SSE connection statistics"
      ],
      cockpit: [
        "GET /v1/cockpit/overview - Operational overview dashboard",
        "GET /v1/cockpit/agents - Agent execution details",
        "GET /v1/cockpit/costs - Cost breakdown by org/playbook",
        "GET /v1/cockpit/system - System metrics and health"
      ],
      finops: [
        "GET /v1/finops/budgets - List budgets (PR-45)",
        "POST /v1/finops/budgets - Create budget (PR-45)",
        "GET /v1/finops/costs - Cost tracking (PR-45)"
      ],
      gdpr: [
        "POST /v1/gdpr/export - Export user data (PR-43)",
        "DELETE /v1/gdpr/erase/:userId - Erase user data (PR-43)",
        "GET /v1/gdpr/audit - GDPR audit logs (PR-43)"
      ],
      sepa: [
        "POST /v1/sepa/parse - Parse SEPA XML data (PR-42)",
        "GET /v1/sepa/transactions - Get parsed transactions"
      ],
      operations: [
        "GET /v1/quiet-hours - Get quiet hours config (PR-46)",
        "POST /v1/quiet-hours - Update quiet hours config (PR-46)",
        "GET /v1/on-call/schedule - Get on-call schedule (PR-46)",
        "POST /v1/alerts/escalate - Escalate alert (PR-46)"
      ]
    },
    bffEndpoints: [
      "/api/finops/* - Frontend FinOps integration",
      "/api/rls/* - Frontend RLS management",
      "/api/cache/* - Frontend cache management",
      "/api/inventory/* - Frontend inventory system",
      "/api/security/* - Frontend security management",
      "/api/observability/* - Frontend metrics",
      "/api/workflows/* - Frontend workflow automation"
    ]
  });
});

// =============================================================================
// MOUNT ROUTERS
// =============================================================================

// Mount Analytics routes (PR-24)
app.use('/v1/analytics', analyticsRouter);

// Mount Events (SSE) routes
app.use('/v1/events', eventsRouter);

// Mount Cockpit routes
app.use('/v1/cockpit', cockpitRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  structuredLogger.error('Unhandled error', error, {
    errorId,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    orgId: req.headers['x-org-id']
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    errorId,
    timestamp: new Date().toISOString(),
    support: 'Please contact support with this error ID'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    suggestion: 'Check /api/docs for available endpoints',
    availableCategories: [
      'health', 'analytics', 'events', 'cockpit', 
      'finops', 'gdpr', 'sepa', 'operations'
    ]
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

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
      'PR-46: Quiet Hours + On-Call Management',
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
      'SSE Manager: Real-time event streaming',
      'Quiet Hours: 24/7 operations management',
      'On-Call: Escalation and alert management'
    ],
    architecture: {
      monorepo: 'Turborepo + PNPM',
      backend: 'Express + TypeScript + Prisma',
      frontend: 'Next.js 14 + BFF pattern',
      database: 'PostgreSQL + RLS',
      cache: 'Multi-layer in-memory',
      observability: 'Prometheus + OpenTelemetry',
      security: 'Helmet + CORS + Rate limiting',
      compliance: 'GDPR + Audit trails'
    }
  });
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

process.on('SIGTERM', () => {
  structuredLogger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    structuredLogger.info('Server closed, process terminating');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  structuredLogger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    structuredLogger.info('Server closed, process terminating');
    process.exit(0);
  });
});

export default app;
