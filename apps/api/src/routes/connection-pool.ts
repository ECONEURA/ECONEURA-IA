/**
 * PR-50: Connection Pool Routes
 * 
 * Endpoints para gestionar pools de conexiones
 * y monitorear métricas de conexiones en tiempo real.
 */

import { Router } from 'express';
import { z } from 'zod';
import { connectionPoolService } from '../lib/connection-pool.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const PoolConfigSchema = z.object({
  enabled: z.boolean().optional(),
  maxConnections: z.number().min(1).max(100).optional(),
  minConnections: z.number().min(0).max(50).optional(),
  idleTimeout: z.number().min(10000).max(1800000).optional(), // 10s - 30min
  connectionTimeout: z.number().min(1000).max(60000).optional(), // 1s - 1min
  acquireTimeout: z.number().min(1000).max(30000).optional(), // 1s - 30s
  healthCheckInterval: z.number().min(5000).max(300000).optional(), // 5s - 5min
  retryAttempts: z.number().min(1).max(10).optional(),
  retryDelay: z.number().min(100).max(10000).optional(), // 100ms - 10s
  circuitBreakerThreshold: z.number().min(1).max(50).optional(),
  circuitBreakerTimeout: z.number().min(10000).max(600000).optional(), // 10s - 10min
  loadBalancingStrategy: z.enum(['round-robin', 'least-connections', 'weighted']).optional(),
});

const CreatePoolSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['postgres', 'redis', 'http', 'external']),
  config: PoolConfigSchema
});

/**
 * GET /connection-pool/stats
 * Obtiene estadísticas de todos los pools de conexiones
 */
router.get('/stats', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const stats = connectionPoolService.getStats();
    const poolsData = Array.from(stats.entries()).map(([name, pool]) => ({
      name: pool.name,
      type: pool.type,
      config: pool.config,
      metrics: pool.metrics,
      healthStatus: pool.healthStatus,
      lastHealthCheck: pool.lastHealthCheck,
      circuitBreakerStatus: pool.circuitBreakerStatus,
      connectionsCount: pool.connections.length,
      healthyConnections: pool.connections.filter(c => c.healthStatus === 'healthy').length
    }));

    // Estadísticas globales
    const globalStats = {
      totalPools: poolsData.length,
      healthyPools: poolsData.filter(p => p.healthStatus === 'healthy').length,
      degradedPools: poolsData.filter(p => p.healthStatus === 'degraded').length,
      criticalPools: poolsData.filter(p => p.healthStatus === 'critical').length,
      totalConnections: poolsData.reduce((sum, p) => sum + p.connectionsCount, 0),
      totalActiveConnections: poolsData.reduce((sum, p) => sum + p.metrics.active, 0),
      totalIdleConnections: poolsData.reduce((sum, p) => sum + p.metrics.idle, 0),
      openCircuitBreakers: poolsData.filter(p => p.circuitBreakerStatus === 'open').length
    };

    structuredLogger.info('Connection pool stats requested', {
      traceId,
      spanId,
      globalStats
    });

    res.json({
      success: true,
      data: {
        pools: poolsData,
        globalStats,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get connection pool stats', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get connection pool stats',
      traceId
    });
  }
});

/**
 * GET /connection-pool/:poolName/stats
 * Obtiene estadísticas de un pool específico
 */
