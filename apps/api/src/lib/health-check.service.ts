import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface HealthCheckConfig {
  name: string;
  type: 'liveness' | 'readiness' | 'startup';
  timeout: number;
  interval: number;
  retries: number;
  critical: boolean;
  dependencies?: string[];
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  timestamp: new Date().toISOString(),
  duration: number;
  metadata?: Record<string, any>;
  dependencies?: HealthCheckResult[];
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  timestamp: new Date().toISOString(),
  uptime: number;
  version: string;
  environment: string;
}

export class HealthCheckService extends EventEmitter {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private startTime = Date.now();

  constructor() {
    super();
    this.setupMetrics();
  }

  private setupMetrics() {
    // Health check metrics
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

  /**
   * Register a health check
   */
  registerCheck(
    name: string,
    config: HealthCheckConfig,
    checkFunction: () => Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; message: string; metadata?: Record<string, any> }>
  ): void {
    this.checks.set(name, config);

    // Store the check function
    (this as any)[`check_${name}`] = checkFunction;

    // Start the check if service is running
    if (this.isRunning) {
      this.startCheck(name);
    }
  }

  /**
   * Start all health checks
   */
  async start(): Promise<void> {
    this.isRunning = true;
    this.startTime = Date.now();

    // Start all registered checks
    for (const [name] of this.checks) {
      this.startCheck(name);
    }

    console.log('🏥 Health Check Service started');
  }

  /**
   * Stop all health checks
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    // Clear all timers
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();

    console.log('🏥 Health Check Service stopped');
  }

  private startCheck(name: string): void {
    const config = this.checks.get(name);
    if (!config) return;

    const timer = setInterval(async () => {
      await this.runCheck(name);
    }, config.interval);

    this.timers.set(name, timer);

    // Run initial check
    this.runCheck(name);
  }

  private async runCheck(name: string): Promise<void> {
    const config = this.checks.get(name);
    if (!config) return;

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Check dependencies first
      const dependencyResults: HealthCheckResult[] = [];
      if (config.dependencies) {
        for (const depName of config.dependencies) {
          const depResult = this.results.get(depName);
          if (depResult) {
            dependencyResults.push(depResult);
          }
        }
      }

      // Run the actual check
      const checkFunction = (this as any)[`check_${name}`];
      if (!checkFunction) {
        throw new Error(`Check function not found for ${name}`);
      }

      const checkResult = await Promise.race([
        checkFunction(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Check timeout')), config.timeout)
        )
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

      // Update metrics
      this.updateMetrics(name, config.type, result.status, duration);

    } catch (error) {
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

      // Update metrics
      this.updateMetrics(name, config.type, 'unhealthy', duration);
      prometheus.register.getSingleMetric('health_check_failures_total')?.inc({
        check_name: name,
        check_type: config.type,
        reason: 'check_failed'
      });
    }

    this.results.set(name, result);
    this.emit('check_completed', result);

    // Emit specific events based on status
    if (result.status === 'unhealthy') {
      this.emit('check_failed', result);
    } else if (result.status === 'degraded') {
      this.emit('check_degraded', result);
    }
  }

  private updateMetrics(name: string, type: string, status: string, duration: number): void {
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

  /**
   * Get health check result
   */
  getCheckResult(name: string): HealthCheckResult | null {
    return this.results.get(name) || null;
  }

  /**
   * Get all health check results
   */
  getAllResults(): Map<string, HealthCheckResult> {
    return new Map(this.results);
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const checks = Array.from(this.results.values());

    // Determine overall status
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    const criticalChecks = checks.filter(check => {
      const config = this.checks.get(check.name);
      return config?.critical;
    });

    if (criticalChecks.some(check => check.status === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (checks.some(check => check.status === 'degraded')) {
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

  /**
   * Run a specific check manually
   */
  async runCheckManually(name: string): Promise<HealthCheckResult> {
    await this.runCheck(name);
    return this.results.get(name)!;
  }

  /**
   * Run all checks manually
   */
  async runAllChecks(): Promise<HealthCheckResult[]> {
    const promises = Array.from(this.checks.keys()).map(name => this.runCheck(name));
    await Promise.all(promises);
    return Array.from(this.results.values());
  }

  /**
   * Get liveness status
   */
  getLivenessStatus(): { status: 'alive' | 'dead'; message: string } {
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

  /**
   * Get readiness status
   */
  getReadinessStatus(): { status: 'ready' | 'not_ready'; message: string } {
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

// Singleton instance
export const healthCheckService = new HealthCheckService();
