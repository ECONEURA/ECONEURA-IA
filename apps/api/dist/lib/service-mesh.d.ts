import { LoadBalancingStrategy } from './service-discovery.js';
export interface ServiceMeshConfig {
    timeout: number;
    retries: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
    loadBalancingStrategy: LoadBalancingStrategy;
    enableTracing: boolean;
    enableMetrics: boolean;
}
export interface ServiceRequest {
    serviceName: string;
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
}
export interface ServiceResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
    duration: number;
}
export interface CircuitBreaker {
    serviceName: string;
    failureCount: number;
    lastFailureTime: Date;
    state: 'closed' | 'open' | 'half-open';
    threshold: number;
    timeout: number;
}
export interface ServiceMeshStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    circuitBreakers: CircuitBreaker[];
}
export declare class ServiceMesh {
    private config;
    private circuitBreakers;
    private requestStats;
    constructor(config: ServiceMeshConfig);
    request(request: ServiceRequest): Promise<ServiceResponse>;
    private executeRequest;
    private retryRequest;
    private isCircuitBreakerOpen;
    private recordSuccess;
    private recordFailure;
    private shouldRetry;
    getStats(): ServiceMeshStats;
    getServiceStats(serviceName: string): {
        total: number;
        success: number;
        failed: number;
        responseTimes: number[];
    };
    getCircuitBreaker(serviceName: string): CircuitBreaker | undefined;
    resetCircuitBreaker(serviceName: string): boolean;
}
export declare const serviceMesh: ServiceMesh;
//# sourceMappingURL=service-mesh.d.ts.map