router.get('/:poolName/stats', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { poolName } = req.params;

  try {
    const poolStats = connectionPoolService.getPoolStats(poolName);
    
    if (!poolStats) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
        poolName,
        traceId
      });
    }

    // Análisis detallado del pool
    const analysis = {
      utilization: {
        total: poolStats.metrics.total,
        active: poolStats.metrics.active,
        idle: poolStats.metrics.idle,
        waiting: poolStats.metrics.waiting,
        utilizationRate: poolStats.metrics.total > 0 ? 
          (poolStats.metrics.active / poolStats.metrics.total) * 100 : 0
      },
      performance: {
        avgAcquireTime: poolStats.metrics.avgAcquireTime,
        avgResponseTime: poolStats.metrics.avgResponseTime,
        healthCheckPassRate: poolStats.metrics.healthCheckPassed + poolStats.metrics.healthCheckFailed > 0 ?
          (poolStats.metrics.healthCheckPassed / (poolStats.metrics.healthCheckPassed + poolStats.metrics.healthCheckFailed)) * 100 : 100
      },
      reliability: {
        created: poolStats.metrics.created,
        destroyed: poolStats.metrics.destroyed,
        failed: poolStats.metrics.failed,
        failureRate: poolStats.metrics.created > 0 ? 
          (poolStats.metrics.failed / poolStats.metrics.created) * 100 : 0,
        circuitBreakerStatus: poolStats.circuitBreakerStatus
      },
      connections: {
        total: poolStats.connections.length,
        healthy: poolStats.connections.filter(c => c.healthStatus === 'healthy').length,
        unhealthy: poolStats.connections.filter(c => c.healthStatus === 'unhealthy').length,
        active: poolStats.connections.filter(c => c.status === 'active').length,
        idle: poolStats.connections.filter(c => c.status === 'idle').length,
        failed: poolStats.connections.filter(c => c.status === 'failed').length
      }
    };

    structuredLogger.info('Pool stats requested', {
      traceId,
      spanId,
      poolName,
      analysis
    });

    res.json({
      success: true,
      data: {
        pool: poolStats,
        analysis,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get pool stats', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      poolName
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get pool stats',
      poolName,
      traceId
    });
  }
});

/**
 * POST /connection-pool/create
 * Crea un nuevo pool de conexiones
 */
router.post('/create', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { name, type, config } = CreatePoolSchema.parse(req.body);
    
    // Verificar si el pool ya existe
    const existingPool = connectionPoolService.getPoolStats(name);
    if (existingPool) {
      return res.status(409).json({
        success: false,
        error: 'Pool already exists',
        poolName: name,
        traceId
      });
    }

    structuredLogger.info('Creating new connection pool', {
      traceId,
      spanId,
      name,
      type,
      config
    });

    connectionPoolService.createPool(name, type, config);
    
    const newPoolStats = connectionPoolService.getPoolStats(name);

    structuredLogger.info('Connection pool created successfully', {
      traceId,
      spanId,
      name,
      type
    });

    res.status(201).json({
      success: true,
      data: {
        pool: newPoolStats,
        message: 'Pool created successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pool configuration',
        details: error.errors,
        traceId
      });
    }

    structuredLogger.error('Failed to create connection pool', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create connection pool',
      traceId
    });
  }
});

/**
 * PUT /connection-pool/:poolName/config
 * Actualiza la configuración de un pool
 */
router.put('/:poolName/config', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { poolName } = req.params;

  try {
    const configData = PoolConfigSchema.parse(req.body);
    
    // Verificar si el pool existe
    const existingPool = connectionPoolService.getPoolStats(poolName);
    if (!existingPool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
        poolName,
        traceId
      });
    }

    structuredLogger.info('Updating pool configuration', {
      traceId,
      spanId,
      poolName,
      config: configData
    });

    connectionPoolService.updatePoolConfig(poolName, configData);
    
    const updatedPoolStats = connectionPoolService.getPoolStats(poolName);

    structuredLogger.info('Pool configuration updated successfully', {
      traceId,
      spanId,
      poolName
    });

    res.json({
      success: true,
      data: {
        pool: updatedPoolStats,
        message: 'Pool configuration updated successfully',
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data',
        details: error.errors,
        poolName,
        traceId
      });
    }

    structuredLogger.error('Failed to update pool configuration', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      poolName
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update pool configuration',
      poolName,
      traceId
    });
  }
});

/**
 * POST /connection-pool/:poolName/acquire
 * Adquiere una conexión del pool
 */
