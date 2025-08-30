import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import basicAuth from "express-basic-auth";
import { ai } from "./routes/ai.js";
import { search } from "./routes/search.js";
import { health } from "./routes/health.js";
import { dashboard } from "./routes/dashboard.js";
import { registry } from "./lib/observe.js";
import { logger } from "./lib/logger.js";
import { analytics } from "./lib/analytics.js";
import { alertSystem } from "./lib/alerts.js";
import { smartCache } from "./lib/smart-cache.js";
import { securityMiddleware } from "./middleware/security.js";
import { smartRateLimit, aiRateLimit } from "./middleware/smart-rate-limit.js";

const app = express();

// Middleware de seguridad
app.use(securityMiddleware.corsMiddleware);
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.requestSizeLimit);
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.securityLogging);

// Rate limiting inteligente
app.use(smartRateLimit);

// Body parser
app.use(bodyParser.json({ limit: "2mb" }));

// Health checks
app.use("/health", health);

// Métricas protegidas
app.get("/metrics", basicAuth({ 
  users: { admin: process.env.METRICS_PWD || "metrics" }, 
  challenge: true 
}), async (_req, res) => {
  res.setHeader("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

// Dashboard de métricas
app.use("/dashboard", dashboard);

// Rutas de IA con rate limiting específico
app.use("/v1/ai", aiRateLimit, ai);
app.use("/v1/search", search);

// Middleware de logging de requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const org = req.headers['x-org-id'] as string || 'demo-org';
    
    logger.info(`${req.method} ${req.path}`, {
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      org,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Track analytics
    if (req.path.startsWith('/v1/ai')) {
      analytics.trackEvent('api_request', org, {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration
      });
    }
  });

  next();
});

// Error handling global
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler', {
    endpoint: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  const org = req.headers['x-org-id'] as string || 'demo-org';
  analytics.trackError(org, error.message, req.path);

  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Limpieza periódica
setInterval(() => {
  analytics.cleanup();
  smartCache.cleanup();
}, 60 * 60 * 1000); // Cada hora

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 API server started on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
  
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/dashboard`);
});