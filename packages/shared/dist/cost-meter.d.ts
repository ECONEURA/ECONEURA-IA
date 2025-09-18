import { z } from 'zod';
declare const COST_RATES: {
    readonly 'mistral-instruct': {
        readonly input: 0.14;
        readonly output: 0.42;
    };
    readonly 'gpt-4o-mini': {
        readonly input: 0.15;
        readonly output: 0.6;
    };
    readonly 'gpt-4o': {
        readonly input: 2.5;
        readonly output: 10;
    };
};
type ModelName = keyof typeof COST_RATES;
declare const CostUsageSchema: z.ZodObject<{
    orgId: z.ZodString;
    model: z.ZodString;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    costEur: z.ZodNumber;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    orgId?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    costEur?: number;
    timestamp?: Date;
}, {
    orgId?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    costEur?: number;
    timestamp?: Date;
}>;
type CostUsage = z.infer<typeof CostUsageSchema>;
declare class CostMeter {
    private costCounter;
    private usageCounter;
    private getMonthlyCap;
    calculateCost(model: string, inputTokens: number, outputTokens: number): number;
    recordUsage(orgId: string, model: string, inputTokens: number, outputTokens: number): CostUsage;
    private getProvider;
    getMonthlyUsage(orgId: string): Promise<number>;
    checkMonthlyCap(orgId: string): Promise<{
        withinLimit: boolean;
        currentUsage: number;
        limit: number;
    }>;
    private runDbExecute;
    recordUsageToDatabase(usage: CostUsage): Promise<void>;
    getUsageHistory(orgId: string, days?: number): Promise<CostUsage[]>;
    getProviderUsage(orgId: string, provider: string): Promise<{
        totalCost: number;
        totalRequests: number;
        averageLatency: number;
    }>;
}
export declare const costMeter: CostMeter;
export type { CostUsage, ModelName };
//# sourceMappingURL=cost-meter.d.ts.map