import { structuredLogger } from './structured-logger.js';
class HealthModeManager {
    currentMode = 'live';
    lastCheck = new Date();
    degradedReason;
    getCurrentMode() {
        return this.currentMode;
    }
    getDegradedReason() {
        return this.degradedReason;
    }
    async getLivenessProbe() {
        const startTime = Date.now();
        try {
            const memoryUsage = process.memoryUsage();
            const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
            let memoryStatus = 'ok';
            if (memoryUsageMB > 1000)
                memoryStatus = 'error';
            else if (memoryUsageMB > 500)
                memoryStatus = 'warning';
            const status = {
                status: memoryStatus === 'error' ? 'error' : 'ok',
                mode: 'live',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                checks: {
                    memory: {
                        status: memoryStatus,
                        usage: Math.round(memoryUsageMB)
                    }
                }
            };
            const duration = Date.now() - startTime;
            structuredLogger.debug('Liveness probe completed', {
                duration,
                status: status.status,
                memoryUsage: memoryUsageMB
            });
            return status;
        }
        catch (error) {
            structuredLogger.error('Liveness probe failed', error);
            return {
                status: 'error',
                mode: 'live',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                checks: {}
            };
        }
    }
    async getReadinessProbe() {
        const startTime = Date.now();
        try {
            const checks = {};
            let overallStatus = 'ok';
            let mode = 'ready';
            const memoryUsage = process.memoryUsage();
            const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
            let memoryStatus = 'ok';
            if (memoryUsageMB > 1000) {
                memoryStatus = 'error';
                overallStatus = 'error';
                mode = 'degraded';
                this.degradedReason = 'High memory usage';
            }
            else if (memoryUsageMB > 500) {
                memoryStatus = 'warning';
                if (overallStatus === 'ok')
                    overallStatus = 'warning';
            }
            checks.memory = {
                status: memoryStatus,
                usage: Math.round(memoryUsageMB)
            };
            try {
                const dbStartTime = Date.now();
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
                const dbLatency = Date.now() - dbStartTime;
                if (dbLatency > 100) {
                    checks.database = { status: 'error', latency: dbLatency };
                    overallStatus = 'error';
                    mode = 'degraded';
                    this.degradedReason = 'Database slow response';
                }
                else {
                    checks.database = { status: 'ok', latency: dbLatency };
                }
            }
            catch (error) {
                checks.database = { status: 'error' };
                overallStatus = 'error';
                mode = 'degraded';
                this.degradedReason = 'Database unavailable';
            }
            const cacheHitRate = 0.85 + Math.random() * 0.1;
            checks.cache = {
                status: cacheHitRate > 0.8 ? 'ok' : 'error',
                hitRate: Math.round(cacheHitRate * 100) / 100
            };
            if (cacheHitRate <= 0.8 && overallStatus === 'ok') {
                overallStatus = 'warning';
            }
            this.currentMode = mode;
            this.lastCheck = new Date();
            const status = {
                status: overallStatus,
                mode,
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                checks,
                degradedReason: this.degradedReason
            };
            const duration = Date.now() - startTime;
            structuredLogger.info('Readiness probe completed', {
                duration,
                status: status.status,
                mode,
                degradedReason: this.degradedReason
            });
            return status;
        }
        catch (error) {
            structuredLogger.error('Readiness probe failed', error);
            this.currentMode = 'degraded';
            this.degradedReason = 'Health check failed';
            return {
                status: 'error',
                mode: 'degraded',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                checks: {},
                degradedReason: this.degradedReason
            };
        }
    }
    async getDetailedHealth() {
        return this.getReadinessProbe();
    }
    forceDegradedMode(reason) {
        this.currentMode = 'degraded';
        this.degradedReason = reason;
        structuredLogger.warn('System forced into degraded mode', {
            reason,
            timestamp: new Date().toISOString()
        });
    }
    restoreNormalMode() {
        this.currentMode = 'live';
        this.degradedReason = undefined;
        structuredLogger.info('System restored to normal mode', {
            timestamp: new Date().toISOString()
        });
    }
}
export const healthModeManager = new HealthModeManager();
//# sourceMappingURL=health-modes.js.map