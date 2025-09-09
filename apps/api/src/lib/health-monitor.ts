// Advanced Health Monitoring System for ECONEURA
import { structuredLogger } from './structured-logger.js';
import { cacheManager } from './advanced-cache.js';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, unknown>;
  responseTime?: number;
  lastChecked: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  checks: HealthCheck[];
  overallStatus: 'healthy' | 'unhealthy' | 'degraded';
  lastChecked: Date;
  uptime: number;
  version?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private services: Map<string, ServiceHealth> = new Map();
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private startTime: Date = new Date();
  private metrics: {
    totalRequests: number;
    totalErrors: number;
    responseTimes: number[];
    activeConnections: number;
  } = {
    totalRequests: 0,
    totalErrors: 0,
    responseTimes: [],
    activeConnections: 0
  };

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  constructor() {
    this.initializeDefaultChecks();
    this.startPeriodicHealthChecks();
  }

  private initializeDefaultChecks(): void {
    // Database health check
    this.addCheck('database', async () => {
      const start = Date.now();
      try {
        // Simulate database check
        await new Promise(resolve => setTimeout(resolve, 10));
        const responseTime = Date.now() - start;

        return {
          name: 'database',
          status: 'healthy',
          message: 'Database connection is healthy',
          responseTime,
          lastChecked: new Date()
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          message: `Database connection failed: ${(error as Error).message}`,
          lastChecked: new Date()
        };
      }
    });

    // Cache health check
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
      } catch (error) {
        return {
          name: 'cache',
          status: 'unhealthy',
          message: `Cache system failed: ${(error as Error).message}`,
          lastChecked: new Date()
        };
      }
    });

    // Memory health check
    this.addCheck('memory', async () => {
      const start = Date.now();
      try {
        const memUsage = process.memoryUsage();
        const responseTime = Date.now() - start;

        const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
        const memoryLimitMB = 512; // 512MB limit

        let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
        if (memoryUsageMB > memoryLimitMB) {
          status = 'unhealthy';
        } else if (memoryUsageMB > memoryLimitMB * 0.8) {
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
      } catch (error) {
        return {
          name: 'memory',
          status: 'unhealthy',
          message: `Memory check failed: ${(error as Error).message}`,
          lastChecked: new Date()
        };
      }
    });

    // Disk space health check
    this.addCheck('disk', async () => {
      const start = Date.now();
      try {
        // Simulate disk space check
        const freeSpace = 1024 * 1024 * 1024; // 1GB free
        const totalSpace = 10 * 1024 * 1024 * 1024; // 10GB total
        const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;

        const responseTime = Date.now() - start;

        let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
        if (usagePercent > 90) {
          status = 'unhealthy';
        } else if (usagePercent > 80) {
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
      } catch (error) {
        return {
          name: 'disk',
          status: 'unhealthy',
          message: `Disk check failed: ${(error as Error).message}`,
          lastChecked: new Date()
        };
      }
    });

    // External services health check
    this.addCheck('external', async () => {
      const start = Date.now();
      try {
        // Simulate external service checks
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
      } catch (error) {
        return {
          name: 'external',
          status: 'unhealthy',
          message: `External services check failed: ${(error as Error).message}`,
          lastChecked: new Date()
        };
      }
    });
  }

  private startPeriodicHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      await this.runAllChecks();
    }, 30000);
  }

  addCheck(name: string, checkFunction: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFunction);
  }

  removeCheck(name: string): void {
    this.checks.delete(name);
  }

  async runCheck(name: string): Promise<HealthCheck | null> {
    const checkFunction = this.checks.get(name);
    if (!checkFunction) {
      return null;
    }

    try {
      return await checkFunction();
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        message: `Health check failed: ${(error as Error).message}`,
        lastChecked: new Date()
      };
    }
  }

  async runAllChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    for (const [name, checkFunction] of this.checks.entries()) {
      try {
        const check = await checkFunction();
        checks.push(check);

        // Update service health
        this.updateServiceHealth(name, check);
      } catch (error) {
        const failedCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          message: `Health check failed: ${(error as Error).message}`,
          lastChecked: new Date()
        };
        checks.push(failedCheck);
        this.updateServiceHealth(name, failedCheck);
      }
    }

    return checks;
  }

  private updateServiceHealth(serviceName: string, check: HealthCheck): void {
    const service = this.services.get(serviceName) || {
      name: serviceName,
      status: 'up',
      checks: [],
      overallStatus: 'healthy',
      lastChecked: new Date(),
      uptime: 0
    };

    // Update or add check
    const existingCheckIndex = service.checks.findIndex(c => c.name === check.name);
    if (existingCheckIndex >= 0) {
      service.checks[existingCheckIndex] = check;
    } else {
      service.checks.push(check);
    }

    // Determine overall service status
    const unhealthyChecks = service.checks.filter(c => c.status === 'unhealthy');
    const degradedChecks = service.checks.filter(c => c.status === 'degraded');

    if (unhealthyChecks.length > 0) {
      service.overallStatus = 'unhealthy';
      service.status = 'down';
    } else if (degradedChecks.length > 0) {
      service.overallStatus = 'degraded';
      service.status = 'degraded';
    } else {
      service.overallStatus = 'healthy';
      service.status = 'up';
    }

    service.lastChecked = new Date();
    service.uptime = Date.now() - this.startTime.getTime();

    this.services.set(serviceName, service);
  }

  getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.services.get(serviceName) || null;
  }

  getAllServicesHealth(): ServiceHealth[] {
    return Array.from(this.services.values());
  }

  getSystemHealth(): SystemHealth {
    const services = this.getAllServicesHealth();
    const unhealthyServices = services.filter(s => s.overallStatus === 'unhealthy');
    const degradedServices = services.filter(s => s.overallStatus === 'degraded');

    let systemStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      systemStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
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
        cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
      }
    };
  }

  // Metrics tracking
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.metrics.totalRequests++;
    if (isError) {
      this.metrics.totalErrors++;
    }

    this.metrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  setActiveConnections(count: number): void {
    this.metrics.activeConnections = count;
  }

  // Health check endpoints
  async getLivenessProbe(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    };
  }

  async getReadinessProbe(): Promise<{ status: string; timestamp: string; checks: HealthCheck[] }> {
    const checks = await this.runAllChecks();
    const systemHealth = this.getSystemHealth();

    return {
      status: systemHealth.status,
      timestamp: new Date().toISOString(),
      checks
    };
  }

  async getHealthCheck(): Promise<SystemHealth> {
    await this.runAllChecks();
    return this.getSystemHealth();
  }

  // Detailed health information
  async getDetailedHealth(): Promise<{
    system: SystemHealth;
    services: ServiceHealth[];
    checks: HealthCheck[];
    metrics: {
      cache: Record<string, any>;
      performance: {
        responseTime: {
          min: number;
          max: number;
          avg: number;
          p95: number;
          p99: number;
        };
        throughput: number;
        errorRate: number;
      };
    };
  }> {
    const systemHealth = this.getSystemHealth();
    const services = this.getAllServicesHealth();
    const checks = await this.runAllChecks();
    const cacheStats = cacheManager.getAllStats();

    // Calculate response time percentiles
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

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  // Alerting
  private alertThresholds = {
    errorRate: 5, // 5%
    responseTime: 1000, // 1 second
    memoryUsage: 80, // 80%
    diskUsage: 85 // 85%
  };

  checkAlertConditions(): Array<{ type: string; message: string; severity: 'warning' | 'critical' }> {
    const alerts: Array<{ type: string; message: string; severity: 'warning' | 'critical' }> = [];
    const systemHealth = this.getSystemHealth();

    // Error rate alert
    if (systemHealth.metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        message: `High error rate: ${systemHealth.metrics.errorRate.toFixed(2)}%`,
        severity: systemHealth.metrics.errorRate > 10 ? 'critical' : 'warning'
      });
    }

    // Response time alert
    if (systemHealth.metrics.averageResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        message: `High response time: ${systemHealth.metrics.averageResponseTime.toFixed(2)}ms`,
        severity: systemHealth.metrics.averageResponseTime > 2000 ? 'critical' : 'warning'
      });
    }

    // Memory usage alert
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
