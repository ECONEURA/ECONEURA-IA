export interface SystemHealthData {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
    services: ServiceStatus[];
    metrics: SystemMetrics;
    alerts: Alert[];
    lastUpdate: Date;
}
export interface ServiceStatus {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: Date;
    errorRate: number;
    throughput: number;
    details?: any;
}
export interface SystemMetrics {
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
    };
    database: {
        connections: number;
        maxConnections: number;
        queryTime: number;
    };
    cache: {
        hitRate: number;
        memoryUsage: number;
        operations: number;
    };
}
export interface Alert {
    id: string;
    type: 'error' | 'warning' | 'info';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    service: string;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
}
export declare class SystemHealthService {
    private healthData;
    private monitoringInterval;
    private isMonitoring;
    constructor();
    getOverallHealth(): Promise<SystemHealthData>;
    checkServiceHealth(serviceName: string): Promise<ServiceStatus>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getActiveAlerts(): Promise<Alert[]>;
    private checkAllServices;
    private checkDatabaseHealth;
    private checkRedisHealth;
    private checkAPIHealth;
    private checkMonitoringHealth;
    private getDatabaseMetrics;
    private getCacheMetrics;
    private calculateCPUUsage;
    private getLoadAverage;
    private calculateOverallStatus;
    private startHealthMonitoring;
    stopHealthMonitoring(): void;
    getCurrentHealthData(): SystemHealthData | null;
    isMonitoringActive(): boolean;
    resolveAlert(alertId: string): Promise<void>;
}
export declare const systemHealthService: SystemHealthService;
//# sourceMappingURL=system-health.service.d.ts.map