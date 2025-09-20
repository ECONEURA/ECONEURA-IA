import { cacheService } from '../lib/cache.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { getRedisService } from '../lib/redis.service.js';
const cacheConfigs = {
    'GET:/v1/users': {
        enabled: true,
        ttl: 300,
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
        ttl: 600,
        keyGenerator: (req) => `products:${req.params.organizationId}:${JSON.stringify(req.query)}`,
        shouldCache: (req, res) => res.statusCode === 200
    },
    'GET:/v1/analytics': {
        enabled: true,
        ttl: 60,
        keyGenerator: (req) => `analytics:${req.params.organizationId}:${JSON.stringify(req.query)}`,
        shouldCache: (req, res) => res.statusCode === 200
    }
};
export const performanceMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const metrics = {
        requestId,
        method: req.method,
        url: req.url,
        startTime,
        memoryUsage: process.memoryUsage()
    };
    req.requestId = requestId;
    const originalSend = res.send;
    res.send = function (data) {
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.responseSize = Buffer.byteLength(data, 'utf8');
        metrics.memoryUsage = process.memoryUsage();
        logPerformanceMetrics(metrics);
        return originalSend.call(this, data);
    };
    next();
};
export const cacheMiddleware = (req, res, next) => {
    const cacheKey = `${req.method}:${req.route?.path || req.path}`;
    const config = cacheConfigs[cacheKey];
    if (!config || !config.enabled) {
        return next();
    }
    const cacheKeyValue = config.keyGenerator(req);
    cacheService.get(cacheKeyValue, { namespace: 'api' })
        .then(cachedData => {
        if (cachedData) {
            res.set('X-Cache', 'HIT');
            res.set('X-Cache-Key', cacheKeyValue);
            res.json(cachedData);
            return;
        }
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKeyValue);
        const originalSend = res.send;
        res.send = function (data) {
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
export const compressionMiddleware = (req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
        res.set('Content-Encoding', 'gzip');
    }
    else if (acceptEncoding.includes('deflate')) {
        res.set('Content-Encoding', 'deflate');
    }
    next();
};
export const advancedRateLimitMiddleware = (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    const rateLimitKey = `rate_limit:${clientId}:${endpoint}`;
    const rateLimitConfigs = {
        'POST:/v1/auth/login': { requests: 5, window: 300 },
        'POST:/v1/auth/register': { requests: 3, window: 3600 },
        'GET:/v1/analytics': { requests: 100, window: 3600 },
        'default': { requests: 1000, window: 3600 }
    };
    const config = rateLimitConfigs[endpoint] || rateLimitConfigs.default;
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
        res.set('X-RateLimit-Limit', config.requests.toString());
        res.set('X-RateLimit-Window', config.window.toString());
        next();
    })
        .catch(error => {
        structuredLogger.error('Rate limit check error', error, { rateLimitKey });
        next();
    });
};
export const resourceMonitoringMiddleware = (req, res, next) => {
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
        if (memoryDelta.heapUsed > 10 * 1024 * 1024) {
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
async function checkRateLimit(key, limit, window) {
    try {
        const redis = getRedisService();
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, window);
        }
        return current <= limit;
    }
    catch (error) {
        structuredLogger.error('Rate limit check error', error, { key });
        return true;
    }
}
function logPerformanceMetrics(metrics) {
    const logLevel = metrics.duration > 1000 ? 'warn' : 'info';
    structuredLogger[logLevel]('Request performance metrics', {
        requestId: metrics.requestId,
        method: metrics.method,
        url: metrics.url,
        duration: metrics.duration,
        responseSize: metrics.responseSize,
        memoryUsage: metrics.memoryUsage,
        cacheHit: metrics.cacheHit
    });
    if (metrics.duration > 5000) {
        structuredLogger.error('Slow request detected', {
            requestId: metrics.requestId,
            method: metrics.method,
            url: metrics.url,
            duration: metrics.duration
        });
    }
}
export const cacheCleanupMiddleware = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const originalSend = res.send;
        res.send = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const organizationId = req.params.organizationId;
                if (organizationId) {
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
//# sourceMappingURL=performance.middleware.js.map