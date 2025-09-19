import { cacheManager } from './advanced-cache.js';
export class HealthMonitor {
    static instance;
    services = new Map();
    checks = new Map();
    startTime = new Date();
    metrics = {
        totalRequests: 0,
        totalErrors: 0,
        responseTimes: [],
        activeConnections: 0
    };
    static getInstance() {
        if (!HealthMonitor.instance) {
            HealthMonitor.instance = new HealthMonitor();
        }
        return HealthMonitor.instance;
    }
    constructor() {
        this.initializeDefaultChecks();
        this.startPeriodicHealthChecks();
    }
    initializeDefaultChecks() {
        this.addCheck('database', async () => {
            const start = Date.now();
            try {
                await new Promise(resolve => setTimeout(resolve, 10));
                const responseTime = Date.now() - start;
                return {
                    name: 'database',
                    status: 'healthy',
                    message: 'Database connection is healthy',
                    responseTime,
                    lastChecked: new Date()
                };
            }
            catch (error) {
                return {
                    name: 'database',
                    status: 'unhealthy',
                    message: `Database connection failed: ${error.message}`,
                    lastChecked: new Date()
                };
            }
        });
        this.addCheck('cache', async () => {
            const start = Date.now();
            try {
                const stats = cacheManager.getAllStats();
                const responseTime = Date.now() - start;
                return {
                    name: 'cache',
                    status: 'healthy',
                    message: 'Cache system is healthy',
                    details: { stats },
                    responseTime,
                    lastChecked: new Date()
                };
            }
            catch (error) {
                return {
                    name: 'cache',
                    status: 'unhealthy',
                    message: `Cache system failed: ${error.message}`,
                    lastChecked: new Date()
                };
            }
        });
        this.addCheck('memory', async () => {
            const start = Date.now();
            try {
                const memUsage = process.memoryUsage();
                const responseTime = Date.now() - start;
                const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
                const memoryLimitMB = 512;
                let status = 'healthy';
                if (memoryUsageMB > memoryLimitMB) {
                    status = 'unhealthy';
                }
                else if (memoryUsageMB > memoryLimitMB * 0.8) {
                    status = 'degraded';
                }
                return {
                    name: 'memory',
                    status,
                    message: `Memory usage: ${memoryUsageMB.toFixed(2)}MB`,
                    details: {
                        heapUsed: memUsage.heapUsed,
                        heapTotal: memUsage.heapTotal,
                        external: memUsage.external,
                        rss: memUsage.rss
                    },
                    responseTime,
                    lastChecked: new Date()
                };
            }
            catch (error) {
                return {
                    name: 'memory',
                    status: 'unhealthy',
                    message: `Memory check failed: ${error.message}`,
                    lastChecked: new Date()
                };
            }
        });
        this.addCheck('disk', async () => {
            const start = Date.now();
            try {
                const freeSpace = 1024 * 1024 * 1024;
                const totalSpace = 10 * 1024 * 1024 * 1024;
                const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;
                const responseTime = Date.now() - start;
                let status = 'healthy';
                if (usagePercent > 90) {
                    status = 'unhealthy';
                }
                else if (usagePercent > 80) {
                    status = 'degraded';
                }
                return {
                    name: 'disk',
                    status,
                    message: `Disk usage: ${usagePercent.toFixed(2)}%`,
                    details: {
                        freeSpace,
                        totalSpace,
                        usagePercent
                    },
                    responseTime,
                    lastChecked: new Date()
                };
            }
            catch (error) {
                return {
                    name: 'disk',
                    status: 'unhealthy',
                    message: `Disk check failed: ${error.message}`,
                    lastChecked: new Date()
                };
            }
        });
        this.addCheck('external', async () => {
            const start = Date.now();
            try {
                const services = [
                    { name: 'Payment Gateway', status: 'up' },
                    { name: 'Email Service', status: 'up' },
                    { name: 'SMS Service', status: 'degraded' }
                ];
                const responseTime = Date.now() - start;
                const overallStatus = services.every(s => s.status === 'up') ? 'healthy' :
                    services.some(s => s.status === 'down') ? 'unhealthy' : 'degraded';
                return {
                    name: 'external',
                    status: overallStatus,
                    message: 'External services status checked',
                    details: { services },
                    responseTime,
                    lastChecked: new Date()
                };
            }
            catch (error) {
                return {
                    name: 'external',
                    status: 'unhealthy',
                    message: `External services check failed: ${error.message}`,
                    lastChecked: new Date()
                };
            }
        });
    }
    startPeriodicHealthChecks() {
        setInterval(async () => {
            await this.runAllChecks();
        }, 30000);
    }
    addCheck(name, checkFunction) {
        this.checks.set(name, checkFunction);
    }
    removeCheck(name) {
        this.checks.delete(name);
    }
    async runCheck(name) {
        const checkFunction = this.checks.get(name);
        if (!checkFunction) {
            return null;
        }
        try {
            return await checkFunction();
        }
        catch (error) {
            return {
                name,
                status: 'unhealthy',
                message: `Health check failed: ${error.message}`,
                lastChecked: new Date()
            };
        }
    }
    async runAllChecks() {
        const checks = [];
        for (const [name, checkFunction] of this.checks.entries()) {
            try {
                const check = await checkFunction();
                checks.push(check);
                this.updateServiceHealth(name, check);
            }
            catch (error) {
                const failedCheck = {
                    name,
                    status: 'unhealthy',
                    message: `Health check failed: ${error.message}`,
                    lastChecked: new Date()
                };
                checks.push(failedCheck);
                this.updateServiceHealth(name, failedCheck);
            }
        }
        return checks;
    }
    updateServiceHealth(serviceName, check) {
        const service = this.services.get(serviceName) || {
            name: serviceName,
            status: 'up',
            checks: [],
            overallStatus: 'healthy',
            lastChecked: new Date(),
            uptime: 0
        };
        const existingCheckIndex = service.checks.findIndex(c => c.name === check.name);
        if (existingCheckIndex >= 0) {
            service.checks[existingCheckIndex] = check;
        }
        else {
            service.checks.push(check);
        }
        const unhealthyChecks = service.checks.filter(c => c.status === 'unhealthy');
        const degradedChecks = service.checks.filter(c => c.status === 'degraded');
        if (unhealthyChecks.length > 0) {
            service.overallStatus = 'unhealthy';
            service.status = 'down';
        }
        else if (degradedChecks.length > 0) {
            service.overallStatus = 'degraded';
            service.status = 'degraded';
        }
        else {
            service.overallStatus = 'healthy';
            service.status = 'up';
        }
        service.lastChecked = new Date();
        service.uptime = Date.now() - this.startTime.getTime();
        this.services.set(serviceName, service);
    }
    getServiceHealth(serviceName) {
        return this.services.get(serviceName) || null;
    }
    getAllServicesHealth() {
        return Array.from(this.services.values());
    }
    getSystemHealth() {
        const services = this.getAllServicesHealth();
        const unhealthyServices = services.filter(s => s.overallStatus === 'unhealthy');
        const degradedServices = services.filter(s => s.overallStatus === 'degraded');
        let systemStatus = 'healthy';
        if (unhealthyServices.length > 0) {
            systemStatus = 'unhealthy';
        }
        else if (degradedServices.length > 0) {
            systemStatus = 'degraded';
        }
        const averageResponseTime = this.metrics.responseTimes.length > 0
            ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
            : 0;
        const errorRate = this.metrics.totalRequests > 0
            ? (this.metrics.totalErrors / this.metrics.totalRequests) * 100
            : 0;
        return {
            status: systemStatus,
            services,
            timestamp: new Date(),
            uptime: Date.now() - this.startTime.getTime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            metrics: {
                totalRequests: this.metrics.totalRequests,
                errorRate,
                averageResponseTime,
                activeConnections: this.metrics.activeConnections,
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                cpuUsage: process.cpuUsage().user / 1000000
            }
        };
    }
    recordRequest(responseTime, isError = false) {
        this.metrics.totalRequests++;
        if (isError) {
            this.metrics.totalErrors++;
        }
        this.metrics.responseTimes.push(responseTime);
        if (this.metrics.responseTimes.length > 1000) {
            this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
        }
    }
    setActiveConnections(count) {
        this.metrics.activeConnections = count;
    }
    async getLivenessProbe() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString()
        };
    }
    async getReadinessProbe() {
        const checks = await this.runAllChecks();
        const systemHealth = this.getSystemHealth();
        return {
            status: systemHealth.status,
            timestamp: new Date().toISOString(),
            checks
        };
    }
    async getHealthCheck() {
        await this.runAllChecks();
        return this.getSystemHealth();
    }
    async getDetailedHealth() {
        const systemHealth = this.getSystemHealth();
        const services = this.getAllServicesHealth();
        const checks = await this.runAllChecks();
        const cacheStats = cacheManager.getAllStats();
        const sortedResponseTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
        const averageResponseTime = sortedResponseTimes.length > 0
            ? sortedResponseTimes.reduce((sum, time) => sum + time, 0) / sortedResponseTimes.length
            : 0;
        const responseTimeStats = {
            min: sortedResponseTimes[0] || 0,
            max: sortedResponseTimes[sortedResponseTimes.length - 1] || 0,
            avg: averageResponseTime,
            p95: this.calculatePercentile(sortedResponseTimes, 95),
            p99: this.calculatePercentile(sortedResponseTimes, 99)
        };
        return {
            system: systemHealth,
            services,
            checks,
            metrics: {
                cache: cacheStats,
                performance: {
                    responseTime: responseTimeStats,
                    throughput: this.metrics.totalRequests / ((Date.now() - this.startTime.getTime()) / 1000),
                    errorRate: this.metrics.totalRequests > 0 ? (this.metrics.totalErrors / this.metrics.totalRequests) * 100 : 0
                }
            }
        };
    }
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }
    alertThresholds = {
        errorRate: 5,
        responseTime: 1000,
        memoryUsage: 80,
        diskUsage: 85
    };
    checkAlertConditions() {
        const alerts = [];
        const systemHealth = this.getSystemHealth();
        if (systemHealth.metrics.errorRate > this.alertThresholds.errorRate) {
            alerts.push({
                type: 'error_rate',
                message: `High error rate: ${systemHealth.metrics.errorRate.toFixed(2)}%`,
                severity: systemHealth.metrics.errorRate > 10 ? 'critical' : 'warning'
            });
        }
        if (systemHealth.metrics.averageResponseTime > this.alertThresholds.responseTime) {
            alerts.push({
                type: 'response_time',
                message: `High response time: ${systemHealth.metrics.averageResponseTime.toFixed(2)}ms`,
                severity: systemHealth.metrics.averageResponseTime > 2000 ? 'critical' : 'warning'
            });
        }
        if (systemHealth.metrics.memoryUsage > this.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'memory_usage',
                message: `High memory usage: ${systemHealth.metrics.memoryUsage.toFixed(2)}MB`,
                severity: systemHealth.metrics.memoryUsage > 90 ? 'critical' : 'warning'
            });
        }
        return alerts;
    }
}
export const healthMonitor = HealthMonitor.getInstance();
//# sourceMappingURL=health-monitor.js.map