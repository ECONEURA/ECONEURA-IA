export interface APIRoute {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    target: string;
    version: string;
    enabled: boolean;
    rateLimit: RateLimitConfig;
    cache: CacheConfig;
    circuitBreaker: CircuitBreakerConfig;
    transformation?: TransformationConfig;
}
export interface RateLimitConfig {
    requests: number;
    window: number;
    burst: number;
    adaptive: boolean;
    perUser: boolean;
    perOrganization: boolean;
    skipSuccessfulRequests: boolean;
}
export interface CacheConfig {
    enabled: boolean;
    ttl: number;
    key: string;
    vary: string[];
    headers: string[];
}
export interface CircuitBreakerConfig {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    halfOpenMaxCalls: number;
}
export interface TransformationConfig {
    request: {
        headers?: Record<string, string>;
        body?: any;
        query?: Record<string, string>;
    };
    response: {
        headers?: Record<string, string>;
        body?: any;
    };
}
export interface APIMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
    activeConnections: number;
    cacheHitRate: number;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}
export interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime?: Date;
    nextAttemptTime?: Date;
}
export declare class APIGatewayEnhancedService {
    private static instance;
    private routes;
    private rateLimitStore;
    private circuitBreakerStates;
    private metrics;
    private cache;
    private db;
    private cleanupInterval;
    constructor();
    static getInstance(): APIGatewayEnhancedService;
    private initializeDefaultRoutes;
    private initializeMetrics;
    private initializeCircuitBreaker;
    private startCleanup;
    private cleanupExpiredData;
    processRequest(path: string, method: string, headers: Record<string, string>, body?: any, userId?: string, organizationId?: string): Promise<{
        allowed: boolean;
        rateLimitInfo?: RateLimitInfo;
        circuitBreakerState?: CircuitBreakerState;
        cacheHit?: boolean;
        cachedResponse?: any;
        route?: APIRoute;
        error?: string;
    }>;
    private findMatchingRoute;
    private pathMatches;
    private checkRateLimit;
    private generateCacheKey;
    private updateCacheHitRate;
    private updateMetrics;
    recordResponse(routeId: string, success: boolean, responseTime: number, responseData?: any): Promise<void>;
    private recordCircuitBreakerFailure;
    private recordCircuitBreakerSuccess;
    private cacheResponse;
    getRoutes(): Promise<APIRoute[]>;
    getMetrics(routeId?: string): Promise<APIMetrics | Map<string, APIMetrics>>;
    getCircuitBreakerStates(): Promise<Map<string, CircuitBreakerState>>;
    getRateLimitInfo(routeId: string, userId?: string, organizationId?: string): Promise<RateLimitInfo | null>;
    addRoute(route: APIRoute): Promise<boolean>;
    updateRoute(routeId: string, updates: Partial<APIRoute>): Promise<boolean>;
    removeRoute(routeId: string): Promise<boolean>;
    getHealthStatus(): Promise<{
        status: string;
        details: any;
    }>;
    destroy(): void;
}
export declare const apiGatewayEnhanced: APIGatewayEnhancedService;
//# sourceMappingURL=api-gateway-enhanced.service.d.ts.map