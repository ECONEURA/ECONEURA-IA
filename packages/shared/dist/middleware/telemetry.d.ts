import { Request, Response, NextFunction } from 'express';
interface TelemetryRequest extends Request {
    startTime?: number;
    correlationId?: string;
}
export declare function telemetryMiddleware(req: TelemetryRequest, res: Response, next: NextFunction): void;
export declare function costTrackingMiddleware(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=telemetry.d.ts.map