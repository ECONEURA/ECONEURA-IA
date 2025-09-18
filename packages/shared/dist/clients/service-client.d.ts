export interface ServiceClientConfig {
    serviceType: 'api' | 'workers' | 'web' | 'db';
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    circuitBreakerThreshold?: number;
    loadBalancing?: 'round-robin' | 'random' | 'least-connections';
}
export interface ServiceRequest {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
}
export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    serviceId: string;
    responseTime: number;
    retries: number;
}
export declare class ServiceClient {
    private config;
    private axiosInstances;
    private roundRobinIndex;
    private connectionCounts;
    private circuitBreakers;
    constructor(config: ServiceClientConfig);
    request<T = any>(request: ServiceRequest): Promise<ServiceResponse<T>>;
    private selectService;
    private selectRoundRobin;
    private selectRandom;
    private selectLeastConnections;
    private makeRequest;
    private getAxiosInstance;
    private isCircuitBreakerOpen;
    private recordFailure;
    private resetCircuitBreaker;
    private incrementConnectionCount;
    private decrementConnectionCount;
    private generateRequestId;
    private delay;
    getStats(): {
        serviceType: string;
        availableServices: number;
        circuitBreakers: Record<string, any>;
        connectionCounts: Record<string, number>;
    };
}
export declare function createServiceClient(config: ServiceClientConfig): ServiceClient;
//# sourceMappingURL=service-client.d.ts.map