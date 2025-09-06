import { Router } from 'express';
import { getDatabaseService } from '@econeura/db';
import { structuredLogger } from '../lib/structured-logger.js';
import { healthMonitor } from '../lib/health-monitor.js';

const router = Router();

// ============================================================================
// HEALTH CHECK SERVICE
// ============================================================================

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    azureOpenAI?: ServiceHealth;
    externalAPIs?: ServiceHealth;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    requests: {
      total: number;
      errors: number;
      errorRate: number;
    };
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

// GET /health - Comprehensive health check
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const healthStatus = await performHealthCheck();
    const responseTime = Date.now() - startTime;
    
    // Add response time to health status
    healthStatus.metrics.requests = {
      ...healthStatus.metrics.requests,
      responseTime
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
    // Log health check
    structuredLogger.info('Health check completed', {
      status: healthStatus.status,
      responseTime,
      services: Object.keys(healthStatus.services).length
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    structuredLogger.error('Health check failed', error as Error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });
  }
});

// GET /health/live - Liveness probe (Kubernetes)
router.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /health/ready - Readiness probe (Kubernetes)
router.get('/health/ready', async (req, res) => {
  try {
    const db = getDatabaseService();
    const dbHealth = await db.getHealth();
    
    const isReady = dbHealth.status === 'healthy';
    
    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth.status
        }
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth.status
        },
        error: dbHealth.lastError
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /health/degraded - Degraded mode check
router.get('/health/degraded', async (req, res) => {
  try {
    const healthStatus = await performHealthCheck();
    const isDegraded = healthStatus.status === 'degraded';
    
    res.json({
      status: isDegraded ? 'degraded' : 'healthy',
      mode: isDegraded ? 'degraded' : 'normal',
      timestamp: new Date().toISOString(),
      services: healthStatus.services
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /health/metrics - Health metrics for monitoring
router.get('/health/metrics', async (req, res) => {
  try {
    const metrics = await getHealthMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  // Check database
  const dbHealth = await checkDatabaseHealth();
  
  // Check Redis (if available)
  const redisHealth = await checkRedisHealth();
  
  // Check Azure OpenAI (if available)
  const azureHealth = await checkAzureOpenAIHealth();
  
  // Check external APIs
  const externalAPIsHealth = await checkExternalAPIsHealth();
  
  // Get system metrics
  const metrics = await getSystemMetrics();
  
  // Determine overall status
  const services = [dbHealth, redisHealth, azureHealth, externalAPIsHealth];
  const unhealthyServices = services.filter(s => s && s.status === 'unhealthy');
  const degradedServices = services.filter(s => s && s.status === 'degraded');
  
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (unhealthyServices.length > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedServices.length > 0) {
    overallStatus = 'degraded';
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    services: {
      database: dbHealth,
      ...(redisHealth && { redis: redisHealth }),
      ...(azureHealth && { azureOpenAI: azureHealth }),
      ...(externalAPIsHealth && { externalAPIs: externalAPIsHealth })
    },
    metrics
  };
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const db = getDatabaseService();
    const health = await db.getHealth();
    
    return {
      status: health.status,
      responseTime: health.responseTime,
      lastCheck: new Date().toISOString(),
      error: health.lastError
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkRedisHealth(): Promise<ServiceHealth | null> {
  const startTime = Date.now();
  
  try {
    // Check if Redis is configured
    if (!process.env.REDIS_URL) {
      return null;
    }
    
    // TODO: Implement Redis health check
    // const redis = getRedisService();
    // await redis.ping();
    
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAzureOpenAIHealth(): Promise<ServiceHealth | null> {
  const startTime = Date.now();
  
  try {
    // Check if Azure OpenAI is configured
    if (!process.env.AZURE_OPENAI_API_KEY) {
      return null;
    }
    
    // TODO: Implement Azure OpenAI health check
    // const azure = getAzureOpenAIService();
    // await azure.healthCheck();
    
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkExternalAPIsHealth(): Promise<ServiceHealth | null> {
  const startTime = Date.now();
  
  try {
    // Check external APIs (Stripe, etc.)
    // TODO: Implement external APIs health check
    
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal + memUsage.external;
  const usedMem = memUsage.heapUsed;
  
  return {
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100)
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000 // Convert to seconds
    },
    requests: {
      total: 0, // TODO: Get from metrics service
      errors: 0, // TODO: Get from metrics service
      errorRate: 0 // TODO: Calculate error rate
    }
  };
}

async function getHealthMetrics() {
  const db = getDatabaseService();
  const dbStats = db.getPoolStats();
  
  return {
    database: {
      connections: dbStats.totalCount,
      idle: dbStats.idleCount,
      waiting: dbStats.waitingCount,
      isConnected: dbStats.isConnected
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform
    },
    timestamp: new Date().toISOString()
  };
}

export { router as healthRouter };
