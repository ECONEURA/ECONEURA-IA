import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rawBody from 'raw-body';
import { metricsRegister } from '@econeura/shared/metrics';
import { logger } from '@econeura/shared/logging';
import { SECURITY_HEADERS } from '@econeura/shared/security';

// Middlewares
import { requestId } from './mw/requestId.js';
import { verifyHmac } from './mw/verifyHmac.js';
import { idempotency } from './mw/idempotency.js';
import { rateLimitOrg } from './mw/rateLimitOrg.js';
import { requireAuth, optionalAuth } from './mw/auth.js';
import { problemJson, notFoundHandler, asyncHandler, ApiError } from './mw/problemJson.js';

// Routes (will be implemented)
import { healthRoutes } from './routes/health.js';
import { flowRoutes } from './routes/flows.js';
import { webhookRoutes } from './routes/webhooks.js';
import { providerRoutes } from './routes/providers.js';
import { channelRoutes } from './routes/channels.js';
import { adminRoutes } from './routes/admin.js';

const app = express();

// Trust proxy for accurate IP addresses in production
app.set('trust proxy', true);

// Remove X-Powered-By header for security
app.disable('x-powered-by');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}));

// Additional security headers
app.use((req, res, next) => {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

// CORS configuration (lista blanca estricta)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // clientes nativos
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.logSecurityEvent('CORS violation', {
      event_type: 'auth_failure',
      details: { origin, allowed_origins: allowedOrigins },
    });
    callback(new ApiError(403, 'cors_violation', 'CORS Violation', `Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type','Authorization','x-org-id','x-request-id','traceparent',
    'x-idempotency-key','x-timestamp','x-signature'
  ],
  exposedHeaders: ['x-request-id','traceparent','x-idempotent-replay',
    'x-ratelimit-limit','x-ratelimit-remaining','x-ratelimit-reset'],
}));

// Request ID and tracing
app.use(requestId);

// Raw body parser (solo para /api/webhooks/*)
app.use('/api/webhooks', (req, res, next) => {
  rawBody(req, {
    length: req.get('Content-Length'),
    limit: '10mb',
    encoding: 'utf8',
  }, (err, string) => {
    if (err) {
      logger.error('Raw body parsing failed', err, {
        corr_id: res.locals.corr_id,
        path: (req as any).path,
      });
      return next(new ApiError(400, 'invalid_body', 'Invalid Request Body', 'Failed to parse request body'));
    }
    
    (req as any).rawBody = string;
    next();
  });
});

// JSON body parser for non-webhook routes
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for specific routes that need it
    if (req.path.startsWith('/api/webhooks')) {
      (req as any).rawBody = buf.toString('utf8');
    }
  },
}));

// URL-encoded parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.logAPIRequest('Request received', {
    method: req.method,
    path: req.path,
    status_code: 0, // Will be updated in response
    latency_ms: 0, // Will be updated in response
    org_id: req.header('x-org-id'),
    x_request_id: res.locals.corr_id,
    user_agent: req.get('user-agent'),
  });
  
  // Capture response logging
  const originalSend = res.send;
  res.send = function(body) {
    const latency = Date.now() - startTime;
    
    logger.logAPIRequest('Request completed', {
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      latency_ms: latency,
      org_id: req.header('x-org-id'),
      x_request_id: res.locals.corr_id,
      user_agent: req.get('user-agent'),
    });
    
    return originalSend.call(this, body);
  };
  
  next();
});

// Rate limiting (applied to all routes except health and metrics)
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/metrics') {
    return next();
  }
  return rateLimitOrg()(req, res, next);
});

// Idempotency middleware (for mutation operations)
app.use(idempotency({
  ttlHours: 24,
  skipRoutes: ['/health', '/metrics', '/api/webhooks'],
}));

// Import AI routes
import aiRoutes from './routes/ai.js';

// Routes
app.use('/', healthRoutes);
app.use('/api/flows', requireAuth, flowRoutes);

// Webhooks por fuente + verificación HMAC antes del router
// Stripe: el verifyHmac internamente usa stripe.webhooks.constructEvent(req.rawBody, sig, secret)
app.post('/api/webhooks/stripe', verifyHmac('stripe'), webhookRoutes);
app.post('/api/webhooks/github', verifyHmac('github'), webhookRoutes);
app.post('/api/webhooks/slack', verifyHmac('slack'), webhookRoutes);

app.use('/api/providers', requireAuth, providerRoutes);
app.use('/api/channels', requireAuth, channelRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/ai', requireAuth, aiRoutes); // AI Router endpoints

// Metrics endpoint (Prometheus)
app.get('/metrics', asyncHandler(async (req, res) => {
  res.set('Content-Type', metricsRegister.contentType);
  const metrics = await metricsRegister.metrics();
  res.send(metrics);
}));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(problemJson);

// Graceful shutdown handler
const server = app.listen(process.env.PORT || 5001, () => {
  const port = (server.address() as any)?.port || process.env.PORT || 5001;
  logger.info(`EcoNeura API server started on port ${port}`, {
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    import('./db/connection.js').then(({ db }) => {
      return db.close();
    }).then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error during shutdown', error);
      process.exit(1);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
export { server };