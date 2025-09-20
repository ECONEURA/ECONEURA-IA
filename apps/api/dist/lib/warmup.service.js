export class WarmupService {
    schedules = new Map();
    warmupStatuses = new Map();
    runningWarmups = new Set();
    constructor() {
        this.initializeDefaultSchedules();
    }
    async getWarmupSchedules(organizationId) {
        const schedules = Array.from(this.schedules.values())
            .filter(schedule => schedule.organizationId === organizationId);
        return schedules;
    }
    async getWarmupSchedule(id) {
        return this.schedules.get(id) || null;
    }
    async createWarmupSchedule(request) {
        const id = this.generateId();
        const now = new Date();
        const schedule = {
            id,
            organizationId: request.organizationId,
            serviceName: request.serviceName,
            scheduleCron: request.scheduleCron,
            enabled: true,
            quietHoursOnly: request.quietHoursOnly ?? true,
            warmupConfig: request.warmupConfig,
            createdAt: now,
            updatedAt: now
        };
        this.schedules.set(id, schedule);
        return schedule;
    }
    async updateWarmupSchedule(id, request) {
        const schedule = this.schedules.get(id);
        if (!schedule) {
            return null;
        }
        const updatedSchedule = {
            ...schedule,
            scheduleCron: request.scheduleCron ?? schedule.scheduleCron,
            enabled: request.enabled ?? schedule.enabled,
            quietHoursOnly: request.quietHoursOnly ?? schedule.quietHoursOnly,
            warmupConfig: request.warmupConfig ?? schedule.warmupConfig,
            updatedAt: new Date()
        };
        this.schedules.set(id, updatedSchedule);
        return updatedSchedule;
    }
    async deleteWarmupSchedule(id) {
        return this.schedules.delete(id);
    }
    async triggerWarmup(request) {
        const warmupId = this.generateId();
        const now = new Date();
        const warmupStatus = {
            id: warmupId,
            scheduleId: request.scheduleId || 'manual',
            status: 'pending',
            startTime: now,
            services: [],
            metrics: {
                totalServices: 0,
                completedServices: 0,
                failedServices: 0,
                averageLatency: 0,
                totalDuration: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                cacheHitRate: 0
            },
            errors: []
        };
        this.warmupStatuses.set(warmupId, warmupStatus);
        this.runningWarmups.add(warmupId);
        this.executeWarmup(warmupStatus, request).catch(error => {
            console.error('Warm-up execution failed:', error);
            warmupStatus.status = 'failed';
            warmupStatus.errors.push({
                serviceName: 'system',
                error: error.message,
                timestamp: new Date(),
                retryCount: 0,
                severity: 'high'
            });
        });
        return warmupStatus;
    }
    async getWarmupStatus(warmupId) {
        return this.warmupStatuses.get(warmupId) || null;
    }
    async getWarmupMetrics(organizationId) {
        const warmups = Array.from(this.warmupStatuses.values())
            .filter(warmup => {
            const schedule = this.schedules.get(warmup.scheduleId);
            return schedule?.organizationId === organizationId;
        });
        const completedWarmups = warmups.filter(w => w.status === 'completed');
        const failedWarmups = warmups.filter(w => w.status === 'failed');
        const totalServices = warmups.reduce((sum, w) => sum + w.services.length, 0);
        const completedServices = warmups.reduce((sum, w) => sum + w.services.filter(s => s.status === 'completed').length, 0);
        const failedServices = warmups.reduce((sum, w) => sum + w.services.filter(s => s.status === 'failed').length, 0);
        const averageLatency = completedWarmups.length > 0
            ? completedWarmups.reduce((sum, w) => sum + w.metrics.averageLatency, 0) / completedWarmups.length
            : 0;
        const totalDuration = completedWarmups.length > 0
            ? completedWarmups.reduce((sum, w) => sum + (w.duration || 0), 0) / completedWarmups.length
            : 0;
        return {
            totalServices,
            completedServices,
            failedServices,
            averageLatency,
            totalDuration,
            memoryUsage: this.getCurrentMemoryUsage(),
            cpuUsage: this.getCurrentCpuUsage(),
            cacheHitRate: this.getCurrentCacheHitRate()
        };
    }
    async getWarmupStats(organizationId) {
        const schedules = await this.getWarmupSchedules(organizationId);
        const activeSchedules = schedules.filter(s => s.enabled);
        const warmups = Array.from(this.warmupStatuses.values())
            .filter(warmup => {
            const schedule = this.schedules.get(warmup.scheduleId);
            return schedule?.organizationId === organizationId;
        });
        const totalWarmups = warmups.length;
        const successfulWarmups = warmups.filter(w => w.status === 'completed').length;
        const successRate = totalWarmups > 0 ? (successfulWarmups / totalWarmups) * 100 : 0;
        const averageWarmupTime = warmups.length > 0
            ? warmups.reduce((sum, w) => sum + (w.duration || 0), 0) / warmups.length
            : 0;
        return {
            totalSchedules: schedules.length,
            activeSchedules: activeSchedules.length,
            totalWarmups,
            successRate,
            averageWarmupTime,
            cacheHitRate: this.getCurrentCacheHitRate(),
            resourceUtilization: this.getCurrentResourceUtilization()
        };
    }
    async shouldRunDuringQuietHours(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        if (!schedule) {
            return false;
        }
        if (!schedule.quietHoursOnly) {
            return true;
        }
        const hour = new Date().getHours();
        return hour >= 22 || hour <= 6;
    }
    async executeWarmup(warmupStatus, request) {
        warmupStatus.status = 'running';
        try {
            const servicesToWarmup = await this.getServicesToWarmup(request);
            warmupStatus.metrics.totalServices = servicesToWarmup.length;
            for (const service of servicesToWarmup) {
                const serviceStatus = await this.warmupService(service);
                warmupStatus.services.push(serviceStatus);
                if (serviceStatus.status === 'completed') {
                    warmupStatus.metrics.completedServices++;
                }
                else if (serviceStatus.status === 'failed') {
                    warmupStatus.metrics.failedServices++;
                    warmupStatus.errors.push({
                        serviceName: service.name,
                        error: serviceStatus.errors.join(', '),
                        timestamp: new Date(),
                        retryCount: 0,
                        severity: 'medium'
                    });
                }
            }
            warmupStatus.metrics.averageLatency = this.calculateAverageLatency(warmupStatus.services);
            warmupStatus.metrics.memoryUsage = this.getCurrentMemoryUsage();
            warmupStatus.metrics.cpuUsage = this.getCurrentCpuUsage();
            warmupStatus.metrics.cacheHitRate = this.getCurrentCacheHitRate();
            warmupStatus.status = 'completed';
            warmupStatus.endTime = new Date();
            warmupStatus.duration = warmupStatus.endTime.getTime() - warmupStatus.startTime.getTime();
        }
        catch (error) {
            warmupStatus.status = 'failed';
            warmupStatus.endTime = new Date();
            warmupStatus.duration = warmupStatus.endTime.getTime() - warmupStatus.startTime.getTime();
            warmupStatus.errors.push({
                serviceName: 'system',
                error: error.message,
                timestamp: new Date(),
                retryCount: 0,
                severity: 'high'
            });
        }
        finally {
            this.runningWarmups.delete(warmupStatus.id);
        }
    }
    async getServicesToWarmup(request) {
        if (request.scheduleId) {
            const schedule = this.schedules.get(request.scheduleId);
            return schedule?.warmupConfig.services || [];
        }
        if (request.services && request.services.length > 0) {
            return request.services.map(serviceName => ({
                name: serviceName,
                type: 'ai-model',
                priority: 'medium',
                warmupStrategy: {
                    type: 'immediate',
                    preloadData: true
                },
                dependencies: [],
                timeout: 30,
                retryCount: 3,
                healthCheck: {
                    enabled: true,
                    interval: 10,
                    timeout: 5,
                    retryCount: 3
                }
            }));
        }
        return this.getDefaultServices();
    }
    async warmupService(service) {
        const startTime = new Date();
        const serviceStatus = {
            serviceName: service.name,
            status: 'running',
            startTime,
            progress: 0,
            metrics: {
                latency: 0,
                throughput: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                cacheHitRate: 0,
                errorRate: 0
            },
            errors: []
        };
        try {
            await this.simulateWarmupProcess(service, serviceStatus);
            serviceStatus.status = 'completed';
            serviceStatus.endTime = new Date();
            serviceStatus.duration = serviceStatus.endTime.getTime() - serviceStatus.startTime.getTime();
            serviceStatus.progress = 100;
        }
        catch (error) {
            serviceStatus.status = 'failed';
            serviceStatus.endTime = new Date();
            serviceStatus.duration = serviceStatus.endTime.getTime() - serviceStatus.startTime.getTime();
            serviceStatus.errors.push(error.message);
        }
        return serviceStatus;
    }
    async simulateWarmupProcess(service, status) {
        const steps = [
            'Initializing service...',
            'Loading configuration...',
            'Establishing connections...',
            'Preloading data...',
            'Running health checks...',
            'Optimizing performance...'
        ];
        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
            status.progress = Math.round(((i + 1) / steps.length) * 100);
            status.metrics.latency = Math.random() * 100 + 50;
            status.metrics.throughput = Math.random() * 1000 + 500;
            status.metrics.memoryUsage = Math.random() * 100 + 50;
            status.metrics.cpuUsage = Math.random() * 50 + 25;
            status.metrics.cacheHitRate = Math.random() * 20 + 80;
            status.metrics.errorRate = Math.random() * 2;
        }
    }
    calculateAverageLatency(services) {
        if (services.length === 0)
            return 0;
        const totalLatency = services.reduce((sum, service) => sum + service.metrics.latency, 0);
        return totalLatency / services.length;
    }
    getCurrentMemoryUsage() {
        return Math.random() * 100 + 50;
    }
    getCurrentCpuUsage() {
        return Math.random() * 50 + 25;
    }
    getCurrentCacheHitRate() {
        return Math.random() * 20 + 80;
    }
    getCurrentResourceUtilization() {
        return Math.random() * 30 + 70;
    }
    getDefaultServices() {
        return [
            {
                name: 'ai-chat-service',
                type: 'ai-model',
                priority: 'high',
                warmupStrategy: {
                    type: 'immediate',
                    preloadData: true
                },
                dependencies: [],
                timeout: 30,
                retryCount: 3,
                healthCheck: {
                    enabled: true,
                    interval: 10,
                    timeout: 5,
                    retryCount: 3
                }
            },
            {
                name: 'search-engine',
                type: 'search-engine',
                priority: 'high',
                warmupStrategy: {
                    type: 'gradual',
                    batchSize: 100,
                    delayBetweenBatches: 1000
                },
                dependencies: ['ai-chat-service'],
                timeout: 60,
                retryCount: 2,
                healthCheck: {
                    enabled: true,
                    interval: 15,
                    timeout: 10,
                    retryCount: 2
                }
            },
            {
                name: 'database-connection-pool',
                type: 'database',
                priority: 'medium',
                warmupStrategy: {
                    type: 'immediate',
                    maxConcurrency: 10
                },
                dependencies: [],
                timeout: 20,
                retryCount: 3,
                healthCheck: {
                    enabled: true,
                    interval: 30,
                    timeout: 5,
                    retryCount: 3
                }
            }
        ];
    }
    initializeDefaultSchedules() {
        const defaultSchedule = {
            id: 'default-warmup-schedule',
            organizationId: 'org_1',
            serviceName: 'ai-platform',
            scheduleCron: '0 2 * * *',
            enabled: true,
            quietHoursOnly: true,
            warmupConfig: {
                services: this.getDefaultServices(),
                cacheWarming: {
                    enabled: true,
                    strategies: [
                        {
                            type: 'lru',
                            maxSize: 1024 * 1024 * 1024,
                            evictionPolicy: {
                                type: 'size-based',
                                threshold: 0.8,
                                cleanupInterval: 3600
                            },
                            preloadFrequency: '0 2 * * *'
                        }
                    ],
                    dataSources: [
                        {
                            name: 'frequent-queries',
                            type: 'database',
                            query: 'SELECT * FROM search_queries ORDER BY frequency DESC LIMIT 1000',
                            frequency: '0 2 * * *',
                            priority: 'high'
                        }
                    ],
                    compression: true,
                    ttl: 3600
                },
                connectionPooling: {
                    enabled: true,
                    maxConnections: 100,
                    minConnections: 10,
                    idleTimeout: 300,
                    connectionTimeout: 30,
                    healthCheckInterval: 60
                },
                resourcePreloading: {
                    enabled: true,
                    resources: [
                        {
                            name: 'ai-models',
                            type: 'model',
                            size: 1024 * 1024 * 1024,
                            source: 'model-registry',
                            dependencies: []
                        }
                    ],
                    priority: 'high',
                    maxMemoryUsage: 2 * 1024 * 1024 * 1024
                },
                performanceTargets: {
                    maxLatency: 200,
                    minThroughput: 1000,
                    maxMemoryUsage: 4 * 1024 * 1024 * 1024,
                    maxCpuUsage: 80,
                    cacheHitRate: 90
                }
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.schedules.set(defaultSchedule.id, defaultSchedule);
    }
    generateId() {
        return `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=warmup.service.js.map