import { z } from 'zod';
declare const BudgetConfigSchema: z.ZodObject<{
    organizationId: z.ZodString;
    monthlyLimit: z.ZodNumber;
    dailyLimit: z.ZodOptional<z.ZodNumber>;
    warningThreshold: z.ZodNumber;
    criticalThreshold: z.ZodNumber;
    readOnlyThreshold: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["EUR", "USD", "GBP"]>>;
    timezone: z.ZodDefault<z.ZodString>;
    alertChannels: z.ZodDefault<z.ZodArray<z.ZodEnum<["email", "slack", "webhook", "in_app"]>, "many">>;
    autoReadOnly: z.ZodDefault<z.ZodBoolean>;
    gracePeriod: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    currency?: "EUR" | "USD" | "GBP";
    criticalThreshold?: number;
    timezone?: string;
    monthlyLimit?: number;
    dailyLimit?: number;
    warningThreshold?: number;
    readOnlyThreshold?: number;
    alertChannels?: ("email" | "slack" | "webhook" | "in_app")[];
    autoReadOnly?: boolean;
    gracePeriod?: number;
}, {
    organizationId?: string;
    currency?: "EUR" | "USD" | "GBP";
    criticalThreshold?: number;
    timezone?: string;
    monthlyLimit?: number;
    dailyLimit?: number;
    warningThreshold?: number;
    readOnlyThreshold?: number;
    alertChannels?: ("email" | "slack" | "webhook" | "in_app")[];
    autoReadOnly?: boolean;
    gracePeriod?: number;
}>;
declare const BudgetUsageSchema: z.ZodObject<{
    organizationId: z.ZodString;
    currentUsage: z.ZodNumber;
    dailyUsage: z.ZodNumber;
    monthlyUsage: z.ZodNumber;
    lastResetDate: z.ZodString;
    projectedMonthlyUsage: z.ZodNumber;
    averageDailyUsage: z.ZodNumber;
    peakUsage: z.ZodNumber;
    usageByModel: z.ZodRecord<z.ZodString, z.ZodNumber>;
    usageByUser: z.ZodRecord<z.ZodString, z.ZodNumber>;
    usageByFeature: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    currentUsage?: number;
    dailyUsage?: number;
    monthlyUsage?: number;
    lastResetDate?: string;
    projectedMonthlyUsage?: number;
    averageDailyUsage?: number;
    peakUsage?: number;
    usageByModel?: Record<string, number>;
    usageByUser?: Record<string, number>;
    usageByFeature?: Record<string, number>;
}, {
    organizationId?: string;
    currentUsage?: number;
    dailyUsage?: number;
    monthlyUsage?: number;
    lastResetDate?: string;
    projectedMonthlyUsage?: number;
    averageDailyUsage?: number;
    peakUsage?: number;
    usageByModel?: Record<string, number>;
    usageByUser?: Record<string, number>;
    usageByFeature?: Record<string, number>;
}>;
declare const BudgetAlertSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    type: z.ZodEnum<["warning", "critical", "limit_reached", "read_only_activated"]>;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    message: z.ZodString;
    threshold: z.ZodNumber;
    currentUsage: z.ZodNumber;
    percentage: z.ZodNumber;
    timestamp: z.ZodString;
    acknowledged: z.ZodDefault<z.ZodBoolean>;
    acknowledgedBy: z.ZodOptional<z.ZodString>;
    acknowledgedAt: z.ZodOptional<z.ZodString>;
    channels: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    type?: "warning" | "critical" | "limit_reached" | "read_only_activated";
    organizationId?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    acknowledged?: boolean;
    threshold?: number;
    percentage?: number;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    channels?: string[];
    currentUsage?: number;
}, {
    message?: string;
    type?: "warning" | "critical" | "limit_reached" | "read_only_activated";
    organizationId?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    acknowledged?: boolean;
    threshold?: number;
    percentage?: number;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    channels?: string[];
    currentUsage?: number;
}>;
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
export type BudgetUsage = z.infer<typeof BudgetUsageSchema>;
export type BudgetAlert = z.infer<typeof BudgetAlertSchema>;
export interface BudgetProgress {
    organizationId: string;
    currentUsage: number;
    limit: number;
    percentage: number;
    status: 'safe' | 'warning' | 'critical' | 'limit_reached' | 'read_only';
    daysRemaining: number;
    projectedOverage: number;
    canMakeRequests: boolean;
    readOnlyMode: boolean;
    gracePeriodActive: boolean;
    gracePeriodEndsAt?: string;
}
export interface BudgetInsights {
    organizationId: string;
    trends: {
        dailyGrowth: number;
        weeklyGrowth: number;
        monthlyGrowth: number;
    };
    predictions: {
        projectedEndOfMonth: number;
        projectedOverage: number;
        confidence: number;
    };
    recommendations: Array<{
        type: 'optimization' | 'limit_increase' | 'usage_reduction' | 'feature_restriction';
        priority: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        impact: string;
        action: string;
    }>;
    topUsers: Array<{
        userId: string;
        usage: number;
        percentage: number;
    }>;
    topModels: Array<{
        model: string;
        usage: number;
        percentage: number;
        costPerToken: number;
    }>;
    topFeatures: Array<{
        feature: string;
        usage: number;
        percentage: number;
    }>;
}
export declare class AIBudgetUXService {
    private configs;
    private usage;
    private alerts;
    private readOnlyMode;
    private gracePeriods;
    constructor();
    private initializeDefaultConfigs;
    private startPeriodicTasks;
    setBudgetConfig(config: Partial<BudgetConfig> & {
        organizationId: string;
    }): Promise<BudgetConfig>;
    getBudgetConfig(organizationId: string): BudgetConfig | null;
    updateUsage(organizationId: string, usage: Partial<BudgetUsage>): Promise<BudgetUsage>;
    getBudgetProgress(organizationId: string): BudgetProgress | null;
    getBudgetInsights(organizationId: string): BudgetInsights | null;
    activateReadOnlyMode(organizationId: string, reason: string): Promise<void>;
    deactivateReadOnlyMode(organizationId: string, reason: string): Promise<void>;
    activateGracePeriod(organizationId: string, hours?: number): Promise<void>;
    canMakeRequest(organizationId: string, estimatedCost: number): {
        allowed: boolean;
        reason?: string;
    };
    getActiveAlerts(organizationId: string): BudgetAlert[];
    acknowledgeAlert(organizationId: string, alertId: string, acknowledgedBy: string): Promise<boolean>;
    private createEmptyUsage;
    private checkBudgetThresholds;
    private createAlert;
    private checkAllBudgets;
    private cleanupOldAlerts;
    private resetDailyUsage;
    private getDaysRemainingInMonth;
    private calculateDailyGrowth;
    private calculateWeeklyGrowth;
    private calculateMonthlyGrowth;
    private calculatePredictionConfidence;
    private generateRecommendations;
    private getTopUsers;
    private getTopModels;
    private getTopFeatures;
    private generateAlertId;
}
export declare const aiBudgetUXService: AIBudgetUXService;
export {};
//# sourceMappingURL=ai-budget-ux.service.d.ts.map