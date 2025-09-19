import { Router } from 'express';
import { Redis } from 'ioredis';
import { prisma } from '@econeura/db';
import { metrics } from '../lib/metrics.js';
import { logger } from '../lib/logger.js';
import { AzureOpenAIService } from '../services/ai/azure-openai.service.js';
import { asyncHandler } from '../lib/errors.js';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const aiService = new AzureOpenAIService();
const router = Router();
router.get('/live', asyncHandler(async (req, res) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    try {
        metrics.incrementHealthCheck('liveness');
    }
    catch (e) {
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
router.get('/ready', asyncHandler(async (req, res) => {
    const checks = [];
    const startTime = Date.now();
    try {
        await Promise.race([
            prisma.$executeRaw `SELECT 1`,
            new Promise((_, rej) => setTimeout(() => rej(new Error('db timeout')), 2000))
        ]);
        checks.push({
            component: 'database',
            status: 'healthy',
            responseTime: Date.now() - startTime
        });
    }
    catch (err) {
        const error = err;
        logger.error('Database health check failed', { error: error.message, stack: error.stack });
        checks.push({
            component: 'database',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error.message
        });
    }
    try {
        await Promise.race([
            redis.ping(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('redis timeout')), 1000))
        ]);
        checks.push({
            component: 'redis',
            status: 'healthy',
            responseTime: Date.now() - startTime
        });
    }
    catch (err) {
        const error = err;
        logger.error('Redis health check failed', { error: error.message, stack: error.stack });
        checks.push({
            component: 'redis',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error.message
        });
    }
    try {
        if (typeof aiService.checkAvailability === 'function') {
            await Promise.race([
                aiService.checkAvailability(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('ai timeout')), 2000))
            ]);
        }
        else {
        }
        checks.push({
            component: 'azure-openai',
            status: 'healthy',
            responseTime: Date.now() - startTime
        });
    }
    catch (err) {
        const error = err;
        logger.error('Azure OpenAI health check failed', { error: error.message, stack: error.stack });
        checks.push({
            component: 'azure-openai',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: error.message
        });
    }
    const isHealthy = checks.every(check => check.status === 'healthy');
    const totalTime = Date.now() - startTime;
    try {
        metrics.recordHealthCheckDuration('readiness', totalTime);
        metrics.incrementHealthCheck('readiness');
    }
    catch (e) {
    }
    const response = {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
        totalResponseTime: totalTime
    };
    res.status(isHealthy ? 200 : 503).json(response);
}));
router.get('/metrics', async (req, res) => {
    try {
        const metricsData = await metrics.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metricsData);
    }
    catch (error) {
        const err = error;
        logger.error('Error getting metrics', { error: err.message, stack: err.stack });
        res.status(500).send('Error collecting metrics');
    }
});
router.get('/status', async (req, res) => {
    const systemStatus = {
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
        const dbStart = Date.now();
        await prisma.$executeRaw `SELECT 1`;
        systemStatus.database = {
            status: 'ok',
            latency: Date.now() - dbStart
        };
        const redisStart = Date.now();
        await redis.ping();
        systemStatus.redis = {
            status: 'ok',
            latency: Date.now() - redisStart
        };
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
    }
    catch (error) {
        const err = error;
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
//# sourceMappingURL=health.js.map