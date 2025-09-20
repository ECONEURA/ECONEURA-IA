import { Request, Response, NextFunction } from 'express';
interface GatewayConfig {
    enableCaching: boolean;
    cacheTTL: number;
    enableMetrics: boolean;
    enableCircuitBreaker: boolean;
    circuitBreakerThreshold: number;
    enableLoadBalancing: boolean;
    maxRetries: number;
    timeout: number;
}
interface RouteConfig {
    path: string;
    method: string;
    service: string;
    version: string;
    requiresAuth: boolean;
    rateLimit?: number;
    timeout?: number;
    circuitBreaker?: boolean;
}
interface ServiceHealth {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    lastCheck: number;
    errorRate: number;
}
interface CircuitBreakerState {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
    nextAttempt: number;
}
export declare class ApiGatewayService {
    private config;
    private routes;
    private serviceHealth;
    private circuitBreakers;
    private db;
    constructor(config?: Partial<GatewayConfig>);
    private initializeRoutes;
    private addRoute;
    gatewayMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private startHealthChecks;
    private performHealthChecks;
    private checkServiceHealth;
    private checkAuthServiceHealth;
    private checkUsersServiceHealth;
    private checkCompaniesServiceHealth;
    private checkContactsServiceHealth;
    private checkProductsServiceHealth;
    private checkInvoicesServiceHealth;
    private checkAIServiceHealth;
    private checkAnalyticsServiceHealth;
    private checkMetricsServiceHealth;
    private isCircuitBreakerOpen;
    recordServiceFailure(service: string): void;
    recordServiceSuccess(service: string): void;
    private generateRequestId;
    getServiceHealth(): Map<string, ServiceHealth>;
    getCircuitBreakerStatus(): Map<string, CircuitBreakerState>;
    getRouteConfig(path: string, method: string): RouteConfig | undefined;
}
declare global {
    namespace Express {
        interface Request {
            routeConfig?: RouteConfig;
            requestId?: string;
        }
    }
}
export declare const apiGatewayService: ApiGatewayService;
export {};
//# sourceMappingURL=api-gateway.service.d.ts.map