router.post('/:poolName/acquire', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { poolName } = req.params;
  const { timeout } = req.body;

  try {
    structuredLogger.info('Acquiring connection from pool', {
      traceId,
      spanId,
      poolName,
      timeout
    });

    const connection = await connectionPoolService.acquireConnection(poolName, timeout);
    
    if (!connection) {
      return res.status(503).json({
        success: false,
        error: 'No connection available',
        poolName,
        traceId
      });
    }

    structuredLogger.info('Connection acquired successfully', {
      traceId,
      spanId,
      poolName,
      connectionId: connection.id
    });

    res.json({
      success: true,
      data: {
        connection: {
          id: connection.id,
          type: connection.type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          status: connection.status,
          healthStatus: connection.healthStatus,
          responseTime: connection.responseTime,
          metadata: connection.metadata
        },
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to acquire connection', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      poolName
    });

    res.status(500).json({
      success: false,
      error: 'Failed to acquire connection',
      poolName,
      traceId
    });
  }
});

/**
 * POST /connection-pool/:poolName/release
 * Libera una conexión al pool
 */
router.post('/:poolName/release', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { poolName } = req.params;
  const { connectionId } = req.body;

  try {
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required',
        poolName,
        traceId
      });
    }

    structuredLogger.info('Releasing connection to pool', {
      traceId,
      spanId,
      poolName,
      connectionId
    });

    await connectionPoolService.releaseConnection(poolName, connectionId);

    structuredLogger.info('Connection released successfully', {
      traceId,
      spanId,
      poolName,
      connectionId
    });

    res.json({
      success: true,
      data: {
        message: 'Connection released successfully',
        poolName,
        connectionId,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to release connection', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      poolName,
      connectionId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to release connection',
      poolName,
      connectionId,
      traceId
    });
  }
});

/**
 * GET /connection-pool/:poolName/connections
 * Obtiene información detallada de las conexiones de un pool
 */
