import { HealthCheck, HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';

// ============================================================================
// HEALTH SERVICE
// ============================================================================

export interface HealthCheckConfig {
  name: string;
  timeout: number;
  interval: number;
  retries: number;
  critical: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: Record<string, HealthIndicatorResult>;
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      load: number[];
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export class HealthService {
  private static instance: HealthService;
  private healthChecks: Map<string, HealthCheckConfig> = new Map();
  private lastCheckResults: Map<string, HealthIndicatorResult> = new Map();
  private startTime: Date;

  private constructor() {
    this.startTime = new Date();
    this.initializeHealthChecks();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  // ========================================================================
  // HEALTH CHECKS INITIALIZATION
  // ========================================================================

  private initializeHealthChecks(): void {
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

  // ========================================================================
  // HEALTH CHECK EXECUTION
  // ========================================================================

  async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, 100));

      const duration = Date.now() - startTime;

      return {
        database: {
          status: 'up',
          responseTime: duration,
          message: 'Database connection successful'
        }
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Database connection failed'
        }
      };
    }
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Simulate Redis check
      await new Promise(resolve => setTimeout(resolve, 50));

      const duration = Date.now() - startTime;

      return {
        redis: {
          status: 'up',
          responseTime: duration,
          message: 'Redis connection successful'
        }
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Redis connection failed'
        }
      };
    }
  }

  async checkExternalAPIs(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Simulate external API checks
      await new Promise(resolve => setTimeout(resolve, 200));

      const duration = Date.now() - startTime;

      return {
        external_apis: {
          status: 'up',
          responseTime: duration,
          message: 'External APIs accessible'
        }
      };
    } catch (error) {
      return {
        external_apis: {
          status: 'down',
          message: error instanceof Error ? error.message : 'External APIs not accessible'
        }
      };
    }
  }

  async checkStorage(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Simulate storage check
      await new Promise(resolve => setTimeout(resolve, 100));

      const duration = Date.now() - startTime;

      return {
        storage: {
          status: 'up',
          responseTime: duration,
          message: 'Storage accessible'
        }
      };
    } catch (error) {
      return {
        storage: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Storage not accessible'
        }
      };
    }
  }

  async checkMemory(): Promise<HealthIndicatorResult> {
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
    } catch (error) {
      return {
        memory: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Memory check failed'
        }
      };
    }
  }

  async checkDisk(): Promise<HealthIndicatorResult> {
    try {
      // Simulate disk check
      const used = 50 * 1024 * 1024 * 1024; // 50GB
      const total = 100 * 1024 * 1024 * 1024; // 100GB
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
    } catch (error) {
      return {
        disk: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Disk check failed'
        }
      };
    }
  }

  // ========================================================================
  // COMPREHENSIVE HEALTH CHECK
  // ========================================================================

  async getHealthStatus(): Promise<HealthStatus> {
    const checks: Record<string, HealthIndicatorResult> = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Run all health checks
    const checkPromises = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkStorage(),
      this.checkMemory(),
      this.checkDisk();
    ];

    const results = await Promise.allSettled(checkPromises);

    results.forEach((result, index) => {
      const checkNames = ['database', 'redis', 'external_apis', 'storage', 'memory', 'disk'];
      const checkName = checkNames[index];

      if (result.status === 'fulfilled') {
        checks[checkName] = result.value;

        // Check if any critical service is down
        const checkConfig = this.healthChecks.get(checkName);
        if (checkConfig?.critical) {
          const checkResult = result.value[checkName];
          if (checkResult?.status === 'down') {
            overallStatus = 'unhealthy';
          } else if (checkResult?.status === 'degraded' && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        }
      } else {
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

    // Get system metrics
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
          usage: 0, // Would need to implement CPU monitoring
          load: [0, 0, 0] // Would need to implement load monitoring
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024, // 50GB
          total: 100 * 1024 * 1024 * 1024, // 100GB
          percentage: 50
        }
      }
    };
  }

  // ========================================================================
  // INDIVIDUAL HEALTH CHECKS
  // ========================================================================

  async getDatabaseHealth(): Promise<HealthIndicatorResult> {
    return this.checkDatabase();
  }

  async getRedisHealth(): Promise<HealthIndicatorResult> {
    return this.checkRedis();
  }

  async getExternalAPIsHealth(): Promise<HealthIndicatorResult> {
    return this.checkExternalAPIs();
  }

  async getStorageHealth(): Promise<HealthIndicatorResult> {
    return this.checkStorage();
  }

  async getMemoryHealth(): Promise<HealthIndicatorResult> {
    return this.checkMemory();
  }

  async getDiskHealth(): Promise<HealthIndicatorResult> {
    return this.checkDisk();
  }

  // ========================================================================
  // HEALTH CHECK CONFIGURATION
  // ========================================================================

  addHealthCheck(name: string, config: HealthCheckConfig): void {
    this.healthChecks.set(name, config);
  }

  removeHealthCheck(name: string): void {
    this.healthChecks.delete(name);
  }

  getHealthCheckConfig(name: string): HealthCheckConfig | undefined {
    return this.healthChecks.get(name);
  }

  getAllHealthCheckConfigs(): Map<string, HealthCheckConfig> {
    return new Map(this.healthChecks);
  }

  // ========================================================================
  // HEALTH CHECK MONITORING
  // ========================================================================

  startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        const healthStatus = await this.getHealthStatus();

        // Log health status
        console.log(`Health Status: ${healthStatus.status}`, {
          timestamp: healthStatus.timestamp,
          uptime: healthStatus.uptime,
          checks: Object.keys(healthStatus.checks).length
        });

        // Store last check results
        Object.entries(healthStatus.checks).forEach(([name, result]) => {
          this.lastCheckResults.set(name, result);
        });

      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  getLastCheckResults(): Map<string, HealthIndicatorResult> {
    return new Map(this.lastCheckResults);
  }

  // ========================================================================
  // HEALTH CHECK ENDPOINTS
  // ========================================================================

  async getLivenessProbe(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    };
  }

  async getReadinessProbe(): Promise<{ status: string; timestamp: string; checks: string[] }> {
    const criticalChecks = Array.from(this.healthChecks.entries())
      .filter(([_, config]) => config.critical)
      .map(([name, _]) => name);

    const failedChecks: string[] = [];

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

  async getStartupProbe(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const uptime = Date.now() - this.startTime.getTime();
    const isStarted = uptime > 10000; // Consider started after 10 seconds

    return {
      status: isStarted ? 'started' : 'starting',
      timestamp: new Date().toISOString(),
      uptime
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const healthService = HealthService.getInstance();
