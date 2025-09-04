// Graceful Shutdown and Process Management for ECONEURA
import { structuredLogger } from './structured-logger.js';
import { databasePool } from './database-pool.js';
import { cacheManager } from './advanced-cache.js';
import { healthMonitor } from './health-monitor.js';

export interface ShutdownConfig {
  timeout: number; // Graceful shutdown timeout in milliseconds
  signals: string[]; // Signals to listen for
  cleanupTasks: Array<{
    name: string;
    task: () => Promise<void>;
    timeout: number;
    critical: boolean; // If true, shutdown will fail if this task fails
  }>;
}

export interface ProcessInfo {
  pid: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  version: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  environment: string;
}

export class ProcessManager {
  private static instance: ProcessManager;
  private config: ShutdownConfig;
  private isShuttingDown: boolean = false;
  private startTime: Date = new Date();
  private shutdownPromise: Promise<void> | null = null;
  private signalHandlers: Map<string, () => void> = new Map();

  constructor(config: Partial<ShutdownConfig> = {}) {
    this.config = {
      timeout: config.timeout || 30000, // 30 seconds
      signals: config.signals || ['SIGTERM', 'SIGINT', 'SIGUSR2'],
      cleanupTasks: config.cleanupTasks || []
    };

    this.initializeDefaultCleanupTasks();
    this.setupSignalHandlers();
    this.setupProcessMonitoring();
  }

