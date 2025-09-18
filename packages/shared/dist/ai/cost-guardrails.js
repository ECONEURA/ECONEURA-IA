import { logger } from '../logging.js';
import { prometheus } from '../metrics.js';
export class CostGuardrails {
    dailyCosts = new Map();
    monthlyCosts = new Map();
    costLimits = new Map();
    alertHandlers = [];
    usageHistory = [];
    MAX_HISTORY_ENTRIES = 10000;
    setCostLimits(orgId, limits) {
        this.costLimits.set(orgId, limits);
        logger.info('Cost limits updated', {
            org_id: orgId,
            daily_limit_eur: limits.dailyLimitEUR,
            monthly_limit_eur: limits.monthlyLimitEUR,
        });
    }
    getCostLimits(orgId) {
        return this.costLimits.get(orgId) || {
            dailyLimitEUR: 50.0,
            monthlyLimitEUR: 1000.0,
            perRequestLimitEUR: 5.0,
            warningThresholds: {
                daily: 80,
                monthly: 85,
            },
            emergencyStop: {
                enabled: true,
                thresholdEUR: 1500.0,
            },
        };
    }
    async validateRequest(orgId, estimatedCostEUR, provider, model) {
        const limits = this.getCostLimits(orgId);
        const currentDaily = this.dailyCosts.get(orgId) || 0;
        const currentMonthly = this.monthlyCosts.get(orgId) || 0;
        if (limits.emergencyStop.enabled && currentMonthly >= limits.emergencyStop.thresholdEUR) {
            const alert = {
                type: 'emergency_stop',
                orgId,
                currentCost: currentMonthly,
                limit: limits.emergencyStop.thresholdEUR,
                period: 'monthly',
                timestamp: new Date(),
                message: `Emergency stop triggered. Monthly cost ${currentMonthly.toFixed(2)}€ exceeds emergency threshold ${limits.emergencyStop.thresholdEUR}€`,
            };
            this.triggerAlert(alert);
            return { allowed: false, reason: 'Emergency stop triggered', alert };
        }
        if (estimatedCostEUR > limits.perRequestLimitEUR) {
            const alert = {
                type: 'limit_exceeded',
                orgId,
                currentCost: estimatedCostEUR,
                limit: limits.perRequestLimitEUR,
                period: 'request',
                timestamp: new Date(),
                message: `Request cost ${estimatedCostEUR.toFixed(4)}€ exceeds per-request limit ${limits.perRequestLimitEUR}€`,
            };
            this.triggerAlert(alert);
            return { allowed: false, reason: 'Per-request limit exceeded', alert };
        }
        if (currentDaily + estimatedCostEUR > limits.dailyLimitEUR) {
            const alert = {
                type: 'limit_exceeded',
                orgId,
                currentCost: currentDaily + estimatedCostEUR,
                limit: limits.dailyLimitEUR,
                period: 'daily',
                timestamp: new Date(),
                message: `Daily cost would exceed limit: ${(currentDaily + estimatedCostEUR).toFixed(2)}€ > ${limits.dailyLimitEUR}€`,
            };
            this.triggerAlert(alert);
            return { allowed: false, reason: 'Daily limit would be exceeded', alert };
        }
        if (currentMonthly + estimatedCostEUR > limits.monthlyLimitEUR) {
            const alert = {
                type: 'limit_exceeded',
                orgId,
                currentCost: currentMonthly + estimatedCostEUR,
                limit: limits.monthlyLimitEUR,
                period: 'monthly',
                timestamp: new Date(),
                message: `Monthly cost would exceed limit: ${(currentMonthly + estimatedCostEUR).toFixed(2)}€ > ${limits.monthlyLimitEUR}€`,
            };
            this.triggerAlert(alert);
            return { allowed: false, reason: 'Monthly limit would be exceeded', alert };
        }
        this.checkWarningThresholds(orgId, currentDaily + estimatedCostEUR, currentMonthly + estimatedCostEUR, limits);
        prometheus.aiRequestsTotal.labels({ org_id: orgId, provider, model, status: 'validated' }).inc();
        prometheus.aiCostEUR.labels({ org_id: orgId, provider }).set(currentMonthly + estimatedCostEUR);
        return { allowed: true };
    }
    recordUsage(metrics) {
        const { orgId, costEUR, provider, model, success, errorType } = metrics;
        const currentDaily = this.dailyCosts.get(orgId) || 0;
        const currentMonthly = this.monthlyCosts.get(orgId) || 0;
        this.dailyCosts.set(orgId, currentDaily + costEUR);
        this.monthlyCosts.set(orgId, currentMonthly + costEUR);
        this.usageHistory.push(metrics);
        if (this.usageHistory.length > this.MAX_HISTORY_ENTRIES) {
            this.usageHistory.shift();
        }
        prometheus.aiRequestsTotal.labels({
            org_id: orgId,
            provider,
            model,
            status: success ? 'success' : 'error'
        }).inc();
        prometheus.aiTokensTotal.labels({ org_id: orgId, provider, type: 'input' }).inc(metrics.tokensInput);
        prometheus.aiTokensTotal.labels({ org_id: orgId, provider, type: 'output' }).inc(metrics.tokensOutput);
        prometheus.aiCostEUR.labels({ org_id: orgId, provider }).set(currentMonthly);
        prometheus.aiLatency.labels({ org_id: orgId, provider, model }).observe(metrics.latencyMs / 1000);
        if (!success && errorType) {
            prometheus.aiErrorsTotal.labels({ org_id: orgId, provider, error_type: errorType }).inc();
        }
        logger.logFinOpsEvent('AI usage recorded', {
            event_type: 'cost_calculation',
            org_id: orgId,
            current_cost_eur: currentDaily + costEUR,
            budget_cap_eur: this.getCostLimits(orgId).dailyLimitEUR,
            provider,
            model,
            cost_eur: costEUR,
            tokens_input: metrics.tokensInput,
            tokens_output: metrics.tokensOutput,
            latency_ms: metrics.latencyMs,
            success,
            error_type: errorType,
            daily_total_eur: currentDaily + costEUR,
            monthly_total_eur: currentMonthly + costEUR,
        });
    }
    checkWarningThresholds(orgId, projectedDaily, projectedMonthly, limits) {
        const dailyUtilization = (projectedDaily / limits.dailyLimitEUR) * 100;
        const monthlyUtilization = (projectedMonthly / limits.monthlyLimitEUR) * 100;
        if (dailyUtilization >= limits.warningThresholds.daily) {
            const alert = {
                type: 'warning',
                orgId,
                currentCost: projectedDaily,
                limit: limits.dailyLimitEUR,
                period: 'daily',
                timestamp: new Date(),
                message: `Daily AI cost warning: ${dailyUtilization.toFixed(1)}% of limit used (${projectedDaily.toFixed(2)}€/${limits.dailyLimitEUR}€)`,
            };
            this.triggerAlert(alert);
        }
        if (monthlyUtilization >= limits.warningThresholds.monthly) {
            const alert = {
                type: 'warning',
                orgId,
                currentCost: projectedMonthly,
                limit: limits.monthlyLimitEUR,
                period: 'monthly',
                timestamp: new Date(),
                message: `Monthly AI cost warning: ${monthlyUtilization.toFixed(1)}% of limit used (${projectedMonthly.toFixed(2)}€/${limits.monthlyLimitEUR}€)`,
            };
            this.triggerAlert(alert);
        }
    }
    triggerAlert(alert) {
        logger.warn('Cost alert triggered', {
            alert_type: alert.type,
            org_id: alert.orgId,
            current_cost: alert.currentCost,
            limit: alert.limit,
            period: alert.period,
            message: alert.message,
        });
        this.alertHandlers.forEach(handler => {
            try {
                handler(alert);
            }
            catch (error) {
                logger.error('Alert handler failed', error instanceof Error ? error : new Error(String(error)));
            }
        });
        prometheus.aiAlertsTotal.labels({
            org_id: alert.orgId,
            type: alert.type,
            period: alert.period
        }).inc();
    }
    onAlert(handler) {
        this.alertHandlers.push(handler);
    }
    getUsage(orgId) {
        const limits = this.getCostLimits(orgId);
        const daily = this.dailyCosts.get(orgId) || 0;
        const monthly = this.monthlyCosts.get(orgId) || 0;
        return {
            daily,
            monthly,
            limits,
            utilizationDaily: limits.dailyLimitEUR > 0 ? (daily / limits.dailyLimitEUR) * 100 : 0,
            utilizationMonthly: limits.monthlyLimitEUR > 0 ? (monthly / limits.monthlyLimitEUR) * 100 : 0,
        };
    }
    getUsageHistory(orgId, limit = 100) {
        let history = this.usageHistory;
        if (orgId) {
            history = history.filter(metric => metric.orgId === orgId);
        }
        return history
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    resetDailyCosts() {
        this.dailyCosts.clear();
        logger.info('Daily AI cost tracking reset');
    }
    resetMonthlyCosts() {
        this.monthlyCosts.clear();
        logger.info('Monthly AI cost tracking reset');
    }
    getAggregateStats() {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recent24h = this.usageHistory.filter(m => m.timestamp >= yesterday);
        const totalDailyCost = Array.from(this.dailyCosts.values()).reduce((sum, cost) => sum + cost, 0);
        const totalMonthlyCost = Array.from(this.monthlyCosts.values()).reduce((sum, cost) => sum + cost, 0);
        const activeOrganizations = new Set([...this.dailyCosts.keys(), ...this.monthlyCosts.keys()]).size;
        const totalRequests24h = recent24h.length;
        const averageLatency = recent24h.length > 0
            ? recent24h.reduce((sum, m) => sum + m.latencyMs, 0) / recent24h.length
            : 0;
        const errors24h = recent24h.filter(m => !m.success).length;
        const errorRate = totalRequests24h > 0 ? (errors24h / totalRequests24h) * 100 : 0;
        return {
            totalDailyCost,
            totalMonthlyCost,
            activeOrganizations,
            totalRequests24h,
            averageLatency,
            errorRate,
        };
    }
}
//# sourceMappingURL=cost-guardrails.js.map