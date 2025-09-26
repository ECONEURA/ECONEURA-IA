import { performanceOptimizer } from '../lib/performance-optimizer.js';
import { logger } from '../lib/logger.js';

import { prometheus } from './observability.js';
export function responseOptimizerMiddleware(req, res, next) {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    res.json = function (data) {
        const responseTime = Date.now() - startTime;
        if (responseTime > 100) {
            optimizeResponse(data, res, req)
                .then(({ optimizedData, headers }) => {
                Object.entries(headers).forEach(([key, value]) => {
                    res.set(key, value);
                });
                originalJson(optimizedData);
                prometheus.responseOptimizations.inc();
                prometheus.responseOptimizationTime.observe(responseTime / 1000);
                logger.debug('Response optimized', {
                    path: req.path,
                    method: req.method,
                    originalSize: JSON.stringify(data).length,
                    optimizedSize: JSON.stringify(optimizedData).length,
                    responseTime,
                    optimizationRatio: (JSON.stringify(optimizedData).length / JSON.stringify(data).length * 100).toFixed(2) + '%'
                });
            })
                .catch((error) => {
                logger.error('Response optimization failed', {
                    path: req.path,
                    method: req.method,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                originalJson(data);
            });
        }
        else {
            originalJson(data);
        }
    };
    res.send = function (data) {
        const responseTime = Date.now() - startTime;
        if (typeof data === 'string' && data.length > 1024) {
            optimizeTextResponse(data, res, req)
                .then((optimizedData) => {
                originalSend(optimizedData);
                prometheus.textResponseOptimizations.inc();
                logger.debug('Text response optimized', {
                    path: req.path,
                    method: req.method,
                    originalSize: data.length,
                    optimizedSize: optimizedData.length,
                    responseTime
                });
            })
                .catch((error) => {
                logger.error('Text response optimization failed', {
                    path: req.path,
                    method: req.method,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                originalSend(data);
            });
        }
        else {
            originalSend(data);
        }
    };
    next();
}
async function optimizeResponse(data, res, req) {
    const startTime = Date.now();
    try {
        const contentType = res.get('Content-Type') || 'application/json';
        if (Array.isArray(data) && data.length > 100) {
            return optimizeLargeArray(data, req);
        }
        else if (typeof data === 'object' && data !== null) {
            return optimizeLargeObject(data, req);
        }
        else {
            return await performanceOptimizer.optimizeResponse(data, contentType);
        }
    }
    catch (error) {
        logger.error('Response optimization error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
            method: req.method
        });
        return {
            optimizedData: data,
            headers: { 'Content-Type': 'application/json' }
        };
    }
}
function optimizeLargeArray(data, req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);
    const startIndex = (page - 1) * actualLimit;
    const endIndex = startIndex + actualLimit;
    const paginatedData = data.slice(startIndex, endIndex);
    const optimizedData = {
        data: paginatedData,
        pagination: {
            page,
            limit: actualLimit,
            total: data.length,
            totalPages: Math.ceil(data.length / actualLimit),
            hasNext: endIndex < data.length,
            hasPrev: page > 1
        }
    };
    return {
        optimizedData,
        headers: {
            'Content-Type': 'application/json',
            'X-Pagination-Page': page.toString(),
            'X-Pagination-Limit': actualLimit.toString(),
            'X-Pagination-Total': data.length.toString(),
            'X-Pagination-Total-Pages': Math.ceil(data.length / actualLimit).toString()
        }
    };
}
function optimizeLargeObject(data, req) {
    if (req.path.includes('/list') || req.path.includes('/search')) {
        const optimizedData = removeUnnecessaryFields(data);
        return {
            optimizedData,
            headers: {
                'Content-Type': 'application/json',
                'X-Optimized': 'true',
                'X-Fields-Removed': 'unnecessary'
            }
        };
    }
    const optimizedData = optimizeNestedObjects(data);
    return {
        optimizedData,
        headers: {
            'Content-Type': 'application/json',
            'X-Optimized': 'true'
        }
    };
}
function removeUnnecessaryFields(data) {
    if (Array.isArray(data)) {
        return data.map(item => removeUnnecessaryFields(item));
    }
    if (typeof data === 'object' && data !== null) {
        const optimized = {};
        for (const [key, value] of Object.entries(data)) {
            if (['createdAt', 'updatedAt', 'deletedAt', 'metadata', 'internalNotes'].includes(key)) {
                continue;
            }
            optimized[key] = removeUnnecessaryFields(value);
        }
        return optimized;
    }
    return data;
}
function optimizeNestedObjects(data) {
    if (Array.isArray(data)) {
        return data.map(item => optimizeNestedObjects(item));
    }
    if (typeof data === 'object' && data !== null) {
        const optimized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value) && value.length > 10) {
                    optimized[key] = value.slice(0, 10);
                }
                else {
                    optimized[key] = optimizeNestedObjects(value);
                }
            }
            else {
                optimized[key] = value;
            }
        }
        return optimized;
    }
    return data;
}
async function optimizeTextResponse(data, res, req) {
    return data
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
}
export function performanceHeadersMiddleware(req, res, next) {
    const startTime = Date.now();
    res.set('X-Response-Time', '0ms');
    res.set('X-Cache-Status', 'MISS');
    res.set('X-Optimization-Enabled', 'true');
    const originalEnd = res.end.bind(res);
    res.end = function (chunk, encoding) {
        const responseTime = Date.now() - startTime;
        res.set('X-Response-Time', `${responseTime}ms`);
        prometheus.responseTime.observe(responseTime / 1000);
        originalEnd(chunk, encoding);
    };
    next();
}
export function compressionMiddleware(req, res, next) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
        res.set('Content-Encoding', 'gzip');
        res.set('Vary', 'Accept-Encoding');
    }
    next();
}
export const responseOptimizationMetrics = {
    responseOptimizations: new prometheus.Counter({
        name: 'econeura_response_optimizations_total',
        help: 'Total number of response optimizations',
        labelNames: ['path', 'method']
    }),
    responseOptimizationTime: new prometheus.Histogram({
        name: 'econeura_response_optimization_time_seconds',
        help: 'Response optimization time in seconds',
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
    }),
    textResponseOptimizations: new prometheus.Counter({
        name: 'econeura_text_response_optimizations_total',
        help: 'Total number of text response optimizations',
        labelNames: ['path', 'method']
    }),
    responseTime: new prometheus.Histogram({
        name: 'econeura_response_time_seconds',
        help: 'Response time in seconds',
        labelNames: ['path', 'method', 'status_code'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    })
};
//# sourceMappingURL=response-optimizer.js.map