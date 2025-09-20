import { Request, Response, NextFunction } from 'express';
export declare class ObservabilityService {
    constructor();
    requestObservability(): (req: Request, res: Response, next: NextFunction) => void;
    degradationCheck(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private checkSystemHealth;
    private checkMemoryUsage;
    private checkCPUUsage;
    private checkErrorRate;
    private checkAIQuota;
    private generateRequestId;
}
//# sourceMappingURL=observability.d.ts.map