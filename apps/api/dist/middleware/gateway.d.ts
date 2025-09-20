import { Request, Response, NextFunction } from 'express';
export interface GatewayRequest extends Request {
    gatewayInfo?: {
        routeId?: string;
        serviceId?: string;
        serviceUrl?: string;
        loadBalancerStrategy?: string;
        startTime?: number;
    };
}
export declare function gatewayRoutingMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void;
export declare function gatewayProxyMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void;
export declare function gatewayMetricsMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void;
export declare function gatewayCircuitBreakerMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=gateway.d.ts.map