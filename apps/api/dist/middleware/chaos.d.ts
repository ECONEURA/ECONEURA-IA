import { Request, Response, NextFunction } from 'express';
interface ChaosConfig {
    enabled: boolean;
    faultRate: number;
    latencyMs: {
        min: number;
        max: number;
        probability: number;
    };
    error: {
        probability: number;
        statusCodes: number[];
    };
    onlyPaths?: RegExp[];
    skipPaths?: RegExp[];
}
export declare function chaosMiddleware(config?: Partial<ChaosConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function createChaosToggleEndpoints(app: any): void;
export {};
//# sourceMappingURL=chaos.d.ts.map