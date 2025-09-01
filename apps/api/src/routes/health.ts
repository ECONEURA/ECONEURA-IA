import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { MetricsService } from '../lib/metrics';
import { logger } from '../lib/logger';
import { AzureOpenAIService } from '../services/ai/azure-openai.service';
import { asyncHandler } from '../lib/errors';

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

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const metrics = new MetricsService();
const aiService = new AzureOpenAIService();

const router = Router();

// Health check básico (Liveness)
router.get('/live', asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  metrics.incrementHealthCheck('liveness');
  
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
router.get('/ready', asyncHandler(async (req, res) => {
  const checks: HealthCheckResult[] = [];
  const startTime = Date.now();
  
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
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
    await redis.ping();
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
    await aiService.checkAvailability();
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
  
  metrics.recordHealthCheckDuration('readiness', totalTime);
  metrics.incrementHealthCheck('readiness');
  
  const response = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    totalResponseTime: totalTime
  };

  res.status(isHealthy ? 200 : 503).json(response);
}));

// Métricas Prometheus
router.get('/metrics', async (req, res) => {
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
router.get('/status', async (req, res) => {
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
    await prisma.$queryRaw`SELECT 1`;
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
