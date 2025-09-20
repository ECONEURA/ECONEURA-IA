import { Router, type Router as ExpressRouter, type Request, type Response } from 'express';
import { Redis } from 'ioredis';
import { prisma } from '@econeura/db';
import { metrics } from '../lib/metrics.js';
import { logger } from '../lib/logger.js';
import { AzureOpenAIService } from '../services/ai/azure-openai.service.js';
import { asyncHandler } from '../lib/errors.js';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
}

interface SystemStatusResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  checks: HealthCheckResult[];
  totalResponseTime: number;
}

interface SystemStatus {
  api: {
    status: 'ok' | 'degraded' | 'error' | 'unknown';
    version?: string | undefined;
  };
  database: {
    status: 'ok' | 'unknown' | 'error';
    latency: number | null;
  };
  redis: {
    status: 'ok' | 'unknown' | 'error';
    latency: number | null;
  };
  aiService: {
    status: 'ok' | 'warning' | 'unknown';
    quotaRemaining: number | null;
  };
}

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const aiService = new AzureOpenAIService();

const router: ExpressRouter = Router();

// Health check básico (Liveness)
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  try {
    metrics.incrementHealthCheck('liveness');
  } catch (e) {
    // no-op: metrics may be a no-op in some environments
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    }
  });
}));

// Readiness check completo
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const checks: HealthCheckResult[] = [];
  const startTime = Date.now();

  try {
    // Database check
    // Use shared prisma instance; protect with timeout via Promise.race
    await Promise.race([
      prisma.$executeRaw`SELECT 1`,
      new Promise((_, rej) => setTimeout(() => rej(new Error('db timeout')), 2000))
    ]);
    checks.push({
      component: 'database',
      status: 'healthy',
      responseTime: Date.now() - startTime
    });
  } catch (err) {
  const error = err as Error;
  logger.error('Database health check failed', { error: error.message, stack: error.stack });
    checks.push({
      component: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    });
  }

  try {
    // Redis check
    await Promise.race([
      redis.ping(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('redis timeout')), 1000))
    ]);
    checks.push({
      component: 'redis',
      status: 'healthy',
      responseTime: Date.now() - startTime
    });
  } catch (err) {
  const error = err as Error;
  logger.error('Redis health check failed', { error: error.message, stack: error.stack });
    checks.push({
      component: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    });
  }

  try {
    // Azure OpenAI check
    // aiService may use external SDKs; guard with timeout
    if (typeof aiService.checkAvailability === 'function') {
      await Promise.race([
        aiService.checkAvailability(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('ai timeout')), 2000))
      ]);
    } else {
      // best-effort: assume healthy if not implemented
    }
    checks.push({
      component: 'azure-openai',
      status: 'healthy',
      responseTime: Date.now() - startTime
    });
  } catch (err) {
  const error = err as Error;
  logger.error('Azure OpenAI health check failed', { error: error.message, stack: error.stack });
    checks.push({
      component: 'azure-openai',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    });
  }

  // Calcular estado general
  const isHealthy = checks.every(check => check.status === 'healthy');
  const totalTime = Date.now() - startTime;

  try {
    metrics.recordHealthCheckDuration('readiness', totalTime);
    metrics.incrementHealthCheck('readiness');
  } catch (e) {
    // ignore metrics errors
  }

  const response = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    totalResponseTime: totalTime
  };

  res.status(isHealthy ? 200 : 503).json(response);
}));

// Métricas Prometheus
router.get('/metrics', async (req: Request, res: Response) => {
  try {
  const metricsData = await metrics.getMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metricsData);
  } catch (error) {
  const err = error as Error;
  logger.error('Error getting metrics', { error: err.message, stack: err.stack });
  res.status(500).send('Error collecting metrics');
  }
});

// Estado del sistema
router.get('/status', async (req: Request, res: Response) => {
  const systemStatus: SystemStatus = {
    api: {
      status: 'ok',
      version: process.env.npm_package_version
    },
    database: {
      status: 'unknown',
      latency: null
    },
    redis: {
      status: 'unknown',
      latency: null
    },
    aiService: {
      status: 'unknown',
      quotaRemaining: null
    }
  };

  try {
    // Check DB con latencia
    const dbStart = Date.now();
  await prisma.$executeRaw`SELECT 1`;
    systemStatus.database = {
      status: 'ok',
      latency: Date.now() - dbStart
    };

    // Check Redis con latencia
    const redisStart = Date.now();
    await redis.ping();
    systemStatus.redis = {
      status: 'ok',
      latency: Date.now() - redisStart
    };

    // Check servicio AI
    const aiQuota = await redis.get('ai:quota:remaining');
    systemStatus.aiService = {
      status: aiQuota ? 'ok' : 'warning',
      quotaRemaining: aiQuota ? parseInt(aiQuota, 10) : 0
    };

    res.json({
      status: 'ok',
      components: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
  const err = error as Error;
  logger.error('Status check failed', { error: err.message, stack: err.stack });

    res.status(500).json({
      status: 'error',
      components: systemStatus,
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

export default router;
