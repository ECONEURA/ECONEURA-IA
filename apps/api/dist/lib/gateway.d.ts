export interface ServiceEndpoint {
    id: string;
    name: string;
    url: string;
    health: string;
    weight: number;
    maxConnections: number;
    currentConnections: number;
    responseTime: number;
    errorRate: number;
    lastHealthCheck: Date;
    isActive: boolean;
}
export interface RouteRule {
    id: string;
    name: string;
    path: string;
    method: string;
    serviceId: string;
    priority: number;
    conditions: RouteCondition[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RouteCondition {
    type: 'header' | 'query' | 'body' | 'ip' | 'user-agent';
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
    value: string;
}
export interface LoadBalancerConfig {
    strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'response-time';
    healthCheckInterval: number;
    healthCheckTimeout: number;
    maxRetries: number;
    circuitBreakerThreshold: number;
}
export interface GatewayStats {
    totalRequests: number;
    activeConnections: number;
    averageResponseTime: number;
    errorRate: number;
    servicesCount: number;
    routesCount: number;
}
export declare class APIGateway {
    private services;
    private routes;
    private loadBalancerConfig;
    private currentIndex;
    private requestCounts;
    private responseTimes;
    private errorCounts;
    constructor(config: LoadBalancerConfig);
    addService(service: Omit<ServiceEndpoint, 'id' | 'lastHealthCheck' | 'currentConnections' | 'responseTime' | 'errorRate'>): string;
    removeService(serviceId: string): boolean;
    getService(serviceId: string): ServiceEndpoint | undefined;
    getAllServices(): ServiceEndpoint[];
    addRoute(routeData: Omit<RouteRule, 'id' | 'createdAt' | 'updatedAt'>): string;
    removeRoute(routeId: string): boolean;
    getRoute(routeId: string): RouteRule | undefined;
    getAllRoutes(): RouteRule[];
    findRoute(path: string, method: string, headers?: Record<string, string>, query?: Record<string, string>): RouteRule | null;
    selectService(serviceIds: string[], clientIp?: string): ServiceEndpoint | null;
    private roundRobinSelection;
    private leastConnectionsSelection;
    private weightedSelection;
    private ipHashSelection;
    private responseTimeSelection;
    private startHealthChecks;
    private checkServiceHealth;
    private matchesPath;
    private matchesConditions;
    recordRequest(serviceId: string, responseTime: number, success: boolean): void;
    getStats(): GatewayStats;
    private initializeDefaultServices;
    private initializeDefaultRoutes;
}
export declare const apiGateway: APIGateway;
//# sourceMappingURL=gateway.d.ts.map