  static getInstance(config?: Partial<ShutdownConfig>): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager(config);
    }
    return ProcessManager.instance;
  }

  private initializeDefaultCleanupTasks(): void {
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
          // Health monitor cleanup if needed
        },
        timeout: 3000,
        critical: false
      },
      {
        name: 'active_connections',
        task: async () => {
          structuredLogger.info('Closing active connections', { operation: 'shutdown' });
          // Close any active HTTP connections, WebSocket connections, etc.
        },
        timeout: 5000,
        critical: false
      }
    ];
  }

  private setupSignalHandlers(): void {
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

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      structuredLogger.fatal('Uncaught exception', error, {
        operation: 'uncaught_exception',
        pid: process.pid
      });
      this.emergencyShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      structuredLogger.fatal('Unhandled promise rejection', new Error(String(reason)), {
        operation: 'unhandled_rejection',
        pid: process.pid,
        promise: promise.toString()
      });
      this.emergencyShutdown();
    });

    // Handle warnings
    process.on('warning', (warning) => {
      structuredLogger.warn('Process warning', {
        operation: 'process_warning',
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });
  }

  private setupProcessMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      if (memUsageMB > 500) { // 500MB threshold
        structuredLogger.warn('High memory usage detected', {
          operation: 'memory_monitoring',
          memoryUsageMB: memUsageMB.toFixed(2),
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        });
      }
    }, 60000); // Check every minute

    // Monitor event loop lag
    setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        
        if (lag > 100) { // 100ms threshold
          structuredLogger.warn('High event loop lag detected', {
            operation: 'event_loop_monitoring',
            lagMs: lag.toFixed(2)
          });
        }
      });
    }, 30000); // Check every 30 seconds
  }

  async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      structuredLogger.warn('Shutdown already in progress', {
        operation: 'graceful_shutdown',
        signal
      });
      return this.shutdownPromise!;
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

  private async performShutdown(): Promise<void> {
    const shutdownStartTime = Date.now();
    const timeoutPromise = new Promise<void>((_, reject) => {
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
    } catch (error) {
      const shutdownDuration = Date.now() - shutdownStartTime;
      structuredLogger.error('Graceful shutdown failed', error as Error, {
        operation: 'graceful_shutdown',
        duration: shutdownDuration
      });

      process.exit(1);
    }
  }

  private async executeCleanupTasks(): Promise<void> {
    const results: Array<{ name: string; success: boolean; duration: number; error?: string }> = [];

    for (const task of this.config.cleanupTasks) {
      const taskStartTime = Date.now();
      
      try {
        structuredLogger.info(`Executing cleanup task: ${task.name}`, {
          operation: 'cleanup_task',
          taskName: task.name
        });

        await Promise.race([
          task.task(),
          new Promise<void>((_, reject) => {
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
      } catch (error) {
        const duration = Date.now() - taskStartTime;
        const errorMessage = (error as Error).message;
        results.push({ name: task.name, success: false, duration, error: errorMessage });
        
        structuredLogger.error(`Cleanup task failed: ${task.name}`, error as Error, {
          operation: 'cleanup_task',
          taskName: task.name,
          duration
        });

        if (task.critical) {
          throw new Error(`Critical cleanup task failed: ${task.name} - ${errorMessage}`);
        }
      }
    }

    // Log cleanup summary
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

  private emergencyShutdown(): void {
    structuredLogger.fatal('Emergency shutdown initiated', new Error('Emergency shutdown'), {
      operation: 'emergency_shutdown',
      pid: process.pid
    });

    // Force exit after a short delay
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }

  // Process information
  getProcessInfo(): ProcessInfo {
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

  // Health check for process
  getProcessHealth(): {
    status: 'healthy' | 'unhealthy' | 'degraded';
    info: ProcessInfo;
    issues: string[];
  } {
    const info = this.getProcessInfo();
    const issues: string[] = [];
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Check memory usage
    const memUsageMB = info.memoryUsage.heapUsed / 1024 / 1024;
    if (memUsageMB > 1000) { // 1GB
      issues.push(`High memory usage: ${memUsageMB.toFixed(2)}MB`);
      status = 'unhealthy';
    } else if (memUsageMB > 500) { // 500MB
      issues.push(`Elevated memory usage: ${memUsageMB.toFixed(2)}MB`);
      status = 'degraded';
    }

    // Check uptime
    const uptimeHours = info.uptime / (1000 * 60 * 60);
    if (uptimeHours > 168) { // 7 days
      issues.push(`Long uptime: ${uptimeHours.toFixed(2)} hours`);
      if (status === 'healthy') status = 'degraded';
    }

    // Check if shutting down
    if (this.isShuttingDown) {
      issues.push('Process is shutting down');
      status = 'unhealthy';
    }

    return { status, info, issues };
  }

  // Add custom cleanup task
  addCleanupTask(task: {
    name: string;
    task: () => Promise<void>;
    timeout: number;
    critical: boolean;
  }): void {
    this.config.cleanupTasks.push(task);
    structuredLogger.info('Cleanup task added', {
      operation: 'cleanup_task_add',
      taskName: task.name,
      timeout: task.timeout,
      critical: task.critical
    });
  }

  // Remove cleanup task
  removeCleanupTask(name: string): boolean {
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

  // Update shutdown configuration
  updateConfig(newConfig: Partial<ShutdownConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Process manager configuration updated', {
      operation: 'config_update',
      config: this.config
    });
  }

  // Check if shutting down
  isShuttingDownProcess(): boolean {
    return this.isShuttingDown;
  }

  // Get shutdown promise
  getShutdownPromise(): Promise<void> | null {
    return this.shutdownPromise;
  }

  // Manual shutdown trigger
  async shutdown(reason: string = 'manual'): Promise<void> {
    structuredLogger.info('Manual shutdown triggered', {
      operation: 'manual_shutdown',
      reason
    });
    return this.gracefulShutdown('MANUAL');
  }

  // Restart process
  async restart(reason: string = 'manual'): Promise<void> {
    structuredLogger.info('Process restart triggered', {
      operation: 'process_restart',
      reason
    });

    // Perform graceful shutdown first
    await this.gracefulShutdown('RESTART');
    
    // Restart the process
    process.exit(0);
  }

  // Process statistics
  getProcessStats(): {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    eventLoopLag: number;
    activeHandles: number;
    activeRequests: number;
    isShuttingDown: boolean;
    cleanupTasks: number;
  } {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: Date.now() - this.startTime.getTime(),
      memoryUsage: memUsage,
      cpuUsage: cpuUsage,
      eventLoopLag: 0, // Would need to be measured
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
      isShuttingDown: this.isShuttingDown,
      cleanupTasks: this.config.cleanupTasks.length
    };
  }
}

// Global process manager instance
export const processManager = ProcessManager.getInstance();

// Export for easy access
export { ProcessManager };
