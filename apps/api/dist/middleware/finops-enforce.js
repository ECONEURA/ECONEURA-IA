import { CostGuardrails } from '@econeura/shared/ai/cost-guardrails';
import { logger } from '@econeura/shared/monitoring/logger';
export class FinOpsEnforcementMiddleware {
    costGuardrails;
    killSwitch = new Map();
    alertThresholds = {
        warning: 0.8,
        critical: 0.95,
        emergency: 1.0
    };
    constructor() {
        this.costGuardrails = new CostGuardrails();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.costGuardrails.onAlert((alert) => {
            this.handleCostAlert(alert);
        });
        this.costGuardrails.onEmergencyStop((orgId) => {
            this.activateKillSwitch(orgId);
        });
    }
    handleCostAlert(alert) {
        const { orgId, currentCost, limit, period } = alert;
        logger.warn('Cost alert triggered', {
            org_id: orgId,
            current_cost: currentCost,
            limit: limit,
            period: period,
            alert_type: alert.type
        });
        if (alert.type === 'emergency_stop') {
            this.activateKillSwitch(orgId);
        }
    }
    activateKillSwitch(orgId) {
        this.killSwitch.set(orgId, true);
        logger.error('Kill switch activated', {
            org_id: orgId,
            reason: 'Emergency cost threshold exceeded'
        });
        setTimeout(() => {
            this.killSwitch.delete(orgId);
            logger.info('Kill switch deactivated', { org_id: orgId });
        }, 60 * 60 * 1000);
    }
    isKillSwitchActive(orgId) {
        return this.killSwitch.has(orgId);
    }
    createBudgetExceededResponse(orgId, currentCost, limit, period, provider, model) {
        const response = {
            error: 'BUDGET_EXCEEDED',
            message: `Budget exceeded: ${currentCost.toFixed(4)}€/${limit}€ (${period})`,
            details: {
                orgId,
                currentCost,
                limit,
                period,
                provider,
                model
            }
        };
        if (period === 'daily') {
            response.retryAfter = 24 * 60 * 60;
        }
        else if (period === 'monthly') {
            response.retryAfter = 30 * 24 * 60 * 60;
        }
        else {
            response.retryAfter = 60;
        }
        return response;
    }
    enforce = async (req, res, next) => {
        try {
            if (!req.path.includes('/ai/') && !req.path.includes('/chat/')) {
                return next();
            }
            const orgId = req.orgId || req.headers['x-org-id'];
            if (!orgId) {
                return res.status(400).json({
                    error: 'MISSING_ORG_ID',
                    message: 'Organization ID is required for AI requests'
                });
            }
            if (this.isKillSwitchActive(orgId)) {
                const response = this.createBudgetExceededResponse(orgId, 0, 0, 'monthly', req.provider, req.model);
                return res.status(402).json(response);
            }
            const estimatedCost = req.estimatedCost || this.estimateRequestCost(req);
            const provider = req.provider || 'unknown';
            const model = req.model || 'unknown';
            const validation = await this.costGuardrails.validateRequest(orgId, estimatedCost, provider, model);
            if (!validation.allowed) {
                const response = this.createBudgetExceededResponse(orgId, estimatedCost, validation.alert?.limit || 0, validation.alert?.period || 'request', provider, model);
                if (response.retryAfter) {
                    res.set('Retry-After', response.retryAfter.toString());
                }
                return res.status(402).json(response);
            }
            res.set('X-Cost-Estimated', estimatedCost.toString());
            res.set('X-Cost-Limit', validation.alert?.limit?.toString() || '0');
            res.set('X-Cost-Period', validation.alert?.period || 'request');
            next();
        }
        catch (error) {
            logger.error('FinOps enforcement error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                org_id: req.orgId,
                path: req.path
            });
            next();
        }
    };
    estimateRequestCost(req) {
        const bodySize = JSON.stringify(req.body || {}).length;
        const querySize = JSON.stringify(req.query || {}).length;
        const totalSize = bodySize + querySize;
        const estimatedTokens = Math.ceil(totalSize / 4);
        const costPerToken = 0.002 / 1000;
        return estimatedTokens * costPerToken;
    }
    async getCostStatus(orgId) {
        try {
            const limits = this.costGuardrails.getCostLimits(orgId);
            const currentDaily = this.costGuardrails.getDailyCost(orgId);
            const currentMonthly = this.costGuardrails.getMonthlyCost(orgId);
            const killSwitchActive = this.isKillSwitchActive(orgId);
            return {
                orgId,
                limits,
                current: {
                    daily: currentDaily,
                    monthly: currentMonthly
                },
                killSwitchActive,
                status: this.getCostStatusLevel(currentDaily, currentMonthly, limits)
            };
        }
        catch (error) {
            logger.error('Error getting cost status', {
                org_id: orgId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    getCostStatusLevel(daily, monthly, limits) {
        const dailyRatio = daily / limits.dailyLimitEUR;
        const monthlyRatio = monthly / limits.monthlyLimitEUR;
        const maxRatio = Math.max(dailyRatio, monthlyRatio);
        if (maxRatio >= this.alertThresholds.emergency) {
            return 'emergency';
        }
        else if (maxRatio >= this.alertThresholds.critical) {
            return 'critical';
        }
        else if (maxRatio >= this.alertThresholds.warning) {
            return 'warning';
        }
        else {
            return 'healthy';
        }
    }
    resetKillSwitch(orgId) {
        this.killSwitch.delete(orgId);
        logger.info('Kill switch reset', { org_id: orgId });
    }
}
export const finOpsEnforcement = new FinOpsEnforcementMiddleware();
export const finOpsEnforce = finOpsEnforcement.enforce;
//# sourceMappingURL=finops-enforce.js.map