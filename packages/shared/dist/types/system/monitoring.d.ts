import { TenantEntity } from '../models/base.js';
export interface SystemMetrics {
    cpu: {
        usage: number;
        load: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
    };
}
export interface AppMetrics {
    requests: {
        total: number;
        success: number;
        failed: number;
        latency: {
            p50: number;
            p90: number;
            p99: number;
        };
    };
    database: {
        connections: number;
        queryTime: number;
    };
    cache: {
        hits: number;
        misses: number;
        size: number;
    };
    queue: {
        size: number;
        processed: number;
        failed: number;
    };
}
export interface ResourceUsage extends TenantEntity {
    period: 'hourly' | 'daily' | 'monthly';
    timestamp: Date;
    requests: number;
    bandwidth: number;
    computeUnits: number;
    storageGb: number;
    aiTokens: number;
    aiCalls: number;
    costEur: number;
}
export interface AlertConfig {
    name: string;
    description: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq';
    threshold: number;
    window: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
    notifications: {
        channels: string[];
        cooldown: string;
    };
}
export interface AlertEvent extends TenantEntity {
    configId: string;
    status: 'triggered' | 'resolved';
    severity: 'info' | 'warning' | 'error' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    message: string;
    metadata: Record<string, unknown>;
}
//# sourceMappingURL=monitoring.d.ts.map