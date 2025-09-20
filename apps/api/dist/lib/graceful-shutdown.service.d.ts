import { EventEmitter } from 'events';
export interface ShutdownConfig {
    timeout: number;
    signals: string[];
    cleanupTasks: Array<() => Promise<void>>;
}
export declare class GracefulShutdownService extends EventEmitter {
    private config;
    private isShuttingDown;
    private cleanupTasks;
    constructor(config: ShutdownConfig);
    private setupSignalHandlers;
    shutdown(signal: string): Promise<void>;
    addCleanupTask(task: () => Promise<void>): void;
}
export declare const gracefulShutdownService: GracefulShutdownService;
//# sourceMappingURL=graceful-shutdown.service.d.ts.map