import express from "express";
import cors from "cors";
import { structuredLogger } from './lib/structured-logger.js';

// Import health modes (PR-22)
import { healthModeManager } from './lib/health-modes.js';

// Import routers for working PRs
import { analyticsRouter } from './routes/analytics.js';
import { eventsRouter } from './routes/events.js';
import { cockpitRouter } from './routes/cockpit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 'X-Correlation-ID']
}));

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

// Basic API info endpoint
app.get("/", (req, res) => {
  res.json({
    name: "ECONEURA API",
    version: process.env.npm_package_version || "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: [
      "GET /health - Basic health check",
      "GET /health/live - Liveness probe (PR-22)", 
      "GET /health/ready - Readiness probe (PR-22)",
      "POST /v1/analytics/events - Track analytics events (PR-24)",
      "GET /v1/analytics/events - Query analytics events (PR-24)",
      "GET /v1/analytics/metrics - Get aggregated metrics (PR-24)",
      "GET /v1/events - Server-Sent Events for real-time updates",
      "POST /v1/events/broadcast - Broadcast events to organization",
      "GET /v1/cockpit/overview - Operational overview dashboard",
      "GET /v1/cockpit/agents - Agent execution details",
      "GET /v1/cockpit/costs - Cost breakdown by org/playbook",
      "GET /v1/cockpit/system - System metrics and health"
    ]
  });
});

// Mount Analytics routes (PR-24)
app.use('/v1/analytics', analyticsRouter);

// Mount Events (SSE) routes
app.use('/v1/events', eventsRouter);

// Mount Cockpit routes
app.use('/v1/cockpit', cockpitRouter);

// Basic error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  structuredLogger.error('Unhandled error', error, {
    path: req.path,
    method: req.method,
    headers: req.headers
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
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
      'PR-24: Analytics events with Zod validation', 
      'SSE: Real-time events and notifications',
      'Cockpit: Operational dashboard endpoints'
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
