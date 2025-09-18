import { z } from 'zod';
export const ServiceHealthSchema = z.object({
    status: z.enum(['healthy', 'unhealthy', 'degraded']),
    responseTime: z.number(),
    lastCheck: z.string().datetime(),
    error: z.string().optional(),
});
export const HealthStatusSchema = z.object({
    status: z.enum(['healthy', 'unhealthy', 'degraded']),
    timestamp: z.string().datetime(),
    version: z.string(),
    uptime: z.number(),
    services: z.record(z.string(), ServiceHealthSchema),
    metrics: z.object({
        memory: z.object({
            used: z.number(),
            total: z.number(),
            percentage: z.number(),
        }),
        cpu: z.object({
            usage: z.number(),
        }),
        requests: z.object({
            total: z.number(),
            errors: z.number(),
            errorRate: z.number(),
            responseTime: z.number().optional(),
        }),
    }),
});
export const HealthCheckResponseSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    version: z.string(),
    timestamp: z.string().datetime(),
    checks: z.array(z.object({
        name: z.string(),
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        message: z.string().optional(),
        duration: z.number().optional(),
        metadata: z.record(z.unknown()).optional(),
    })),
});
export class HealthChecker {
    services = new Map();
    registerService(name, checkFn) {
        this.services.set(name, checkFn);
    }
    async checkService(name) {
        const checkFn = this.services.get(name);
        if (!checkFn) {
            return {
                status: 'unhealthy',
                responseTime: 0,
                lastCheck: new Date().toISOString(),
                error: `Service ${name} not registered`,
            };
        }
        const startTime = Date.now();
        try {
            const result = await checkFn();
            return {
                ...result,
                responseTime: Date.now() - startTime,
                lastCheck: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                lastCheck: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async checkAllServices() {
        const results = {};
        for (const [name] of this.services) {
            results[name] = await this.checkService(name);
        }
        return results;
    }
    getOverallStatus(services) {
        const statuses = Object.values(services).map(s => s.status);
        if (statuses.includes('unhealthy')) {
            return 'unhealthy';
        }
        if (statuses.includes('degraded')) {
            return 'degraded';
        }
        return 'healthy';
    }
}
export async function checkDatabase() {
    try {
        return {
            status: 'healthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Database connection failed',
        };
    }
}
export async function checkRedis() {
    try {
        return {
            status: 'healthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Redis connection failed',
        };
    }
}
export async function checkAzureOpenAI() {
    try {
        return {
            status: 'healthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Azure OpenAI connection failed',
        };
    }
}
export function getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal + memUsage.external;
    const usedMem = memUsage.heapUsed;
    return {
        memory: {
            used: usedMem,
            total: totalMem,
            percentage: Math.round((usedMem / totalMem) * 100),
        },
        cpu: {
            usage: process.cpuUsage().user / 1000000,
        },
        requests: {
            total: 0,
            errors: 0,
            errorRate: 0,
        },
    };
}
export function buildHealthResponse(services, overallStatus, version = '1.0.0') {
    const metrics = getSystemMetrics();
    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version,
        uptime: process.uptime(),
        services,
        metrics,
    };
}
export default {
    HealthChecker,
    checkDatabase,
    checkRedis,
    checkAzureOpenAI,
    getSystemMetrics,
    buildHealthResponse,
    ServiceHealthSchema,
    HealthStatusSchema,
    HealthCheckResponseSchema,
};
//# sourceMappingURL=index.js.map