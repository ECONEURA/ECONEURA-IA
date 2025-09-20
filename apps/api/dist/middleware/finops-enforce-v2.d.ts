import { Request, Response, NextFunction } from 'express';
export interface CostEstimate {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costPerInputToken: number;
    costPerOutputToken: number;
}
export interface BudgetLimits {
    dailyLimitEUR: number;
    monthlyLimitEUR: number;
    perRequestLimitEUR: number;
    warningThreshold: number;
    criticalThreshold: number;
    emergencyThreshold: number;
}
export interface CostStatus {
    orgId: string;
    currentDaily: number;
    currentMonthly: number;
    limits: BudgetLimits;
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    killSwitchActive: boolean;
    lastUpdated: Date;
}
export interface BudgetExceededEvent {
    type: 'BUDGET_EXCEEDED';
    orgId: string;
    currentCost: number;
    limit: number;
    period: 'daily' | 'monthly' | 'per_request';
    provider?: string;
    model?: string;
    route: string;
    correlationId: string;
    timestamp: Date;
    killSwitchActivated: boolean;
}
export interface FinOpsRequest extends Request {
    orgId?: string;
    userId?: string;
    correlationId?: string;
    costEstimate?: CostEstimate;
    startTime?: number;
}
export declare class CostCalculator {
    private static readonly COST_PER_TOKEN;
    static calculateCost(estimate: CostEstimate): number;
    static estimateFromRequest(req: FinOpsRequest): CostEstimate;
    static getCostPerToken(provider: string, model: string): {
        input: number;
        output: number;
    };
}
export declare class BudgetManager {
    private static instance;
    private costStatus;
    private killSwitches;
    private eventListeners;
    static getInstance(): BudgetManager;
    getCostStatus(orgId: string): Promise<CostStatus>;
    updateCost(orgId: string, cost: number): Promise<CostStatus>;
    validateRequest(orgId: string, cost: number): Promise<{
        allowed: boolean;
        status: CostStatus;
        exceededLimit?: 'daily' | 'monthly' | 'per_request';
    }>;
    activateKillSwitch(orgId: string): void;
    resetKillSwitch(orgId: string): void;
    isKillSwitchActive(orgId: string): boolean;
    onBudgetExceeded(listener: (event: BudgetExceededEvent) => void): void;
    private emitBudgetExceeded;
    setBudgetLimits(orgId: string, limits: Partial<BudgetLimits>): Promise<void>;
}
export declare class FinOpsEnforcementMiddleware {
    private budgetManager;
    constructor();
    private setupEventHandlers;
    private emitBudgetExceededEvent;
    enforce: (req: FinOpsRequest, res: Response, next: NextFunction) => Promise<void>;
    private isAIEndpoint;
    private setBudgetHeaders;
    private calculateBudgetPercentage;
    getCostStatus(orgId: string): Promise<CostStatus>;
    setBudgetLimits(orgId: string, limits: Partial<BudgetLimits>): Promise<void>;
    resetKillSwitch(orgId: string): void;
    isKillSwitchActive(orgId: string): boolean;
}
export declare const finOpsEnforcement: FinOpsEnforcementMiddleware;
export declare const finOpsEnforce: (req: FinOpsRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=finops-enforce-v2.d.ts.map