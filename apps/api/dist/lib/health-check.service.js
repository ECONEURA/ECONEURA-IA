import { EventEmitter } from 'events';

import { prometheus } from '@econeura/shared/src/metrics/index.js';
export class HealthCheckService extends EventEmitter {
    checks = new Map();
    results = new Map();
    timers = new Map();
    isRunning = false;
    startTime = Date.now();
    constructor() {
        super();
        this.setupMetrics();
    }
    setupMetrics() {
        prometheus.register.gauge({
            name: 'health_check_status',
            help: 'Health check status (0=unhealthy, 1=degraded, 2=healthy)',
            labelNames: ['check_name', 'check_type']
        });
        prometheus.register.histogram({
            name: 'health_check_duration_seconds',
            help: 'Health check duration in seconds',
            labelNames: ['check_name', 'check_type']
        });
        prometheus.register.counter({
            name: 'health_check_failures_total',
            help: 'Total health check failures',
            labelNames: ['check_name', 'check_type', 'reason']
        });
    }
    registerCheck(name, config, checkFunction) {
        this.checks.set(name, config);
        this[`check_${name}`] = checkFunction;
        if (this.isRunning) {
            this.startCheck(name);
        }
    }
    async start() {
        this.isRunning = true;
        this.startTime = Date.now();
        for (const [name] of this.checks) {
            this.startCheck(name);
        }
    }
    async stop() {
        this.isRunning = false;
        for (const [name, timer] of this.timers) {
            clearInterval(timer);
        }
        this.timers.clear();
    }
    startCheck(name) {
        const config = this.checks.get(name);
        if (!config)
            return;
        const timer = setInterval(async () => {
            await this.runCheck(name);
        }, config.interval);
        this.timers.set(name, timer);
        this.runCheck(name);
    }
    async runCheck(name) {
        const config = this.checks.get(name);
        if (!config)
            return;
        const startTime = Date.now();
        let result;
        try {
            const dependencyResults = [];
            if (config.dependencies) {
                for (const depName of config.dependencies) {
                    const depResult = this.results.get(depName);
                    if (depResult) {
                        dependencyResults.push(depResult);
                    }
                }
            }
            const checkFunction = this[`check_${name}`];
            if (!checkFunction) {
                throw new Error(`Check function not found for ${name}`);
            }
            const checkResult = await Promise.race([
                checkFunction(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Check timeout')), config.timeout))
            ]);
            const duration = Date.now() - startTime;
            result = {
                name,
                status: checkResult.status,
                message: checkResult.message,
                timestamp: new Date().toISOString(),
                duration,
                metadata: checkResult.metadata,
                dependencies: dependencyResults
            };
            this.updateMetrics(name, config.type, result.status, duration);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result = {
                name,
                status: 'unhealthy',
                message: `Check failed: ${errorMessage}`,
                timestamp: new Date().toISOString(),
                duration,
                metadata: { error: errorMessage }
            };
            this.updateMetrics(name, config.type, 'unhealthy', duration);
            prometheus.register.getSingleMetric('health_check_failures_total')?.inc({
                check_name: name,
                check_type: config.type,
                reason: 'check_failed'
            });
        }
        this.results.set(name, result);
        this.emit('check_completed', result);
        if (result.status === 'unhealthy') {
            this.emit('check_failed', result);
        }
        else if (result.status === 'degraded') {
            this.emit('check_degraded', result);
        }
    }
    updateMetrics(name, type, status, duration) {
        const statusValue = status === 'healthy' ? 2 : status === 'degraded' ? 1 : 0;
        prometheus.register.getSingleMetric('health_check_status')?.set({
            check_name: name,
            check_type: type
        }, statusValue);
        prometheus.register.getSingleMetric('health_check_duration_seconds')?.observe({
            check_name: name,
            check_type: type
        }, duration / 1000);
    }
    getCheckResult(name) {
        return this.results.get(name) || null;
    }
    getAllResults() {
        return new Map(this.results);
    }
    getSystemHealth() {
        const checks = Array.from(this.results.values());
        let overall = 'healthy';
        const criticalChecks = checks.filter(check => {
            const config = this.checks.get(check.name);
            return config?.critical;
        });
        if (criticalChecks.some(check => check.status === 'unhealthy')) {
            overall = 'unhealthy';
        }
        else if (checks.some(check => check.status === 'degraded')) {
            overall = 'degraded';
        }
        return {
            overall,
            checks,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
    }
    async runCheckManually(name) {
        await this.runCheck(name);
        return this.results.get(name);
    }
    async runAllChecks() {
        const promises = Array.from(this.checks.keys()).map(name => this.runCheck(name));
        await Promise.all(promises);
        return Array.from(this.results.values());
    }
    getLivenessStatus() {
        const livenessChecks = Array.from(this.results.values())
            .filter(check => {
            const config = this.checks.get(check.name);
            return config?.type === 'liveness';
        });
        if (livenessChecks.length === 0) {
            return { status: 'alive', message: 'No liveness checks configured' };
        }
        const hasUnhealthy = livenessChecks.some(check => check.status === 'unhealthy');
        return {
            status: hasUnhealthy ? 'dead' : 'alive',
            message: hasUnhealthy ? 'Liveness checks failing' : 'All liveness checks passing'
        };
    }
    getReadinessStatus() {
        const readinessChecks = Array.from(this.results.values())
            .filter(check => {
            const config = this.checks.get(check.name);
            return config?.type === 'readiness';
        });
        if (readinessChecks.length === 0) {
            return { status: 'ready', message: 'No readiness checks configured' };
        }
        const hasUnhealthy = readinessChecks.some(check => check.status === 'unhealthy');
        return {
            status: hasUnhealthy ? 'not_ready' : 'ready',
            message: hasUnhealthy ? 'Readiness checks failing' : 'All readiness checks passing'
        };
    }
}
export const healthCheckService = new HealthCheckService();
//# sourceMappingURL=health-check.service.js.map