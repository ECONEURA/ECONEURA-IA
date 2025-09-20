import { metrics } from './metrics.js';
import { logger } from './logger.js';
export class ObservabilityService {
    constructor() { }
    requestObservability() {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = req.headers['x-request-id'] || this.generateRequestId();
            const orgId = req.headers['x-org-id'];
            try {
                res.setHeader('x-request-id', requestId);
            }
            catch { }
            const requestLogger = req.logger || logger;
            try {
                if (requestLogger && typeof requestLogger.info === 'function')
                    requestLogger.info('Request started');
            }
            catch { }
            res.on?.('finish', () => {
                const duration = Date.now() - startTime;
                try {
                    const m = metrics;
                    m.recordHttpRequest?.(req.path || req.url || '/', req.method || 'GET', res.statusCode || 0, duration);
                }
                catch { }
                if (res.locals?.aiMetrics) {
                    try {
                        const m = metrics;
                        m.recordAIRequest?.(res.locals.aiMetrics);
                    }
                    catch { }
                }
                try {
                    if (requestLogger && typeof requestLogger.info === 'function') {
                        requestLogger.info('Request completed', {
                            statusCode: res.statusCode,
                            duration,
                            contentLength: res.getHeader?.('content-length'),
                            aiMetrics: res.locals?.aiMetrics
                        });
                    }
                }
                catch { }
            });
            req.logger = req.logger || requestLogger;
            next();
        };
    }
    degradationCheck() {
        return async (req, res, next) => {
            try {
                const health = await this.checkSystemHealth();
                if (health.isDegraded) {
                    try {
                        res.setHeader('x-system-degraded', 'true');
                    }
                    catch { }
                    try {
                        res.setHeader('x-degradation-reason', health.reason || 'unknown');
                    }
                    catch { }
                    logger.warn?.('System degraded', {
                        ...health,
                        reason: health.reason || undefined
                    });
                }
                next();
            }
            catch (error) {
                next(error);
            }
        };
    }
    async checkSystemHealth() {
        const checks = {
            memory: this.checkMemoryUsage(),
            cpu: this.checkCPUUsage(),
            errorRate: await this.checkErrorRate(),
            aiQuota: await this.checkAIQuota()
        };
        const isDegraded = Object.values(checks).some(check => !check.healthy);
        const reason = Object.entries(checks)
            .filter(([, check]) => !check.healthy)
            .map(([name]) => name)
            .join(', ');
        return {
            isDegraded,
            reason: isDegraded ? reason : null,
            checks
        };
    }
    checkMemoryUsage() {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        const limit = 512;
        return {
            healthy: used < limit,
            value: Math.round(used),
            limit
        };
    }
    checkCPUUsage() {
        const usage = process.cpuUsage();
        const total = usage.user + usage.system;
        const limit = 90;
        return {
            healthy: total < limit,
            value: Math.round(total),
            limit
        };
    }
    async checkErrorRate() {
        const getErrorRate = metrics.getErrorRate;
        const errorRate = typeof getErrorRate === 'function' ? await getErrorRate() : 0;
        const limit = 5;
        return {
            healthy: errorRate < limit,
            value: errorRate,
            limit
        };
    }
    async checkAIQuota() {
        const getAIQuotaStatus = metrics.getAIQuotaStatus;
        const quota = typeof getAIQuotaStatus === 'function' ? await getAIQuotaStatus() : { percentageUsed: 0 };
        const limit = 90;
        return {
            healthy: quota.percentageUsed < limit,
            value: quota.percentageUsed,
            limit
        };
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=observability.js.map