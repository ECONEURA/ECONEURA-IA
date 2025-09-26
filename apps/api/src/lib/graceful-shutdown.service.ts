import { EventEmitter } from 'events';


export interface ShutdownConfig {
  timeout: number;
  signals: string[];
  cleanupTasks: Array<() => Promise<void>>;
}

export class GracefulShutdownService extends EventEmitter {
  private config: ShutdownConfig;
  private isShuttingDown = false;
  private cleanupTasks: Array<() => Promise<void>> = [];

  constructor(config: ShutdownConfig) {
    super();
    this.config = config;
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    this.config.signals.forEach(signal => {
      process.on(signal, () => this.shutdown(signal));
    });
  }

  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    
    
    try {
      // Execute cleanup tasks
      for (const task of this.cleanupTasks) {
        await Promise.race([
          task(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cleanup timeout')), this.config.timeout)
          )
        ]);
      }
      
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  addCleanupTask(task: () => Promise<void>): void {
    this.cleanupTasks.push(task);
  }
}

export const gracefulShutdownService = new GracefulShutdownService({
  timeout: 30000,
  signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
  cleanupTasks: []
});
