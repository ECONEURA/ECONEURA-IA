import { structuredLogger } from '../structured-logger.js';
import { getDatabaseService } from '../database.service.js';
import { getRedisService } from '../redis.service.js';
import { monitoringService } from '../monitoring.service.js';
export class SystemHealthService {
    healthData = null;
    monitoringInterval = null;
    isMonitoring = false;
    constructor() {
        this.startHealthMonitoring();
    }
    async getOverallHealth() {
        try {
            const services = await this.checkAllServices();
            const metrics = await this.collectSystemMetrics();
            const alerts = await this.getActiveAlerts();
            const uptime = process.uptime();
            const overallStatus = this.calculateOverallStatus(services, alerts);
            this.healthData = {
                overallStatus,
                timestamp: new Date(),
                uptime,
                services,
                metrics,
                alerts,
                lastUpdate: new Date()
            };
            return this.healthData;
        }
        catch (error) {
            structuredLogger.error('Error getting overall health', error);
            throw error;
        }
    }
    async checkServiceHealth(serviceName) {
        try {
            const startTime = Date.now();
            let status = 'up';
            const errorRate = 0;
            const throughput = 0;
            let details = {};
            switch (serviceName) {
                case 'database':
                    const dbStatus = await this.checkDatabaseHealth();
                    status = dbStatus.status;
                    details = dbStatus.details;
                    break;
                case 'redis':
                    const redisStatus = await this.checkRedisHealth();
                    status = redisStatus.status;
                    details = redisStatus.details;
                    break;
                case 'api':
                    const apiStatus = await this.checkAPIHealth();
                    status = apiStatus.status;
                    details = apiStatus.details;
                    break;
                case 'monitoring':
                    const monitoringStatus = await this.checkMonitoringHealth();
                    status = monitoringStatus.status;
                    details = monitoringStatus.details;
                    break;
                default:
                    status = 'down';
                    details = { error: 'Unknown service' };
            }
            const responseTime = Date.now() - startTime;
            return {
                name: serviceName,
                status,
                responseTime,
                lastCheck: new Date(),
                errorRate,
                throughput,
                details
            };
        }
        catch (error) {
            structuredLogger.error(`Error checking service health: ${serviceName}`, error);
            return {
                name: serviceName,
                status: 'down',
                responseTime: 0,
                lastCheck: new Date(),
                errorRate: 100,
                throughput: 0,
                details: { error: error.message }
            };
        }
    }
    async getSystemMetrics() {
        try {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            const uptime = process.uptime();
            const dbMetrics = await this.getDatabaseMetrics();
            const cacheMetrics = await this.getCacheMetrics();
            return {
                memory: {
                    used: memoryUsage.heapUsed,
                    total: memoryUsage.heapTotal,
                    percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
                },
                cpu: {
                    usage: this.calculateCPUUsage(cpuUsage),
                    loadAverage: this.getLoadAverage()
                },
                disk: {
                    used: 0,
                    total: 0,
                    percentage: 0
                },
                network: {
                    bytesIn: 0,
                    bytesOut: 0
                },
                database: dbMetrics,
                cache: cacheMetrics
            };
        }
        catch (error) {
            structuredLogger.error('Error getting system metrics', error);
            throw error;
        }
    }
    async getActiveAlerts() {
        try {
            const monitoringAlerts = monitoringService.getAlerts(50);
            return monitoringAlerts.map(alert => ({
                id: alert.id,
                type: 'error',
                severity: alert.severity,
                message: alert.message,
                service: 'system',
                timestamp: alert.timestamp,
                resolved: alert.resolved,
                resolvedAt: alert.resolvedAt
            }));
        }
        catch (error) {
            structuredLogger.error('Error getting active alerts', error);
            return [];
        }
    }
    async checkAllServices() {
        const services = ['database', 'redis', 'api', 'monitoring'];
        const results = await Promise.allSettled(services.map(service => this.checkServiceHealth(service)));
        return results
            .filter((result) => result.status === 'fulfilled')
            .map(result => result.value);
    }
    async checkDatabaseHealth() {
        try {
            const db = getDatabaseService();
            const startTime = Date.now();
            await db.query('SELECT 1');
            const responseTime = Date.now() - startTime;
            return {
                status: responseTime < 1000 ? 'up' : 'degraded',
                details: {
                    responseTime,
                    connectionPool: 'active',
                    lastQuery: new Date()
                }
            };
        }
        catch (error) {
            return {
                status: 'down',
                details: { error: error.message }
            };
        }
    }
    async checkRedisHealth() {
        try {
            const redis = getRedisService();
            const startTime = Date.now();
            await redis.ping();
            const responseTime = Date.now() - startTime;
            return {
                status: responseTime < 100 ? 'up' : 'degraded',
                details: {
                    responseTime,
                    connection: 'active',
                    lastPing: new Date()
                }
            };
        }
        catch (error) {
            return {
                status: 'down',
                details: { error: error.message }
            };
        }
    }
    async checkAPIHealth() {
        try {
            const response = await fetch('http://localhost:3000/v1/health', {
                method: 'GET',
                timeout: 5000
            });
            return {
                status: response.ok ? 'up' : 'degraded',
                details: {
                    statusCode: response.status,
                    responseTime: Date.now(),
                    lastCheck: new Date()
                }
            };
        }
        catch (error) {
            return {
                status: 'down',
                details: { error: error.message }
            };
        }
    }
    async checkMonitoringHealth() {
        try {
            const healthStatus = monitoringService.getHealthStatus();
            return {
                status: healthStatus.status === 'healthy' ? 'up' :
                    healthStatus.status === 'degraded' ? 'degraded' : 'down',
                details: {
                    status: healthStatus.status,
                    services: healthStatus.services.length,
                    lastCheck: new Date()
                }
            };
        }
        catch (error) {
            return {
                status: 'down',
                details: { error: error.message }
            };
        }
    }
    async getDatabaseMetrics() {
        try {
            const db = getDatabaseService();
            const startTime = Date.now();
            await db.query('SELECT 1');
            return {
                connections: 10,
                maxConnections: 100,
                queryTime: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                connections: 0,
                maxConnections: 100,
                queryTime: 0
            };
        }
    }
    async getCacheMetrics() {
        try {
            const cacheStats = monitoringService.getStats();
            return {
                hitRate: cacheStats.hitRate * 100,
                memoryUsage: 0,
                operations: cacheStats.hits + cacheStats.misses
            };
        }
        catch (error) {
            return {
                hitRate: 0,
                memoryUsage: 0,
                operations: 0
            };
        }
    }
    calculateCPUUsage(cpuUsage) {
        return (cpuUsage.user + cpuUsage.system) / 1000000;
    }
    getLoadAverage() {
        return [0.5, 0.3, 0.2];
    }
    calculateOverallStatus(services, alerts) {
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
        const downServices = services.filter(service => service.status === 'down');
        const degradedServices = services.filter(service => service.status === 'degraded');
        if (criticalAlerts.length > 0 || downServices.length > 0) {
            return 'unhealthy';
        }
        if (degradedServices.length > 0) {
            return 'degraded';
        }
        return 'healthy';
    }
    startHealthMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.getOverallHealth();
                structuredLogger.debug('System health data updated');
            }
            catch (error) {
                structuredLogger.error('Error updating system health', error);
            }
        }, 30000);
        structuredLogger.info('System health monitoring started');
    }
    stopHealthMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        structuredLogger.info('System health monitoring stopped');
    }
    getCurrentHealthData() {
        return this.healthData;
    }
    isMonitoringActive() {
        return this.isMonitoring;
    }
    async resolveAlert(alertId) {
        try {
            await monitoringService.resolveAlert(alertId);
            structuredLogger.info(`Alert resolved: ${alertId}`);
        }
        catch (error) {
            structuredLogger.error(`Error resolving alert: ${alertId}`, error);
            throw error;
        }
    }
}
export const systemHealthService = new SystemHealthService();
//# sourceMappingURL=system-health.service.js.map