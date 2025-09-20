export interface PoolConfig {
    enabled: boolean;
    maxConnections: number;
    minConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
    acquireTimeout: number;
    healthCheckInterval: number;
    retryAttempts: number;
    retryDelay: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
    loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted';
}
export interface ConnectionMetrics {
    total: number;
    active: number;
    idle: number;
    waiting: number;
    created: number;
    destroyed: number;
    failed: number;
    avgAcquireTime: number;
    avgResponseTime: number;
    healthCheckPassed: number;
    healthCheckFailed: number;
    circuitBreakerOpen: number;
    loadBalanced: number;
}
export interface Connection {
    id: string;
    type: 'postgres' | 'redis' | 'http' | 'external';
    host: string;
    port: number;
    database?: string;
    status: 'idle' | 'active' | 'failed' | 'destroyed';
    createdAt: number;
    lastUsed: number;
    responseTime: number;
    errorCount: number;
    healthStatus: 'healthy' | 'unhealthy' | 'unknown';
    metadata?: Record<string, any>;
}
export interface PoolStats {
    name: string;
    type: string;
    config: PoolConfig;
    metrics: ConnectionMetrics;
    connections: Connection[];
    healthStatus: 'healthy' | 'degraded' | 'critical';
    lastHealthCheck: number;
    circuitBreakerStatus: 'closed' | 'open' | 'half-open';
}
export interface HealthCheckResult {
    connectionId: string;
    success: boolean;
    responseTime: number;
    error?: string;
    timestamp: number;
}
export interface LoadBalanceResult {
    connectionId: string;
    strategy: string;
    weight: number;
    connectionsCount: number;
    timestamp: number;
}
export declare class ConnectionPoolService {
    private pools;
    private healthCheckIntervals;
    private circuitBreakers;
    private loadBalancers;
    private isMonitoring;
    private monitoringInterval;
    constructor();
    private initializeDefaultPools;
    createPool(name: string, type: string, config: PoolConfig): void;
    private initializeConnections;
    private createConnection;
    acquireConnection(poolName: string, timeout?: number): Promise<Connection | null>;
    releaseConnection(poolName: string, connectionId: string): Promise<void>;
    private destroyConnection;
    private startHealthChecks;
    private performHealthCheck;
    private checkConnectionHealth;
    loadBalance(poolName: string): Connection | null;
    private startMonitoring;
    private updateMetrics;
    private cleanupIdleConnections;
    private findIdleConnection;
    private waitForConnection;
    private shouldDestroyConnection;
    private isCircuitBreakerOpen;
    private recordCircuitBreakerFailure;
    private roundRobinSelection;
    private leastConnectionsSelection;
    private weightedSelection;
    private getDefaultHost;
    private getDefaultPort;
    private getPoolConfig;
    private simulateConnectionCreation;
    private simulateConnectionDestruction;
    private simulateHealthCheck;
    private updatePrometheusMetrics;
    getStats(): Map<string, PoolStats>;
    getPoolStats(poolName: string): PoolStats | null;
    updatePoolConfig(poolName: string, config: Partial<PoolConfig>): void;
    stop(): void;
}
export declare const connectionPoolService: ConnectionPoolService;
//# sourceMappingURL=connection-pool.service.d.ts.map