// ============================================================================
// PERFORMANCE MIDDLEWARE - Middleware para optimización de performance
// ============================================================================

import { Request, Response, NextFunction } from 'express';

import { cacheService } from '../lib/cache.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { getRedisService } from '../lib/redis.service.js';

// ========================================================================
// INTERFACES
// ========================================================================

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit?: boolean;
  cacheKey?: string;
  responseSize?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  keyGenerator: (req: Request) => string;
  shouldCache: (req: Request, res: Response) => boolean;
}

// ========================================================================
// CONFIGURACIÓN DE CACHÉ
// ========================================================================

const cacheConfigs: Record<string, CacheConfig> = {
  // Caché para endpoints de lectura
  'GET:/v1/users': {
    enabled: true,
    ttl: 300, // 5 minutos
    keyGenerator: (req) => `users:${req.params.organizationId}:${JSON.stringify(req.query)}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  'GET:/v1/companies': {
    enabled: true,
    ttl: 300,
    keyGenerator: (req) => `companies:${req.params.organizationId}:${JSON.stringify(req.query)}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  'GET:/v1/contacts': {
    enabled: true,
    ttl: 300,
    keyGenerator: (req) => `contacts:${req.params.organizationId}:${JSON.stringify(req.query)}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  'GET:/v1/products': {
    enabled: true,
    ttl: 600, // 10 minutos
    keyGenerator: (req) => `products:${req.params.organizationId}:${JSON.stringify(req.query)}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  'GET:/v1/analytics': {
    enabled: true,
    ttl: 60, // 1 minuto
    keyGenerator: (req) => `analytics:${req.params.organizationId}:${JSON.stringify(req.query)}`,
    shouldCache: (req, res) => res.statusCode === 200
  }
};

// ========================================================================
// MIDDLEWARE DE PERFORMANCE
// ========================================================================

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const metrics: PerformanceMetrics = {
    requestId,
    method: req.method,
    url: req.url,
    startTime,
    memoryUsage: process.memoryUsage()
  };

  // Agregar requestId al request
  req.requestId = requestId;

  // Interceptar respuesta para métricas
  const originalSend = res.send;
  res.send = function(data: any) {
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.responseSize = Buffer.byteLength(data, 'utf8');
    metrics.memoryUsage = process.memoryUsage();

    // Log de performance
    logPerformanceMetrics(metrics);

    return originalSend.call(this, data);
  };

  next();
};

// ========================================================================
// MIDDLEWARE DE CACHÉ
// ========================================================================

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const cacheKey = `${req.method}:${req.route?.path || req.path}`;
  const config = cacheConfigs[cacheKey];

  if (!config || !config.enabled) {
    return next();
  }

  const cacheKeyValue = config.keyGenerator(req);

  // Intentar obtener del caché
  cacheService.get(cacheKeyValue, { namespace: 'api' })
    .then(cachedData => {
      if (cachedData) {
        // Cache hit
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKeyValue);
        res.json(cachedData);
        return;
      }

      // Cache miss - continuar con el request
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKeyValue);

      // Interceptar respuesta para guardar en caché
      const originalSend = res.send;
      res.send = function(data: any) {
        if (config.shouldCache(req, res)) {
          cacheService.set(cacheKeyValue, data, { 
            namespace: 'api', 
            ttl: config.ttl 
          }).catch(error => {
            structuredLogger.error('Cache set error', error, { cacheKey: cacheKeyValue });
          });
        }
        return originalSend.call(this, data);
      };

      next();
    })
    .catch(error => {
      structuredLogger.error('Cache get error', error, { cacheKey: cacheKeyValue });
      next();
    });
};

// ========================================================================
// MIDDLEWARE DE COMPRESIÓN
// ========================================================================

export const compressionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Verificar si el cliente acepta compresión
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    res.set('Content-Encoding', 'gzip');
  } else if (acceptEncoding.includes('deflate')) {
    res.set('Content-Encoding', 'deflate');
  }

  next();
};

// ========================================================================
// MIDDLEWARE DE RATE LIMITING AVANZADO
// ========================================================================

export const advancedRateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const endpoint = `${req.method}:${req.route?.path || req.path}`;
  const rateLimitKey = `rate_limit:${clientId}:${endpoint}`;

  // Configuración de rate limiting por endpoint
  const rateLimitConfigs: Record<string, { requests: number; window: number }> = {
    'POST:/v1/auth/login': { requests: 5, window: 300 }, // 5 requests per 5 minutes
    'POST:/v1/auth/register': { requests: 3, window: 3600 }, // 3 requests per hour
    'GET:/v1/analytics': { requests: 100, window: 3600 }, // 100 requests per hour
    'default': { requests: 1000, window: 3600 } // 1000 requests per hour
  };

  const config = rateLimitConfigs[endpoint] || rateLimitConfigs.default;

  // Verificar rate limit
  checkRateLimit(rateLimitKey, config.requests, config.window)
    .then(allowed => {
      if (!allowed) {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          retryAfter: config.window
        });
        return;
      }

      // Agregar headers de rate limit
      res.set('X-RateLimit-Limit', config.requests.toString());
      res.set('X-RateLimit-Window', config.window.toString());
      
      next();
    })
    .catch(error => {
      structuredLogger.error('Rate limit check error', error, { rateLimitKey });
      next(); // Continuar en caso de error
    });
};

// ========================================================================
// MIDDLEWARE DE MONITOREO DE RECURSOS
// ========================================================================

export const resourceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startMemory = process.memoryUsage();
  const startCpu = process.cpuUsage();

  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage();

    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    const cpuDelta = {
      user: endCpu.user - startCpu.user,
      system: endCpu.system - startCpu.system
    };

    // Log si el uso de recursos es alto
    if (memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB
      structuredLogger.warn('High memory usage detected', {
        requestId: req.requestId,
        memoryDelta,
        cpuDelta,
        url: req.url,
        method: req.method
      });
    }
  });

  next();
};

// ========================================================================
// FUNCIONES AUXILIARES
// ========================================================================

async function checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
  try {
    const redis = getRedisService();
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    return current <= limit;
  } catch (error) {
    structuredLogger.error('Rate limit check error', error as Error, { key });
    return true; // Permitir en caso de error
  }
}

function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  const logLevel = metrics.duration! > 1000 ? 'warn' : 'info';
  
  structuredLogger[logLevel]('Request performance metrics', {
    requestId: metrics.requestId,
    method: metrics.method,
    url: metrics.url,
    duration: metrics.duration,
    responseSize: metrics.responseSize,
    memoryUsage: metrics.memoryUsage,
    cacheHit: metrics.cacheHit
  });

  // Alertar si la duración es muy alta
  if (metrics.duration! > 5000) { // 5 segundos
    structuredLogger.error('Slow request detected', {
      requestId: metrics.requestId,
      method: metrics.method,
      url: metrics.url,
      duration: metrics.duration
    });
  }
}

// ========================================================================
// MIDDLEWARE DE LIMPIEZA DE CACHÉ
// ========================================================================

export const cacheCleanupMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Interceptar requests de escritura para limpiar caché relacionado
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;
    res.send = function(data: any) {
      // Limpiar caché relacionado después de operaciones de escritura
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const organizationId = req.params.organizationId;
        if (organizationId) {
          // Limpiar caché de la organización
          cacheService.invalidatePattern(`*:${organizationId}:*`, 'api')
            .catch(error => {
              structuredLogger.error('Cache cleanup error', error, { organizationId });
            });
        }
      }
      return originalSend.call(this, data);
    };
  }

  next();
};

