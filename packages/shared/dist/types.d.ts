export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TenantEntity extends BaseEntity {
    orgId: string;
}
export interface TokenPayload {
    userId: string;
    orgId: string;
    roles: string[];
    permissions: string[];
    exp: number;
}
export interface AuthenticatedRequest {
    user: TokenPayload;
}
export interface MetricValue {
    value: number;
    timestamp: number;
    labels?: Record<string, string>;
}
export interface Metric {
    name: string;
    type: 'counter' | 'gauge' | 'histogram';
    description: string;
    values: MetricValue[];
    maxValues: number;
    alerts?: {
        warning?: number;
        critical?: number;
    };
}
export interface AIMetrics {
    tokens: number;
    cost: number;
    latency: number;
    model: string;
    success: boolean;
}
export interface LogContext {
    org?: string;
    orgTier?: string;
    orgFeatures?: string[];
    userId?: string;
    userRole?: string;
    userPermissions?: string[];
    requestId?: string;
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    endpoint?: string;
    method?: string;
    path?: string;
    query?: Record<string, unknown>;
    duration?: number;
    startTime?: number;
    endTime?: number;
    tokens?: number;
    cost?: number;
    aiModel?: string;
    aiProvider?: string;
    promptTokens?: number;
    completionTokens?: number;
    userAgent?: string;
    ip?: string;
    statusCode?: number;
    error?: string;
    stack?: string;
    port?: number;
    environment?: string;
    version?: string;
}
export interface CacheConfig {
    ttl?: number;
    prefix?: string;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    errors: number;
}
export interface AIServiceConfig {
    endpoint?: string;
    apiKey?: string;
    apiVersion?: string;
    defaultModel?: string;
}
export interface CompletionRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    orgId: string;
}
export interface HealthCheck {
    status: 'ok' | 'error' | 'degraded';
    checks: {
        [key: string]: {
            status: 'ok' | 'error';
            message?: string;
            latency?: number;
        };
    };
    timestamp: string;
}
//# sourceMappingURL=types.d.ts.map