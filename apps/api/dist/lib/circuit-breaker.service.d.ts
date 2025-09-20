import { EventEmitter } from 'events';
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    halfOpenMaxCalls: number;
}
export interface CircuitBreakerState {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
    successCount: number;
    totalCalls: number;
}
export declare class CircuitBreakerService extends EventEmitter {
    private circuits;
    private configs;
    private timers;
    constructor();
    private setupMetrics;
    registerCircuit(name: string, config: CircuitBreakerConfig): void;
    execute<T>(circuitName: string, operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
    private recordSuccess;
    private recordFailure;
    private updateStateMetric;
    private startMonitoring;
    private monitorCircuit;
    getState(circuitName: string): CircuitBreakerState | null;
    getAllStates(): Map<string, CircuitBreakerState>;
    reset(circuitName: string): void;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare const circuitBreakerService: CircuitBreakerService;
//# sourceMappingURL=circuit-breaker.service.d.ts.map