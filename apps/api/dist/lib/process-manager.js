import { structuredLogger } from './structured-logger.js';
import { databasePool } from './database-pool.js';
import { cacheManager } from './advanced-cache.js';
export class ProcessManager {
    static instance;
    config;
    isShuttingDown = false;
    startTime = new Date();
    shutdownPromise = null;
    signalHandlers = new Map();
    constructor(config = {}) {
        this.config = {
            timeout: config.timeout || 30000,
            signals: config.signals || ['SIGTERM', 'SIGINT', 'SIGUSR2'],
            cleanupTasks: config.cleanupTasks || []
        };
        this.initializeDefaultCleanupTasks();
        this.setupSignalHandlers();
        this.setupProcessMonitoring();
    }
    static getInstance(config) {
        if (!ProcessManager.instance) {
            ProcessManager.instance = new ProcessManager(config);
        }
        return ProcessManager.instance;
    }
    initializeDefaultCleanupTasks() {
        this.config.cleanupTasks = [
            {
                name: 'database_pool',
                task: async () => {
                    structuredLogger.info('Closing database pool', { operation: 'shutdown' });
                    await databasePool.close();
                },
                timeout: 10000,
                critical: true
            },
            {
                name: 'cache_manager',
                task: async () => {
                    structuredLogger.info('Clearing cache manager', { operation: 'shutdown' });
                    cacheManager.clearAll();
                },
                timeout: 5000,
                critical: false
            },
            {
                name: 'health_monitor',
                task: async () => {
                    structuredLogger.info('Stopping health monitor', { operation: 'shutdown' });
                },
                timeout: 3000,
                critical: false
            },
            {
                name: 'active_connections',
                task: async () => {
                    structuredLogger.info('Closing active connections', { operation: 'shutdown' });
                },
                timeout: 5000,
                critical: false
            }
        ];
    }
    setupSignalHandlers() {
        for (const signal of this.config.signals) {
            const handler = () => {
                structuredLogger.info(`Received ${signal} signal`, {
                    operation: 'signal_handler',
                    signal,
                    pid: process.pid
                });
                this.gracefulShutdown(signal);
            };
            this.signalHandlers.set(signal, handler);
            process.on(signal, handler);
        }
        process.on('uncaughtException', (error) => {
            structuredLogger.fatal('Uncaught exception', error, {
                operation: 'uncaught_exception',
                pid: process.pid
            });
            this.emergencyShutdown();
        });
        process.on('unhandledRejection', (reason, promise) => {
            structuredLogger.fatal('Unhandled promise rejection', new Error(String(reason)), {
                operation: 'unhandled_rejection',
                pid: process.pid,
                promise: promise.toString()
            });
            this.emergencyShutdown();
        });
        process.on('warning', (warning) => {
            structuredLogger.warn('Process warning', {
                operation: 'process_warning',
                name: warning.name,
                message: warning.message,
                stack: warning.stack
            });
        });
    }
    setupProcessMonitoring() {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const memUsageMB = memUsage.heapUsed / 1024 / 1024;
            if (memUsageMB > 500) {
                structuredLogger.warn('High memory usage detected', {
                    operation: 'memory_monitoring',
                    memoryUsageMB: memUsageMB.toFixed(2),
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    external: memUsage.external,
                    rss: memUsage.rss
                });
            }
        }, 60000);
        setInterval(() => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000;
                if (lag > 100) {
                    structuredLogger.warn('High event loop lag detected', {
                        operation: 'event_loop_monitoring',
                        lagMs: lag.toFixed(2)
                    });
                }
            });
        }, 30000);
    }
    async gracefulShutdown(signal) {
        if (this.isShuttingDown) {
            structuredLogger.warn('Shutdown already in progress', {
                operation: 'graceful_shutdown',
                signal
            });
            return this.shutdownPromise;
        }
        this.isShuttingDown = true;
        structuredLogger.info('Starting graceful shutdown', {
            operation: 'graceful_shutdown',
            signal,
            timeout: this.config.timeout
        });
        this.shutdownPromise = this.performShutdown();
        return this.shutdownPromise;
    }
    async performShutdown() {
        const shutdownStartTime = Date.now();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Shutdown timeout exceeded'));
            }, this.config.timeout);
        });
        try {
            await Promise.race([
                this.executeCleanupTasks(),
                timeoutPromise
            ]);
            const shutdownDuration = Date.now() - shutdownStartTime;
            structuredLogger.info('Graceful shutdown completed', {
                operation: 'graceful_shutdown',
                duration: shutdownDuration
            });
            process.exit(0);
        }
        catch (error) {
            const shutdownDuration = Date.now() - shutdownStartTime;
            structuredLogger.error('Graceful shutdown failed', error, {
                operation: 'graceful_shutdown',
                duration: shutdownDuration
            });
            process.exit(1);
        }
    }
    async executeCleanupTasks() {
        const results = [];
        for (const task of this.config.cleanupTasks) {
            const taskStartTime = Date.now();
            try {
                structuredLogger.info(`Executing cleanup task: ${task.name}`, {
                    operation: 'cleanup_task',
                    taskName: task.name
                });
                await Promise.race([
                    task.task(),
                    new Promise((_, reject) => {
                        setTimeout(() => {
                            reject(new Error(`Task ${task.name} timed out`));
                        }, task.timeout);
                    })
                ]);
                const duration = Date.now() - taskStartTime;
                results.push({ name: task.name, success: true, duration });
                structuredLogger.info(`Cleanup task completed: ${task.name}`, {
                    operation: 'cleanup_task',
                    taskName: task.name,
                    duration
                });
            }
            catch (error) {
                const duration = Date.now() - taskStartTime;
                const errorMessage = error.message;
                results.push({ name: task.name, success: false, duration, error: errorMessage });
                structuredLogger.error(`Cleanup task failed: ${task.name}`, error, {
                    operation: 'cleanup_task',
                    taskName: task.name,
                    duration
                });
                if (task.critical) {
                    throw new Error(`Critical cleanup task failed: ${task.name} - ${errorMessage}`);
                }
            }
        }
        const successfulTasks = results.filter(r => r.success).length;
        const failedTasks = results.filter(r => !r.success).length;
        structuredLogger.info('Cleanup tasks summary', {
            operation: 'cleanup_summary',
            total: results.length,
            successful: successfulTasks,
            failed: failedTasks,
            results
        });
    }
    emergencyShutdown() {
        structuredLogger.fatal('Emergency shutdown initiated', new Error('Emergency shutdown'), {
            operation: 'emergency_shutdown',
            pid: process.pid
        });
        setTimeout(() => {
            process.exit(1);
        }, 5000);
    }
    getProcessInfo() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            pid: process.pid,
            uptime: Date.now() - this.startTime.getTime(),
            memoryUsage: memUsage,
            cpuUsage: cpuUsage,
            version: process.env.npm_package_version || '1.0.0',
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
        };
    }
    getProcessHealth() {
        const info = this.getProcessInfo();
        const issues = [];
        let status = 'healthy';
        const memUsageMB = info.memoryUsage.heapUsed / 1024 / 1024;
        if (memUsageMB > 1000) {
            issues.push(`High memory usage: ${memUsageMB.toFixed(2)}MB`);
            status = 'unhealthy';
        }
        else if (memUsageMB > 500) {
            issues.push(`Elevated memory usage: ${memUsageMB.toFixed(2)}MB`);
            status = 'degraded';
        }
        const uptimeHours = info.uptime / (1000 * 60 * 60);
        if (uptimeHours > 168) {
            issues.push(`Long uptime: ${uptimeHours.toFixed(2)} hours`);
            if (status === 'healthy')
                status = 'degraded';
        }
        if (this.isShuttingDown) {
            issues.push('Process is shutting down');
            status = 'unhealthy';
        }
        return { status, info, issues };
    }
    addCleanupTask(task) {
        this.config.cleanupTasks.push(task);
        structuredLogger.info('Cleanup task added', {
            operation: 'cleanup_task_add',
            taskName: task.name,
            timeout: task.timeout,
            critical: task.critical
        });
    }
    removeCleanupTask(name) {
        const index = this.config.cleanupTasks.findIndex(task => task.name === name);
        if (index >= 0) {
            this.config.cleanupTasks.splice(index, 1);
            structuredLogger.info('Cleanup task removed', {
                operation: 'cleanup_task_remove',
                taskName: name
            });
            return true;
        }
        return false;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Process manager configuration updated', {
            operation: 'config_update',
            config: this.config
        });
    }
    isShuttingDownProcess() {
        return this.isShuttingDown;
    }
    getShutdownPromise() {
        return this.shutdownPromise;
    }
    async shutdown(reason = 'manual') {
        structuredLogger.info('Manual shutdown triggered', {
            operation: 'manual_shutdown',
            reason
        });
        return this.gracefulShutdown('MANUAL');
    }
    async restart(reason = 'manual') {
        structuredLogger.info('Process restart triggered', {
            operation: 'process_restart',
            reason
        });
        await this.gracefulShutdown('RESTART');
        process.exit(0);
    }
    getProcessStats() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            uptime: Date.now() - this.startTime.getTime(),
            memoryUsage: memUsage,
            cpuUsage: cpuUsage,
            eventLoopLag: 0,
            activeHandles: process._getActiveHandles().length,
            activeRequests: process._getActiveRequests().length,
            isShuttingDown: this.isShuttingDown,
            cleanupTasks: this.config.cleanupTasks.length
        };
    }
}
export const processManager = ProcessManager.getInstance();
//# sourceMappingURL=process-manager.js.map