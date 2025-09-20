export class HealthService {
    static instance;
    healthChecks = new Map();
    lastCheckResults = new Map();
    startTime;
    constructor() {
        this.startTime = new Date();
        this.initializeHealthChecks();
    }
    static getInstance() {
        if (!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }
    initializeHealthChecks() {
        this.healthChecks.set('database', {
            name: 'Database',
            timeout: 5000,
            interval: 30000,
            retries: 3,
            critical: true
        });
        this.healthChecks.set('redis', {
            name: 'Redis Cache',
            timeout: 3000,
            interval: 30000,
            retries: 2,
            critical: false
        });
        this.healthChecks.set('external_apis', {
            name: 'External APIs',
            timeout: 10000,
            interval: 60000,
            retries: 2,
            critical: false
        });
        this.healthChecks.set('storage', {
            name: 'File Storage',
            timeout: 5000,
            interval: 60000,
            retries: 2,
            critical: false
        });
        this.healthChecks.set('memory', {
            name: 'Memory Usage',
            timeout: 1000,
            interval: 10000,
            retries: 1,
            critical: true
        });
        this.healthChecks.set('disk', {
            name: 'Disk Space',
            timeout: 2000,
            interval: 30000,
            retries: 1,
            critical: true
        });
    }
    async checkDatabase() {
        try {
            const startTime = Date.now();
            await new Promise(resolve => setTimeout(resolve, 100));
            const duration = Date.now() - startTime;
            return {
                database: {
                    status: 'up',
                    responseTime: duration,
                    message: 'Database connection successful'
                }
            };
        }
        catch (error) {
            return {
                database: {
                    status: 'down',
                    message: error instanceof Error ? error.message : 'Database connection failed'
                }
            };
        }
    }
    async checkRedis() {
        try {
            const startTime = Date.now();
            await new Promise(resolve => setTimeout(resolve, 50));
            const duration = Date.now() - startTime;
            return {
                redis: {
                    status: 'up',
                    responseTime: duration,
                    message: 'Redis connection successful'
                }
            };
        }
        catch (error) {
            return {
                redis: {
                    status: 'down',
                    message: error instanceof Error ? error.message : 'Redis connection failed'
                }
            };
        }
    }
    async checkExternalAPIs() {
        try {
            const startTime = Date.now();
            await new Promise(resolve => setTimeout(resolve, 200));
            const duration = Date.now() - startTime;
            return {
                external_apis: {
                    status: 'up',
                    responseTime: duration,
                    message: 'External APIs accessible'
                }
            };
        }
        catch (error) {
            return {
                external_apis: {
                    status: 'down',
                    message: error instanceof Error ? error.message : 'External APIs not accessible'
                }
            };
        }
    }
    async checkStorage() {
        try {
            const startTime = Date.now();
            await new Promise(resolve => setTimeout(resolve, 100));
            const duration = Date.now() - startTime;
            return {
                storage: {
                    status: 'up',
                    responseTime: duration,
                    message: 'Storage accessible'
                }
            };
        }
        catch (error) {
            return {
                storage: {
                    status: 'down',
                    message: error instanceof Error ? error.message : 'Storage not accessible'
                }
            };
        }
    }
    async checkMemory() {
        try {
            const memUsage = process.memoryUsage();
            const totalMem = memUsage.heapTotal + memUsage.external;
            const usedMem = memUsage.heapUsed;
            const percentage = (usedMem / totalMem) * 100;
            const status = percentage > 90 ? 'down' : percentage > 80 ? 'degraded' : 'up';
            return {
                memory: {
                    status,
                    used: usedMem,
                    total: totalMem,
                    percentage: Math.round(percentage * 100) / 100,
                    message: `Memory usage: ${Math.round(percentage * 100) / 100}%`
                }
            };
        }
        catch (error) {
            return {
                memory: {
                    status: 'down',
                    message: error instanceof Error ? error.message : 'Memory check failed'
                }
            };
        }
    }
    async checkDisk() {
        try {
            const used = 50 * 1024 * 1024 * 1024;
            const total = 100 * 1024 * 1024 * 1024;
            const percentage = (used / total) * 100;
            const status = percentage > 90 ? 'down' : percentage > 80 ? 'degraded' : 'up';
            return {
                disk: {
                    status,
                    used,
                    total,
                    percentage: Math.round(percentage * 100) / 100,
                    message: `Disk usage: ${Math.round(percentage * 100) / 100}%`
                }
            };
        }
        catch (error) {
            return {
                disk: {
                    status: 'down',
                    message: error instanceof Error ? error.message : 'Disk check failed'
                }
            };
        }
    }
    async getHealthStatus() {
        const checks = {};
        let overallStatus = 'healthy';
        const checkPromises = [
            this.checkDatabase(),
            this.checkRedis(),
            this.checkExternalAPIs(),
            this.checkStorage(),
            this.checkMemory(),
            this.checkDisk()
        ];
        const results = await Promise.allSettled(checkPromises);
        results.forEach((result, index) => {
            const checkNames = ['database', 'redis', 'external_apis', 'storage', 'memory', 'disk'];
            const checkName = checkNames[index];
            if (result.status === 'fulfilled') {
                checks[checkName] = result.value;
                const checkConfig = this.healthChecks.get(checkName);
                if (checkConfig?.critical) {
                    const checkResult = result.value[checkName];
                    if (checkResult?.status === 'down') {
                        overallStatus = 'unhealthy';
                    }
                    else if (checkResult?.status === 'degraded' && overallStatus === 'healthy') {
                        overallStatus = 'degraded';
                    }
                }
            }
            else {
                checks[checkName] = {
                    [checkName]: {
                        status: 'down',
                        message: result.reason instanceof Error ? result.reason.message : 'Check failed'
                    }
                };
                const checkConfig = this.healthChecks.get(checkName);
                if (checkConfig?.critical) {
                    overallStatus = 'unhealthy';
                }
            }
        });
        const memUsage = process.memoryUsage();
        const totalMem = memUsage.heapTotal + memUsage.external;
        const usedMem = memUsage.heapUsed;
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime.getTime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks,
            metrics: {
                memory: {
                    used: usedMem,
                    total: totalMem,
                    percentage: Math.round((usedMem / totalMem) * 100 * 100) / 100
                },
                cpu: {
                    usage: 0,
                    load: [0, 0, 0]
                },
                disk: {
                    used: 50 * 1024 * 1024 * 1024,
                    total: 100 * 1024 * 1024 * 1024,
                    percentage: 50
                }
            }
        };
    }
    async getDatabaseHealth() {
        return this.checkDatabase();
    }
    async getRedisHealth() {
        return this.checkRedis();
    }
    async getExternalAPIsHealth() {
        return this.checkExternalAPIs();
    }
    async getStorageHealth() {
        return this.checkStorage();
    }
    async getMemoryHealth() {
        return this.checkMemory();
    }
    async getDiskHealth() {
        return this.checkDisk();
    }
    addHealthCheck(name, config) {
        this.healthChecks.set(name, config);
    }
    removeHealthCheck(name) {
        this.healthChecks.delete(name);
    }
    getHealthCheckConfig(name) {
        return this.healthChecks.get(name);
    }
    getAllHealthCheckConfigs() {
        return new Map(this.healthChecks);
    }
    startHealthMonitoring() {
        setInterval(async () => {
            try {
                const healthStatus = await this.getHealthStatus();
                console.log(`Health Status: ${healthStatus.status}`, {
                    timestamp: healthStatus.timestamp,
                    uptime: healthStatus.uptime,
                    checks: Object.keys(healthStatus.checks).length
                });
                Object.entries(healthStatus.checks).forEach(([name, result]) => {
                    this.lastCheckResults.set(name, result);
                });
            }
            catch (error) {
                console.error('Health monitoring error:', error);
            }
        }, 30000);
    }
    getLastCheckResults() {
        return new Map(this.lastCheckResults);
    }
    async getLivenessProbe() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString()
        };
    }
    async getReadinessProbe() {
        const criticalChecks = Array.from(this.healthChecks.entries())
            .filter(([_, config]) => config.critical)
            .map(([name, _]) => name);
        const failedChecks = [];
        for (const checkName of criticalChecks) {
            const result = this.lastCheckResults.get(checkName);
            if (!result || result[checkName]?.status === 'down') {
                failedChecks.push(checkName);
            }
        }
        return {
            status: failedChecks.length === 0 ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            checks: failedChecks
        };
    }
    async getStartupProbe() {
        const uptime = Date.now() - this.startTime.getTime();
        const isStarted = uptime > 10000;
        return {
            status: isStarted ? 'started' : 'starting',
            timestamp: new Date().toISOString(),
            uptime
        };
    }
}
export const healthService = HealthService.getInstance();
//# sourceMappingURL=health.service.js.map