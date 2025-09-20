import { z } from 'zod';
import { logger } from '../infrastructure/logger.js';
import { generateCorrelationId } from '../utils/correlation.js';
const CostEstimateSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'local']),
    model: z.string(),
    inputTokens: z.number().min(0),
    outputTokens: z.number().min(0),
    costPerInputToken: z.number().min(0),
    costPerOutputToken: z.number().min(0),
});
const BudgetLimitsSchema = z.object({
    dailyLimitEUR: z.number().min(0),
    monthlyLimitEUR: z.number().min(0),
    perRequestLimitEUR: z.number().min(0),
    warningThreshold: z.number().min(0).max(1).default(0.8),
    criticalThreshold: z.number().min(0).max(1).default(0.95),
    emergencyThreshold: z.number().min(0).max(1).default(1.0),
});
const CostStatusSchema = z.object({
    orgId: z.string(),
    currentDaily: z.number().min(0),
    currentMonthly: z.number().min(0),
    limits: BudgetLimitsSchema,
    status: z.enum(['healthy', 'warning', 'critical', 'emergency']),
    killSwitchActive: z.boolean(),
    lastUpdated: z.date(),
});
export class CostCalculator {
    static COST_PER_TOKEN = {
        openai: {
            'gpt-4': { input: 0.00003, output: 0.00006 },
            'gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 },
            'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
        },
        anthropic: {
            'claude-3-opus': { input: 0.000015, output: 0.000075 },
            'claude-3-sonnet': { input: 0.000003, output: 0.000015 },
            'claude-3-haiku': { input: 0.00000025, output: 0.00000125 },
        },
        google: {
            'gemini-pro': { input: 0.0000005, output: 0.0000015 },
            'gemini-pro-vision': { input: 0.0000005, output: 0.0000015 },
        },
        azure: {
            'gpt-4': { input: 0.00003, output: 0.00006 },
            'gpt-35-turbo': { input: 0.0000015, output: 0.000002 },
        },
        local: {
            'llama-2': { input: 0.0000001, output: 0.0000001 },
            'mistral': { input: 0.0000001, output: 0.0000001 },
        },
    };
    static calculateCost(estimate) {
        const inputCost = estimate.inputTokens * estimate.costPerInputToken;
        const outputCost = estimate.outputTokens * estimate.costPerOutputToken;
        return inputCost + outputCost;
    }
    static estimateFromRequest(req) {
        const bodySize = JSON.stringify(req.body || {}).length;
        const querySize = JSON.stringify(req.query || {}).length;
        const totalSize = bodySize + querySize;
        const estimatedInputTokens = Math.ceil(totalSize / 4);
        const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.5);
        const provider = 'openai';
        const model = 'gpt-4';
        const costs = this.COST_PER_TOKEN[provider][model];
        return {
            provider,
            model,
            inputTokens: estimatedInputTokens,
            outputTokens: estimatedOutputTokens,
            costPerInputToken: costs.input,
            costPerOutputToken: costs.output,
        };
    }
    static getCostPerToken(provider, model) {
        const providerCosts = this.COST_PER_TOKEN[provider];
        if (!providerCosts) {
            return { input: 0.00003, output: 0.00006 };
        }
        const modelCosts = providerCosts[model];
        if (!modelCosts) {
            return { input: 0.00003, output: 0.00006 };
        }
        return modelCosts;
    }
}
export class BudgetManager {
    static instance;
    costStatus = new Map();
    killSwitches = new Map();
    eventListeners = [];
    static getInstance() {
        if (!this.instance) {
            this.instance = new BudgetManager();
        }
        return this.instance;
    }
    async getCostStatus(orgId) {
        let status = this.costStatus.get(orgId);
        if (!status) {
            status = {
                orgId,
                currentDaily: 0,
                currentMonthly: 0,
                limits: {
                    dailyLimitEUR: 100,
                    monthlyLimitEUR: 1000,
                    perRequestLimitEUR: 10,
                    warningThreshold: 0.8,
                    criticalThreshold: 0.95,
                    emergencyThreshold: 1.0,
                },
                status: 'healthy',
                killSwitchActive: false,
                lastUpdated: new Date(),
            };
            this.costStatus.set(orgId, status);
        }
        return status;
    }
    async updateCost(orgId, cost) {
        const status = await this.getCostStatus(orgId);
        status.currentDaily += cost;
        status.currentMonthly += cost;
        status.lastUpdated = new Date();
        const dailyRatio = status.currentDaily / status.limits.dailyLimitEUR;
        const monthlyRatio = status.currentMonthly / status.limits.monthlyLimitEUR;
        const maxRatio = Math.max(dailyRatio, monthlyRatio);
        if (maxRatio >= status.limits.emergencyThreshold) {
            status.status = 'emergency';
            this.activateKillSwitch(orgId);
        }
        else if (maxRatio >= status.limits.criticalThreshold) {
            status.status = 'critical';
        }
        else if (maxRatio >= status.limits.warningThreshold) {
            status.status = 'warning';
        }
        else {
            status.status = 'healthy';
        }
        status.killSwitchActive = this.killSwitches.has(orgId);
        this.costStatus.set(orgId, status);
        return status;
    }
    async validateRequest(orgId, cost) {
        const status = await this.getCostStatus(orgId);
        if (this.killSwitches.has(orgId)) {
            return { allowed: false, status };
        }
        if (cost > status.limits.perRequestLimitEUR) {
            return { allowed: false, status, exceededLimit: 'per_request' };
        }
        if (status.currentDaily + cost > status.limits.dailyLimitEUR) {
            return { allowed: false, status, exceededLimit: 'daily' };
        }
        if (status.currentMonthly + cost > status.limits.monthlyLimitEUR) {
            return { allowed: false, status, exceededLimit: 'monthly' };
        }
        return { allowed: true, status };
    }
    activateKillSwitch(orgId) {
        this.killSwitches.set(orgId, true);
        logger.error('Kill switch activated', {
            org_id: orgId,
            reason: 'Emergency budget threshold exceeded'
        });
        setTimeout(() => {
            this.killSwitches.delete(orgId);
            logger.info('Kill switch deactivated', { org_id: orgId });
        }, 60 * 60 * 1000);
    }
    resetKillSwitch(orgId) {
        this.killSwitches.delete(orgId);
        logger.info('Kill switch reset', { org_id: orgId });
    }
    isKillSwitchActive(orgId) {
        return this.killSwitches.has(orgId);
    }
    onBudgetExceeded(listener) {
        this.eventListeners.push(listener);
    }
    emitBudgetExceeded(event) {
        this.eventListeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                logger.error('Error in budget exceeded listener', { error });
            }
        });
    }
    async setBudgetLimits(orgId, limits) {
        const status = await this.getCostStatus(orgId);
        status.limits = { ...status.limits, ...limits };
        this.costStatus.set(orgId, status);
    }
}
export class FinOpsEnforcementMiddleware {
    budgetManager;
    constructor() {
        this.budgetManager = BudgetManager.getInstance();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.budgetManager.onBudgetExceeded((event) => {
            logger.error('Budget exceeded event', event);
            this.emitBudgetExceededEvent(event);
        });
    }
    emitBudgetExceededEvent(event) {
        logger.error('BUDGET_EXCEEDED_EVENT', {
            type: event.type,
            org_id: event.orgId,
            current_cost: event.currentCost,
            limit: event.limit,
            period: event.period,
            provider: event.provider,
            model: event.model,
            route: event.route,
            correlation_id: event.correlationId,
            timestamp: event.timestamp,
            kill_switch_activated: event.killSwitchActivated,
        });
    }
    enforce = async (req, res, next) => {
        try {
            const startTime = Date.now();
            req.startTime = startTime;
            if (!this.isAIEndpoint(req.path)) {
                return next();
            }
            const orgId = req.orgId || req.headers['x-org-id'];
            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_ORG_ID',
                    message: 'Organization ID is required for AI requests'
                });
            }
            const correlationId = req.correlationId || generateCorrelationId();
            req.correlationId = correlationId;
            const costEstimate = req.costEstimate || CostCalculator.estimateFromRequest(req);
            const estimatedCost = CostCalculator.calculateCost(costEstimate);
            const validation = await this.budgetManager.validateRequest(orgId, estimatedCost);
            if (!validation.allowed) {
                const event = {
                    type: 'BUDGET_EXCEEDED',
                    orgId,
                    currentCost: estimatedCost,
                    limit: validation.exceededLimit === 'daily' ? validation.status.limits.dailyLimitEUR :
                        validation.exceededLimit === 'monthly' ? validation.status.limits.monthlyLimitEUR :
                            validation.status.limits.perRequestLimitEUR,
                    period: validation.exceededLimit === 'daily' ? 'daily' :
                        validation.exceededLimit === 'monthly' ? 'monthly' : 'per_request',
                    provider: costEstimate.provider,
                    model: costEstimate.model,
                    route: req.path,
                    correlationId,
                    timestamp: new Date(),
                    killSwitchActivated: validation.status.killSwitchActive,
                };
                this.budgetManager['emitBudgetExceeded'](event);
                this.setBudgetHeaders(res, {
                    estimatedCost,
                    budgetStatus: validation.status,
                    correlationId,
                    route: req.path,
                    latency: Date.now() - startTime,
                });
                return res.status(402).json({
                    success: false,
                    error: 'BUDGET_EXCEEDED',
                    message: `Budget exceeded: ${estimatedCost.toFixed(4)}€/${event.limit}€ (${event.period})`,
                    details: {
                        orgId,
                        currentCost: estimatedCost,
                        limit: event.limit,
                        period: event.period,
                        provider: costEstimate.provider,
                        model: costEstimate.model,
                        killSwitchActivated: event.killSwitchActivated,
                    },
                    correlationId,
                });
            }
            this.setBudgetHeaders(res, {
                estimatedCost,
                budgetStatus: validation.status,
                correlationId,
                route: req.path,
                latency: Date.now() - startTime,
            });
            req.on('finish', async () => {
                if (res.statusCode < 400) {
                    await this.budgetManager.updateCost(orgId, estimatedCost);
                }
            });
            next();
        }
        catch (error) {
            logger.error('FinOps enforcement error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                org_id: req.orgId,
                path: req.path,
                correlation_id: req.correlationId,
            });
            next();
        }
    };
    isAIEndpoint(path) {
        return path.includes('/ai/') ||
            path.includes('/chat/') ||
            path.includes('/agents/') ||
            path.includes('/completion/') ||
            path.includes('/embedding/');
    }
    setBudgetHeaders(res, data) {
        const { estimatedCost, budgetStatus, correlationId, route, latency } = data;
        res.set('X-Est-Cost-EUR', estimatedCost.toFixed(6));
        res.set('X-Budget-Pct', this.calculateBudgetPercentage(budgetStatus).toFixed(2));
        res.set('X-Latency-ms', latency.toString());
        res.set('X-Route', route);
        res.set('X-Correlation-Id', correlationId);
        res.set('X-Budget-Daily', budgetStatus.currentDaily.toFixed(4));
        res.set('X-Budget-Monthly', budgetStatus.currentMonthly.toFixed(4));
        res.set('X-Budget-Status', budgetStatus.status);
        res.set('X-Kill-Switch', budgetStatus.killSwitchActive.toString());
    }
    calculateBudgetPercentage(status) {
        const dailyRatio = status.currentDaily / status.limits.dailyLimitEUR;
        const monthlyRatio = status.currentMonthly / status.limits.monthlyLimitEUR;
        return Math.max(dailyRatio, monthlyRatio) * 100;
    }
    async getCostStatus(orgId) {
        return this.budgetManager.getCostStatus(orgId);
    }
    async setBudgetLimits(orgId, limits) {
        return this.budgetManager.setBudgetLimits(orgId, limits);
    }
    resetKillSwitch(orgId) {
        this.budgetManager.resetKillSwitch(orgId);
    }
    isKillSwitchActive(orgId) {
        return this.budgetManager.isKillSwitchActive(orgId);
    }
}
export const finOpsEnforcement = new FinOpsEnforcementMiddleware();
export const finOpsEnforce = finOpsEnforcement.enforce;
//# sourceMappingURL=finops-enforce-v2.js.map