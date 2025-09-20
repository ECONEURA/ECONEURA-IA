export type SystemMode = 'live' | 'ready' | 'degraded';
export interface HealthStatus {
    status: 'ok' | 'warning' | 'error';
    mode: SystemMode;
    timestamp: string;
    version: string;
    checks: {
        database?: {
            status: 'ok' | 'error';
            latency?: number;
        };
        cache?: {
            status: 'ok' | 'error';
            hitRate?: number;
        };
        external?: {
            status: 'ok' | 'error';
            services?: string[];
        };
        memory?: {
            status: 'ok' | 'warning' | 'error';
            usage?: number;
        };
        disk?: {
            status: 'ok' | 'warning' | 'error';
            usage?: number;
        };
    };
    degradedReason?: string;
}
declare class HealthModeManager {
    private currentMode;
    private lastCheck;
    private degradedReason?;
    getCurrentMode(): SystemMode;
    getDegradedReason(): string | undefined;
    getLivenessProbe(): Promise<HealthStatus>;
    getReadinessProbe(): Promise<HealthStatus>;
    getDetailedHealth(): Promise<HealthStatus>;
    forceDegradedMode(reason: string): void;
    restoreNormalMode(): void;
}
export declare const healthModeManager: HealthModeManager;
export {};
//# sourceMappingURL=health-modes.d.ts.map