import { Gauge, Counter, Histogram, Registry } from 'prom-client';
export declare const registry: Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpMetrics: {
    requestDuration: Histogram<"method" | "route" | "status_code">;
    requestsTotal: Counter<"method" | "route" | "status_code">;
    requestSizeBytes: Histogram<"method" | "route">;
    responseSizeBytes: Histogram<"method" | "route">;
};
export declare const dbMetrics: {
    queryDuration: Histogram<"operation" | "table">;
    connectionPool: Gauge<"state">;
    errors: Counter<"operation" | "error_type">;
};
export declare const cacheMetrics: {
    hitRatio: Gauge<string>;
    size: Gauge<string>;
    operations: Counter<"operation">;
};
export declare const aiMetrics: {
    requestDuration: Histogram<"model" | "operation">;
    tokensUsed: Counter<"type" | "model">;
    cost: Counter<"model">;
    errors: Counter<"model" | "error_type">;
};
export declare const systemMetrics: {
    memory: Gauge<"type">;
    cpuUsage: Gauge<string>;
    eventLoop: Histogram<string>;
};
//# sourceMappingURL=metrics.d.ts.map