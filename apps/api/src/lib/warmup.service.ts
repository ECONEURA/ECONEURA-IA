/**
 * PR-47: Warm-up Management Service
 * 
 * Service for managing warm-up of AI services, search engines, and system resources
 */

import { 
  WarmupSchedule, 
  WarmupConfig, 
  WarmupService,
  WarmupStatus,
  ServiceWarmupStatus,
  WarmupMetrics,
  WarmupError,
  CreateWarmupScheduleRequest,
  UpdateWarmupScheduleRequest,
  TriggerWarmupRequest,
  WarmupStats
} from './warmup-types.js';

export class WarmupService {
  private schedules: Map<string, WarmupSchedule> = new Map();
  private warmupStatuses: Map<string, WarmupStatus> = new Map();
  private runningWarmups: Set<string> = new Set();

  constructor() {
    this.initializeDefaultSchedules();
  }

  /**
   * Get all warm-up schedules for an organization
   */
  async getWarmupSchedules(organizationId: string): Promise<WarmupSchedule[]> {
    const schedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.organizationId === organizationId);
    
    return schedules;
  }

  /**
   * Get a specific warm-up schedule
   */
  async getWarmupSchedule(id: string): Promise<WarmupSchedule | null> {
    return this.schedules.get(id) || null;
  }

  /**
   * Create a new warm-up schedule
   */
  async createWarmupSchedule(request: CreateWarmupScheduleRequest): Promise<WarmupSchedule> {
    const id = this.generateId();
    const now = new Date();

    const schedule: WarmupSchedule = {
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

  /**
   * Update an existing warm-up schedule
   */
  async updateWarmupSchedule(id: string, request: UpdateWarmupScheduleRequest): Promise<WarmupSchedule | null> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return null;
    }

    const updatedSchedule: WarmupSchedule = {
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

  /**
   * Delete a warm-up schedule
   */
  async deleteWarmupSchedule(id: string): Promise<boolean> {
    return this.schedules.delete(id);
  }

  /**
   * Trigger a warm-up manually
   */
  async triggerWarmup(request: TriggerWarmupRequest): Promise<WarmupStatus> {
    const warmupId = this.generateId();
    const now = new Date();

    const warmupStatus: WarmupStatus = {
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

    // Start warm-up process asynchronously
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

  /**
   * Get warm-up status
   */
  async getWarmupStatus(warmupId: string): Promise<WarmupStatus | null> {
    return this.warmupStatuses.get(warmupId) || null;
  }

  /**
   * Get warm-up metrics
   */
  async getWarmupMetrics(organizationId: string): Promise<WarmupMetrics> {
    const warmups = Array.from(this.warmupStatuses.values())
      .filter(warmup => {
        const schedule = this.schedules.get(warmup.scheduleId);
        return schedule?.organizationId === organizationId;
      });

    const completedWarmups = warmups.filter(w => w.status === 'completed');
    const failedWarmups = warmups.filter(w => w.status === 'failed');

    const totalServices = warmups.reduce((sum, w) => sum + w.services.length, 0);
    const completedServices = warmups.reduce((sum, w) => 
      sum + w.services.filter(s => s.status === 'completed').length, 0);
    const failedServices = warmups.reduce((sum, w) => 
      sum + w.services.filter(s => s.status === 'failed').length, 0);

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

  /**
   * Get warm-up statistics
   */
  async getWarmupStats(organizationId: string): Promise<WarmupStats> {
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

  /**
   * Check if warm-up should run during quiet hours
   */
  async shouldRunDuringQuietHours(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return false;
    }

    if (!schedule.quietHoursOnly) {
      return true;
    }

    // Check if we're in quiet hours (simplified implementation)
    const hour = new Date().getHours();
    return hour >= 22 || hour <= 6; // 10 PM to 6 AM
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async executeWarmup(warmupStatus: WarmupStatus, request: TriggerWarmupRequest): Promise<void> {
    warmupStatus.status = 'running';
    
    try {
      // Get services to warm up
      const servicesToWarmup = await this.getServicesToWarmup(request);
      warmupStatus.metrics.totalServices = servicesToWarmup.length;

      // Warm up each service
      for (const service of servicesToWarmup) {
        const serviceStatus = await this.warmupService(service);
        warmupStatus.services.push(serviceStatus);

        if (serviceStatus.status === 'completed') {
          warmupStatus.metrics.completedServices++;
        } else if (serviceStatus.status === 'failed') {
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

      // Update final metrics
      warmupStatus.metrics.averageLatency = this.calculateAverageLatency(warmupStatus.services);
      warmupStatus.metrics.memoryUsage = this.getCurrentMemoryUsage();
      warmupStatus.metrics.cpuUsage = this.getCurrentCpuUsage();
      warmupStatus.metrics.cacheHitRate = this.getCurrentCacheHitRate();

      // Mark as completed
      warmupStatus.status = 'completed';
      warmupStatus.endTime = new Date();
      warmupStatus.duration = warmupStatus.endTime.getTime() - warmupStatus.startTime.getTime();

    } catch (error) {
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
    } finally {
      this.runningWarmups.delete(warmupStatus.id);
    }
  }

  private async getServicesToWarmup(request: TriggerWarmupRequest): Promise<WarmupService[]> {
    if (request.scheduleId) {
      const schedule = this.schedules.get(request.scheduleId);
      return schedule?.warmupConfig.services || [];
    }

    if (request.services && request.services.length > 0) {
      // Return services specified in request
      return request.services.map(serviceName => ({
        name: serviceName,
        type: 'ai-model' as const,
        priority: 'medium' as const,
        warmupStrategy: {
          type: 'immediate' as const,
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

    // Return default services
    return this.getDefaultServices();
  }

  private async warmupService(service: WarmupService): Promise<ServiceWarmupStatus> {
    const startTime = new Date();
    const serviceStatus: ServiceWarmupStatus = {
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
      // Simulate warm-up process
      await this.simulateWarmupProcess(service, serviceStatus);
      
      serviceStatus.status = 'completed';
      serviceStatus.endTime = new Date();
      serviceStatus.duration = serviceStatus.endTime.getTime() - serviceStatus.startTime.getTime();
      serviceStatus.progress = 100;

    } catch (error) {
      serviceStatus.status = 'failed';
      serviceStatus.endTime = new Date();
      serviceStatus.duration = serviceStatus.endTime.getTime() - serviceStatus.startTime.getTime();
      serviceStatus.errors.push(error.message);
    }

    return serviceStatus;
  }

  private async simulateWarmupProcess(service: WarmupService, status: ServiceWarmupStatus): Promise<void> {
    const steps = [
      'Initializing service...',
      'Loading configuration...',
      'Establishing connections...',
      'Preloading data...',
      'Running health checks...',
      'Optimizing performance...'
    ];

    for (let i = 0; i < steps.length; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      status.progress = Math.round(((i + 1) / steps.length) * 100);
      
      // Update metrics
      status.metrics.latency = Math.random() * 100 + 50;
      status.metrics.throughput = Math.random() * 1000 + 500;
      status.metrics.memoryUsage = Math.random() * 100 + 50;
      status.metrics.cpuUsage = Math.random() * 50 + 25;
      status.metrics.cacheHitRate = Math.random() * 20 + 80;
      status.metrics.errorRate = Math.random() * 2;
    }
  }

  private calculateAverageLatency(services: ServiceWarmupStatus[]): number {
    if (services.length === 0) return 0;
    
    const totalLatency = services.reduce((sum, service) => sum + service.metrics.latency, 0);
    return totalLatency / services.length;
  }

  private getCurrentMemoryUsage(): number {
    // Simulate memory usage
    return Math.random() * 100 + 50;
  }

  private getCurrentCpuUsage(): number {
    // Simulate CPU usage
    return Math.random() * 50 + 25;
  }

  private getCurrentCacheHitRate(): number {
    // Simulate cache hit rate
    return Math.random() * 20 + 80;
  }

  private getCurrentResourceUtilization(): number {
    // Simulate resource utilization
    return Math.random() * 30 + 70;
  }

  private getDefaultServices(): WarmupService[] {
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

  private initializeDefaultSchedules(): void {
    // Create default warm-up schedule
    const defaultSchedule: WarmupSchedule = {
      id: 'default-warmup-schedule',
      organizationId: 'org_1',
      serviceName: 'ai-platform',
      scheduleCron: '0 2 * * *', // Daily at 2 AM
      enabled: true,
      quietHoursOnly: true,
      warmupConfig: {
        services: this.getDefaultServices(),
        cacheWarming: {
          enabled: true,
          strategies: [
            {
              type: 'lru',
              maxSize: 1024 * 1024 * 1024, // 1GB
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
              size: 1024 * 1024 * 1024, // 1GB
              source: 'model-registry',
              dependencies: []
            }
          ],
          priority: 'high',
          maxMemoryUsage: 2 * 1024 * 1024 * 1024 // 2GB
        },
        performanceTargets: {
          maxLatency: 200,
          minThroughput: 1000,
          maxMemoryUsage: 4 * 1024 * 1024 * 1024, // 4GB
          maxCpuUsage: 80,
          cacheHitRate: 90
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.schedules.set(defaultSchedule.id, defaultSchedule);
  }

  private generateId(): string {
    return `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

