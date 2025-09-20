import { EventEmitter } from 'events';
export class GracefulShutdownService extends EventEmitter {
    config;
    isShuttingDown = false;
    cleanupTasks = [];
    constructor(config) {
        super();
        this.config = config;
        this.setupSignalHandlers();
    }
    setupSignalHandlers() {
        this.config.signals.forEach(signal => {
            process.on(signal, () => this.shutdown(signal));
        });
    }
    async shutdown(signal) {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        try {
            for (const task of this.cleanupTasks) {
                await Promise.race([
                    task(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), this.config.timeout))
                ]);
            }
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
    addCleanupTask(task) {
        this.cleanupTasks.push(task);
    }
}
export const gracefulShutdownService = new GracefulShutdownService({
    timeout: 30000,
    signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
    cleanupTasks: []
});
//# sourceMappingURL=graceful-shutdown.service.js.map