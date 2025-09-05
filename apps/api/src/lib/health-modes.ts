import { structuredLogger } from './structured-logger.js';

export type SystemMode = 'live' | 'ready' | 'degraded';

export interface HealthStatus {
  status: 'ok' | 'warning' | 'error';
  mode: SystemMode;
  timestamp: string;
  version: string;
  checks: {
    database?: { status: 'ok' | 'error'; latency?: number };
    cache?: { status: 'ok' | 'error'; hitRate?: number };
    external?: { status: 'ok' | 'error'; services?: string[] };
    memory?: { status: 'ok' | 'warning' | 'error'; usage?: number };
    disk?: { status: 'ok' | 'warning' | 'error'; usage?: number };
  };
  degradedReason?: string;
}

class HealthModeManager {
  private currentMode: SystemMode = 'live';
  private lastCheck: Date = new Date();
  private degradedReason?: string;

  getCurrentMode(): SystemMode {
    return this.currentMode;
  }

  getDegradedReason(): string | undefined {
    return this.degradedReason;
  }

  // Liveness probe - básico, sin dependencias externas
  async getLivenessProbe(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Checks mínimos para liveness
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
      
      let memoryStatus: 'ok' | 'warning' | 'error' = 'ok';
      if (memoryUsageMB > 1000) memoryStatus = 'error';
      else if (memoryUsageMB > 500) memoryStatus = 'warning';

      const status: HealthStatus = {
        status: memoryStatus === 'error' ? 'error' : 'ok',
        mode: 'live',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          memory: {
            status: memoryStatus,
            usage: Math.round(memoryUsageMB)
          }
        }
      };

      const duration = Date.now() - startTime;
      
      structuredLogger.debug('Liveness probe completed', {
        duration,
        status: status.status,
        memoryUsage: memoryUsageMB
      });

      return status;
    } catch (error) {
      structuredLogger.error('Liveness probe failed', error as Error);
      
      return {
        status: 'error',
        mode: 'live',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {}
      };
    }
  }

  // Readiness probe - con dependencias externas
  async getReadinessProbe(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const checks: HealthStatus['checks'] = {};
      let overallStatus: 'ok' | 'warning' | 'error' = 'ok';
      let mode: SystemMode = 'ready';

      // Memory check
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
      
      let memoryStatus: 'ok' | 'warning' | 'error' = 'ok';
      if (memoryUsageMB > 1000) {
        memoryStatus = 'error';
        overallStatus = 'error';
        mode = 'degraded';
        this.degradedReason = 'High memory usage';
      } else if (memoryUsageMB > 500) {
        memoryStatus = 'warning';
        if (overallStatus !== 'error') overallStatus = 'warning';
      }

      checks.memory = {
        status: memoryStatus,
        usage: Math.round(memoryUsageMB)
      };

      // Database check (simulado)
      try {
        const dbStartTime = Date.now();
        // Simulate DB check
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        const dbLatency = Date.now() - dbStartTime;
        
        if (dbLatency > 100) {
          checks.database = { status: 'error', latency: dbLatency };
          overallStatus = 'error';
          mode = 'degraded';
          this.degradedReason = 'Database slow response';
        } else {
          checks.database = { status: 'ok', latency: dbLatency };
        }
      } catch (error) {
        checks.database = { status: 'error' };
        overallStatus = 'error';
        mode = 'degraded';
        this.degradedReason = 'Database unavailable';
      }

      // Cache check (simulado)
      const cacheHitRate = 0.85 + Math.random() * 0.1; // Simulate 85-95%
      checks.cache = {
        status: cacheHitRate > 0.8 ? 'ok' : 'error',
        hitRate: Math.round(cacheHitRate * 100) / 100
      };

      if (cacheHitRate <= 0.8 && overallStatus === 'ok') {
        overallStatus = 'warning';
      }

      // Update current mode
      this.currentMode = mode;
      this.lastCheck = new Date();

      const status: HealthStatus = {
        status: overallStatus,
        mode,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks,
        degradedReason: this.degradedReason
      };

      const duration = Date.now() - startTime;
      
      structuredLogger.info('Readiness probe completed', {
        duration,
        status: status.status,
        mode,
        degradedReason: this.degradedReason
      });

      return status;
    } catch (error) {
      structuredLogger.error('Readiness probe failed', error as Error);
      
      this.currentMode = 'degraded';
      this.degradedReason = 'Health check failed';
      
      return {
        status: 'error',
        mode: 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {},
        degradedReason: this.degradedReason
      };
    }
  }

  // Detailed health check
  async getDetailedHealth(): Promise<HealthStatus> {
    return this.getReadinessProbe();
  }

  // Force degraded mode (para testing)
  forceDegradedMode(reason: string): void {
    this.currentMode = 'degraded';
    this.degradedReason = reason;
    
    structuredLogger.warn('System forced into degraded mode', {
      reason,
      timestamp: new Date().toISOString()
    });
  }

  // Restore normal mode
  restoreNormalMode(): void {
    this.currentMode = 'live';
    this.degradedReason = undefined;
    
    structuredLogger.info('System restored to normal mode', {
      timestamp: new Date().toISOString()
    });
  }
}

export const healthModeManager = new HealthModeManager();