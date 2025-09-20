import express from "express";
import cors from "cors";
import helmet from "helmet";
import { structuredLogger } from './lib/structured-logger.js';
import { ErrorHandler } from './lib/error-handler.js';
import { healthModeManager } from './lib/health-modes.js';
import { healthMonitor } from './lib/health-monitor.js';
import { ValidationMiddleware } from './middleware/validation.js';
import { SecurityMiddleware } from './middleware/security.js';
import { RateLimitMiddleware } from './middleware/rate-limiter.js';
import { observabilityMiddleware } from './middleware/observability.js';
import { finOpsMiddleware } from './middleware/finops.js';
import { analyticsRouter } from './routes/analytics.js';
import { eventsRouter } from './routes/events.js';
import { cockpitRouter } from './routes/cockpit.js';
import { companiesRouter } from './routes/companies.js';
import { contactsRouter } from './routes/contacts.js';
import { dealsRouter } from './routes/deals.js';
import { invoicesRouter } from './routes/invoices.js';
import { agentsRouter } from './routes/agents.js';
const app = express();
const PORT = process.env.PORT || 3001;
const errorHandler = new ErrorHandler();
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
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 'X-Correlation-ID'],
    exposedHeaders: ['X-System-Mode', 'X-Est-Cost-EUR', 'X-Budget-Pct', 'X-Latency-ms', 'X-Route']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(observabilityMiddleware);
app.use(finOpsMiddleware);
app.use(RateLimitMiddleware.createMiddleware({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: 'ip'
}));
app.use(ValidationMiddleware.createMiddleware());
app.use(SecurityMiddleware.createMiddleware());
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
app.get("/health/live", async (req, res) => {
    try {
        const result = await healthModeManager.getLivenessProbe();
        const statusCode = result.status === 'ok' ? 200 : 503;
        res.set('X-System-Mode', result.mode);
        res.status(statusCode).json(result);
    }
    catch (error) {
        res.status(503).json({
            status: "error",
            mode: "degraded",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            error: error.message
        });
    }
});
app.get("/health/ready", async (req, res) => {
    try {
        const result = await healthModeManager.getReadinessProbe();
        const statusCode = result.status === 'ok' ? 200 : 503;
        res.set('X-System-Mode', result.mode);
        res.status(statusCode).json(result);
    }
    catch (error) {
        res.status(503).json({
            status: "error",
            mode: "degraded",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            error: error.message
        });
    }
});
app.get("/metrics", async (req, res) => {
    try {
        const metrics = await healthMonitor.getSystemMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get metrics',
            message: error.message
        });
    }
});
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
            "PR-27: Validación Zod integral en routers",
            "PR-28: Security middlewares (Helmet + CORS + CSP)",
            "PR-29: Rate limiting + Budget guard",
            "SSE: Real-time events and notifications",
            "Cockpit: Operational dashboard endpoints",
            "CRM: Companies, Contacts, Deals management",
            "ERP: Invoice processing and management",
            "AI: Agents orchestration and execution"
        ],
        endpoints: [
            "GET /health - Basic health check",
            "GET /health/live - Liveness probe (PR-22)",
            "GET /health/ready - Readiness probe (PR-22)",
            "GET /metrics - Prometheus metrics (PR-23)",
            "POST /v1/analytics/events - Track analytics events (PR-24)",
            "GET /v1/analytics/events - Query analytics events (PR-24)",
            "GET /v1/analytics/metrics - Get aggregated metrics (PR-24)",
            "GET /v1/events - Server-Sent Events for real-time updates",
            "POST /v1/events/broadcast - Broadcast events to organization",
            "GET /v1/cockpit/overview - Operational overview dashboard",
            "GET /v1/cockpit/agents - Agent execution details",
            "GET /v1/cockpit/costs - Cost breakdown by org/playbook",
            "GET /v1/cockpit/system - System metrics and health",
            "GET /v1/companies - List companies (CRM)",
            "POST /v1/companies - Create company (CRM)",
            "GET /v1/contacts - List contacts (CRM)",
            "POST /v1/contacts - Create contact (CRM)",
            "GET /v1/deals - List deals (CRM)",
            "POST /v1/deals - Create deal (CRM)",
            "GET /v1/invoices - List invoices (ERP)",
            "POST /v1/invoices - Create invoice (ERP)",
            "GET /v1/agents - List AI agents",
            "POST /v1/agents/run - Execute AI agent"
        ]
    });
});
app.use('/v1/analytics', analyticsRouter);
app.use('/v1/events', eventsRouter);
app.use('/v1/cockpit', cockpitRouter);
app.use('/v1/companies', companiesRouter);
app.use('/v1/contacts', contactsRouter);
app.use('/v1/deals', dealsRouter);
app.use('/v1/invoices', invoicesRouter);
app.use('/v1/agents', agentsRouter);
app.use(errorHandler.handleError.bind(errorHandler));
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            'GET /health', 'GET /health/live', 'GET /health/ready',
            'GET /v1/analytics/*', 'GET /v1/events', 'GET /v1/cockpit/*',
            'GET /v1/companies', 'GET /v1/contacts', 'GET /v1/deals',
            'GET /v1/invoices', 'GET /v1/agents'
        ]
    });
});
const server = app.listen(PORT, () => {
    structuredLogger.info(`ECONEURA API Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        features: [
            'PR-22: Health modes (live/ready/degraded)',
            'PR-23: Observability coherente (logs + métricas + traces)',
            'PR-24: Analytics events with Zod validation',
            'PR-27: Validación Zod integral en routers',
            'PR-28: Security middlewares (Helmet + CORS + CSP)',
            'PR-29: Rate limiting + Budget guard',
            'SSE: Real-time events and notifications',
            'Cockpit: Operational dashboard endpoints',
            'CRM: Companies, Contacts, Deals management',
            'ERP: Invoice processing and management',
            'AI: Agents orchestration and execution'
        ]
    });
});
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
//# sourceMappingURL=index.expanded.js.map