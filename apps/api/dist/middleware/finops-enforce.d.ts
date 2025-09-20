import { Request, Response, NextFunction } from 'express';
interface FinOpsRequest extends Request {
    orgId?: string;
    estimatedCost?: number;
    provider?: string;
    model?: string;
}
export declare class FinOpsEnforcementMiddleware {
    private costGuardrails;
    private killSwitch;
    private alertThresholds;
    constructor();
    private setupEventHandlers;
    private handleCostAlert;
    private activateKillSwitch;
    private isKillSwitchActive;
    private createBudgetExceededResponse;
    enforce: (req: FinOpsRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    private estimateRequestCost;
    getCostStatus(orgId: string): Promise<{
        orgId: string;
        limits: any;
        current: {
            daily: any;
            monthly: any;
        };
        killSwitchActive: boolean;
        status: "warning" | "healthy" | "critical" | "emergency";
    }>;
    private getCostStatusLevel;
    resetKillSwitch(orgId: string): void;
}
export declare const finOpsEnforcement: FinOpsEnforcementMiddleware;
export declare const finOpsEnforce: (req: FinOpsRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=finops-enforce.d.ts.map