router.get('/:poolName/connections', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { poolName } = req.params;
  const { status, health, limit = 50 } = req.query;

  try {
    const poolStats = connectionPoolService.getPoolStats(poolName);
    
    if (!poolStats) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
        poolName,
        traceId
      });
    }

    let connections = poolStats.connections;

    // Filtrar por estado
    if (status && typeof status === 'string') {
      connections = connections.filter(c => c.status === status);
    }

    // Filtrar por salud
    if (health && typeof health === 'string') {
      connections = connections.filter(c => c.healthStatus === health);
    }

    // Limitar resultados
    const limitNum = parseInt(limit as string, 10);
    connections = connections.slice(0, limitNum);

    // Estadísticas de conexiones
    const connectionStats = {
      total: poolStats.connections.length,
      byStatus: poolStats.connections.reduce((acc, conn) => {
        acc[conn.status] = (acc[conn.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byHealth: poolStats.connections.reduce((acc, conn) => {
        acc[conn.healthStatus] = (acc[conn.healthStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgResponseTime: poolStats.connections.length > 0 ? 
        poolStats.connections.reduce((sum, conn) => sum + conn.responseTime, 0) / poolStats.connections.length : 0,
      totalErrors: poolStats.connections.reduce((sum, conn) => sum + conn.errorCount, 0),
      oldestConnection: poolStats.connections.length > 0 ? 
        Math.min(...poolStats.connections.map(c => c.createdAt)) : 0,
      newestConnection: poolStats.connections.length > 0 ? 
        Math.max(...poolStats.connections.map(c => c.createdAt)) : 0
    };

    structuredLogger.info('Pool connections requested', {
      traceId,
      spanId,
      poolName,
      filters: { status, health, limit },
      connectionStats
    });

    res.json({
      success: true,
      data: {
        connections: connections.map(conn => ({
          id: conn.id,
          type: conn.type,
          host: conn.host,
          port: conn.port,
          database: conn.database,
          status: conn.status,
          healthStatus: conn.healthStatus,
          createdAt: conn.createdAt,
          lastUsed: conn.lastUsed,
          responseTime: conn.responseTime,
          errorCount: conn.errorCount,
          metadata: conn.metadata
        })),
        stats: connectionStats,
        filters: { status, health, limit },
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get pool connections', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      poolName
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get pool connections',
      poolName,
      traceId
    });
  }
});

/**
 * GET /connection-pool/:poolName/health
 * Health check específico para un pool
 */
router.get('/:poolName/health', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
  const { poolName } = req.params;

  try {
    const poolStats = connectionPoolService.getPoolStats(poolName);
    
    if (!poolStats) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
        poolName,
        traceId
      });
    }

    // Evaluar salud del pool
    const healthChecks = {
      hasConnections: poolStats.connections.length > 0,
      hasHealthyConnections: poolStats.connections.some(c => c.healthStatus === 'healthy'),
      circuitBreakerClosed: poolStats.circuitBreakerStatus === 'closed',
      recentHealthCheck: Date.now() - poolStats.lastHealthCheck < 60000, // Último health check hace menos de 1 minuto
      hasActiveConnections: poolStats.metrics.active > 0,
      lowFailureRate: poolStats.metrics.created > 0 ? 
        (poolStats.metrics.failed / poolStats.metrics.created) < 0.1 : true
    };

    const isHealthy = Object.values(healthChecks).every(check => check);
    const healthStatus = isHealthy ? 'healthy' : 'degraded';

    structuredLogger.info('Pool health check', {
      traceId,
      spanId,
      poolName,
      healthStatus,
      healthChecks
    });

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: {
        poolName,
        status: healthStatus,
        checks: healthChecks,
        metrics: poolStats.metrics,
        circuitBreakerStatus: poolStats.circuitBreakerStatus,
        lastHealthCheck: poolStats.lastHealthCheck,
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Pool health check failed', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId,
      poolName
    });

    res.status(500).json({
      success: false,
      error: 'Pool health check failed',
      poolName,
      traceId
    });
  }
});

/**
 * GET /connection-pool/health
 * Health check global de todos los pools
 */
router.get('/health', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const stats = connectionPoolService.getStats();
    const pools = Array.from(stats.values());
    
    // Evaluar salud global
    const healthChecks = {
      hasPools: pools.length > 0,
      hasHealthyPools: pools.some(p => p.healthStatus === 'healthy'),
      noCriticalPools: !pools.some(p => p.healthStatus === 'critical'),
      noOpenCircuitBreakers: !pools.some(p => p.circuitBreakerStatus === 'open'),
      hasActiveConnections: pools.some(p => p.metrics.active > 0),
      recentHealthChecks: pools.every(p => Date.now() - p.lastHealthCheck < 120000) // Último health check hace menos de 2 minutos
    };

    const isHealthy = Object.values(healthChecks).every(check => check);
    const healthStatus = isHealthy ? 'healthy' : 'degraded';

    // Resumen de pools
    const poolsSummary = pools.map(pool => ({
      name: pool.name,
      type: pool.type,
      healthStatus: pool.healthStatus,
      circuitBreakerStatus: pool.circuitBreakerStatus,
      connectionsCount: pool.connections.length,
      activeConnections: pool.metrics.active,
      lastHealthCheck: pool.lastHealthCheck
    }));

    structuredLogger.info('Global connection pool health check', {
      traceId,
      spanId,
      healthStatus,
      healthChecks,
      poolsCount: pools.length
    });

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: healthStatus,
        checks: healthChecks,
        pools: poolsSummary,
        summary: {
          totalPools: pools.length,
          healthyPools: pools.filter(p => p.healthStatus === 'healthy').length,
          degradedPools: pools.filter(p => p.healthStatus === 'degraded').length,
          criticalPools: pools.filter(p => p.healthStatus === 'critical').length,
          totalConnections: pools.reduce((sum, p) => sum + p.connections.length, 0),
          totalActiveConnections: pools.reduce((sum, p) => sum + p.metrics.active, 0)
        },
        timestamp: new Date().toISOString(),
        traceId
      }
    });

  } catch (error) {
    structuredLogger.error('Global connection pool health check failed', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      spanId
    });

    res.status(500).json({
      success: false,
      error: 'Global connection pool health check failed',
      traceId
    });
  }
});

export default router;
