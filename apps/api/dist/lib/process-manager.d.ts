export interface ShutdownConfig {
    timeout: number;
    signals: string[];
    cleanupTasks: Array<{
        name: string;
        task: () => Promise<void>;
        timeout: number;
        critical: boolean;
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
export declare class ProcessManager {
    private static instance;
    private config;
    private isShuttingDown;
    private startTime;
    private shutdownPromise;
    private signalHandlers;
    constructor(config?: Partial<ShutdownConfig>);
    static getInstance(config?: Partial<ShutdownConfig>): ProcessManager;
    private initializeDefaultCleanupTasks;
    private setupSignalHandlers;
    private setupProcessMonitoring;
    gracefulShutdown(signal: string): Promise<void>;
    private performShutdown;
    private executeCleanupTasks;
    private emergencyShutdown;
    getProcessInfo(): ProcessInfo;
    getProcessHealth(): {
        status: 'healthy' | 'unhealthy' | 'degraded';
        info: ProcessInfo;
        issues: string[];
    };
    addCleanupTask(task: {
        name: string;
        task: () => Promise<void>;
        timeout: number;
        critical: boolean;
    }): void;
    removeCleanupTask(name: string): boolean;
    updateConfig(newConfig: Partial<ShutdownConfig>): void;
    isShuttingDownProcess(): boolean;
    getShutdownPromise(): Promise<void> | null;
    shutdown(reason?: string): Promise<void>;
    restart(reason?: string): Promise<void>;
    getProcessStats(): {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
        eventLoopLag: number;
        activeHandles: number;
        activeRequests: number;
        isShuttingDown: boolean;
        cleanupTasks: number;
    };
}
export declare const processManager: ProcessManager;
//# sourceMappingURL=process-manager.d.ts.map