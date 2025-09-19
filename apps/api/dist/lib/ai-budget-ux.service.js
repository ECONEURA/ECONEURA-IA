import { logger } from './logger.js';
import { z } from 'zod';
const BudgetConfigSchema = z.object({
    organizationId: z.string(),
    monthlyLimit: z.number().min(0),
    dailyLimit: z.number().min(0).optional(),
    warningThreshold: z.number().min(0).max(1),
    criticalThreshold: z.number().min(0).max(1),
    readOnlyThreshold: z.number().min(0).max(1),
    currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
    timezone: z.string().default('Europe/Madrid'),
    alertChannels: z.array(z.enum(['email', 'slack', 'webhook', 'in_app'])).default(['in_app']),
    autoReadOnly: z.boolean().default(true),
    gracePeriod: z.number().min(0).default(24),
});
const BudgetUsageSchema = z.object({
    organizationId: z.string(),
    currentUsage: z.number().min(0),
    dailyUsage: z.number().min(0),
    monthlyUsage: z.number().min(0),
    lastResetDate: z.string().datetime(),
    projectedMonthlyUsage: z.number().min(0),
    averageDailyUsage: z.number().min(0),
    peakUsage: z.number().min(0),
    usageByModel: z.record(z.string(), z.number()),
    usageByUser: z.record(z.string(), z.number()),
    usageByFeature: z.record(z.string(), z.number()),
});
const BudgetAlertSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    type: z.enum(['warning', 'critical', 'limit_reached', 'read_only_activated']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    threshold: z.number(),
    currentUsage: z.number(),
    percentage: z.number(),
    timestamp: z.string().datetime(),
    acknowledged: z.boolean().default(false),
    acknowledgedBy: z.string().optional(),
    acknowledgedAt: z.string().datetime().optional(),
    channels: z.array(z.string()),
    metadata: z.record(z.any()).optional(),
});
export class AIBudgetUXService {
    configs = new Map();
    usage = new Map();
    alerts = new Map();
    readOnlyMode = new Map();
    gracePeriods = new Map();
    constructor() {
        this.initializeDefaultConfigs();
        this.startPeriodicTasks();
    }
    initializeDefaultConfigs() {
        const defaultConfig = {
            organizationId: 'default',
            monthlyLimit: 1000,
            dailyLimit: 50,
            warningThreshold: 0.7,
            criticalThreshold: 0.9,
            readOnlyThreshold: 0.95,
            currency: 'EUR',
            timezone: 'Europe/Madrid',
            alertChannels: ['in_app', 'email'],
            autoReadOnly: true,
            gracePeriod: 24,
        };
        this.configs.set('default', defaultConfig);
    }
    startPeriodicTasks() {
        setInterval(() => {
            this.checkAllBudgets();
        }, 5 * 60 * 1000);
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 60 * 60 * 1000);
        setInterval(() => {
            this.resetDailyUsage();
        }, 24 * 60 * 60 * 1000);
    }
    async setBudgetConfig(config) {
        try {
            const validatedConfig = BudgetConfigSchema.parse({
                organizationId: config.organizationId,
                monthlyLimit: config.monthlyLimit || 1000,
                dailyLimit: config.dailyLimit,
                warningThreshold: config.warningThreshold || 0.7,
                criticalThreshold: config.criticalThreshold || 0.9,
                readOnlyThreshold: config.readOnlyThreshold || 0.95,
                currency: config.currency || 'EUR',
                timezone: config.timezone || 'Europe/Madrid',
                alertChannels: config.alertChannels || ['in_app'],
                autoReadOnly: config.autoReadOnly !== undefined ? config.autoReadOnly : true,
                gracePeriod: config.gracePeriod || 24,
            });
            this.configs.set(config.organizationId, validatedConfig);
            logger.info('Budget configuration updated', {
                organizationId: config.organizationId,
                monthlyLimit: validatedConfig.monthlyLimit,
                warningThreshold: validatedConfig.warningThreshold,
                criticalThreshold: validatedConfig.criticalThreshold,
                readOnlyThreshold: validatedConfig.readOnlyThreshold,
                requestId: ''
            });
            return validatedConfig;
        }
        catch (error) {
            logger.error('Failed to set budget config', {
                error: error instanceof Error ? error.message : 'Unknown error',
                organizationId: config.organizationId,
                requestId: ''
            });
            throw error;
        }
    }
    getBudgetConfig(organizationId) {
        return this.configs.get(organizationId) || null;
    }
    async updateUsage(organizationId, usage) {
        try {
            const currentUsage = this.usage.get(organizationId) || this.createEmptyUsage(organizationId);
            const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
            if (!config) {
                throw new Error(`No budget config found for organization ${organizationId}`);
            }
            if (usage.monthlyUsage !== undefined && usage.monthlyUsage < 0) {
                throw new Error('Monthly usage cannot be negative');
            }
            if (usage.dailyUsage !== undefined && usage.dailyUsage < 0) {
                throw new Error('Daily usage cannot be negative');
            }
            if (usage.currentUsage !== undefined && usage.currentUsage < 0) {
                throw new Error('Current usage cannot be negative');
            }
            const updatedUsage = {
                ...currentUsage,
                ...usage,
                organizationId,
                lastResetDate: currentUsage.lastResetDate,
            };
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysPassed = Math.floor((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            updatedUsage.projectedMonthlyUsage = (updatedUsage.monthlyUsage / daysPassed) * daysInMonth;
            updatedUsage.averageDailyUsage = updatedUsage.monthlyUsage / daysPassed;
            this.usage.set(organizationId, updatedUsage);
            await this.checkBudgetThresholds(organizationId, updatedUsage, config);
            logger.info('Budget usage updated', {
                organizationId,
                currentUsage: updatedUsage.currentUsage,
                monthlyUsage: updatedUsage.monthlyUsage,
                projectedMonthlyUsage: updatedUsage.projectedMonthlyUsage,
                requestId: ''
            });
            return updatedUsage;
        }
        catch (error) {
            logger.error('Failed to update budget usage', {
                error: error instanceof Error ? error.message : 'Unknown error',
                organizationId,
                requestId: ''
            });
            throw error;
        }
    }
    getBudgetProgress(organizationId) {
        const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
        const usage = this.usage.get(organizationId);
        if (!config) {
            return null;
        }
        const actualUsage = usage || this.createEmptyUsage(organizationId);
        const percentage = config.monthlyLimit === 0 ? 0 : (actualUsage.monthlyUsage / config.monthlyLimit) * 100;
        const daysRemaining = this.getDaysRemainingInMonth();
        const projectedOverage = Math.max(0, actualUsage.projectedMonthlyUsage - config.monthlyLimit);
        let status = 'safe';
        if (percentage >= config.readOnlyThreshold * 100) {
            status = 'read_only';
        }
        else if (percentage >= config.criticalThreshold * 100) {
            status = 'critical';
        }
        else if (percentage >= config.warningThreshold * 100) {
            status = 'warning';
        }
        const readOnlyMode = this.readOnlyMode.get(organizationId) || false;
        const gracePeriod = this.gracePeriods.get(organizationId);
        const gracePeriodActive = gracePeriod?.active || false;
        const canMakeRequests = !readOnlyMode || gracePeriodActive;
        return {
            organizationId,
            currentUsage: actualUsage.monthlyUsage,
            limit: config.monthlyLimit,
            percentage,
            status,
            daysRemaining,
            projectedOverage,
            canMakeRequests,
            readOnlyMode,
            gracePeriodActive,
            gracePeriodEndsAt: gracePeriod?.endsAt.toISOString(),
        };
    }
    getBudgetInsights(organizationId) {
        const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
        const usage = this.usage.get(organizationId);
        if (!config || !usage) {
            return null;
        }
        const trends = {
            dailyGrowth: this.calculateDailyGrowth(usage),
            weeklyGrowth: this.calculateWeeklyGrowth(usage),
            monthlyGrowth: this.calculateMonthlyGrowth(usage),
        };
        const predictions = {
            projectedEndOfMonth: usage.projectedMonthlyUsage,
            projectedOverage: Math.max(0, usage.projectedMonthlyUsage - config.monthlyLimit),
            confidence: this.calculatePredictionConfidence(usage),
        };
        const recommendations = this.generateRecommendations(usage, config);
        const topUsers = this.getTopUsers(usage);
        const topModels = this.getTopModels(usage);
        const topFeatures = this.getTopFeatures(usage);
        return {
            organizationId,
            trends,
            predictions,
            recommendations,
            topUsers,
            topModels,
            topFeatures,
        };
    }
    async activateReadOnlyMode(organizationId, reason) {
        const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
        if (!config) {
            throw new Error(`No budget config found for organization ${organizationId}`);
        }
        if (!this.usage.has(organizationId)) {
            this.usage.set(organizationId, this.createEmptyUsage(organizationId));
        }
        this.readOnlyMode.set(organizationId, true);
        await this.createAlert({
            id: this.generateAlertId(),
            organizationId,
            type: 'read_only_activated',
            severity: 'critical',
            message: `Read-only mode activated: ${reason}`,
            threshold: config.readOnlyThreshold,
            currentUsage: this.usage.get(organizationId)?.monthlyUsage || 0,
            percentage: config.monthlyLimit === 0 ? 0 : ((this.usage.get(organizationId)?.monthlyUsage || 0) / config.monthlyLimit) * 100,
            timestamp: new Date().toISOString(),
            channels: config.alertChannels,
            metadata: { reason },
        });
        logger.warn('Read-only mode activated', {
            organizationId,
            reason,
            requestId: ''
        });
    }
    async deactivateReadOnlyMode(organizationId, reason) {
        this.readOnlyMode.set(organizationId, false);
        this.gracePeriods.delete(organizationId);
        logger.info('Read-only mode deactivated', {
            organizationId,
            reason,
            requestId: ''
        });
    }
    async activateGracePeriod(organizationId, hours = 24) {
        const config = this.getBudgetConfig(organizationId) || this.configs.get('default');
        if (!config) {
            throw new Error(`No budget config found for organization ${organizationId}`);
        }
        const endsAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
        this.gracePeriods.set(organizationId, { active: true, endsAt });
        logger.info('Grace period activated', {
            organizationId,
            hours,
            endsAt: endsAt.toISOString(),
            requestId: ''
        });
    }
    canMakeRequest(organizationId, estimatedCost) {
        const progress = this.getBudgetProgress(organizationId);
        if (!progress) {
            return { allowed: false, reason: 'No budget configuration found' };
        }
        if (!progress.canMakeRequests) {
            return { allowed: false, reason: 'Read-only mode active' };
        }
        if (progress.currentUsage + estimatedCost > progress.limit) {
            return { allowed: false, reason: 'Request would exceed monthly limit' };
        }
        return { allowed: true };
    }
    getActiveAlerts(organizationId) {
        const alerts = this.alerts.get(organizationId) || [];
        return alerts.filter(alert => !alert.acknowledged);
    }
    async acknowledgeAlert(organizationId, alertId, acknowledgedBy) {
        const alerts = this.alerts.get(organizationId) || [];
        const alert = alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = acknowledgedBy;
            alert.acknowledgedAt = new Date().toISOString();
            logger.info('Alert acknowledged', {
                organizationId,
                alertId,
                acknowledgedBy,
                requestId: ''
            });
            return true;
        }
        return false;
    }
    createEmptyUsage(organizationId) {
        return {
            organizationId,
            currentUsage: 0,
            dailyUsage: 0,
            monthlyUsage: 0,
            lastResetDate: new Date().toISOString(),
            projectedMonthlyUsage: 0,
            averageDailyUsage: 0,
            peakUsage: 0,
            usageByModel: {},
            usageByUser: {},
            usageByFeature: {},
        };
    }
    async checkBudgetThresholds(organizationId, usage, config) {
        const percentage = config.monthlyLimit === 0 ? 0 : (usage.monthlyUsage / config.monthlyLimit) * 100;
        if (percentage >= config.warningThreshold * 100 && percentage < config.criticalThreshold * 100) {
            await this.createAlert({
                id: this.generateAlertId(),
                organizationId,
                type: 'warning',
                severity: 'medium',
                message: `Budget usage reached ${percentage.toFixed(1)}% of monthly limit`,
                threshold: config.warningThreshold,
                currentUsage: usage.monthlyUsage,
                percentage,
                timestamp: new Date().toISOString(),
                channels: config.alertChannels,
            });
        }
        if (percentage >= config.criticalThreshold * 100 && percentage < config.readOnlyThreshold * 100) {
            await this.createAlert({
                id: this.generateAlertId(),
                organizationId,
                type: 'critical',
                severity: 'high',
                message: `Budget usage reached ${percentage.toFixed(1)}% of monthly limit`,
                threshold: config.criticalThreshold,
                currentUsage: usage.monthlyUsage,
                percentage,
                timestamp: new Date().toISOString(),
                channels: config.alertChannels,
            });
        }
        if (percentage >= config.readOnlyThreshold * 100 && config.autoReadOnly) {
            await this.activateReadOnlyMode(organizationId, `Budget usage reached ${percentage.toFixed(1)}% of monthly limit`);
        }
    }
    async createAlert(alert) {
        const alerts = this.alerts.get(alert.organizationId) || [];
        alerts.push(alert);
        this.alerts.set(alert.organizationId, alerts);
        logger.warn('Budget alert created', {
            organizationId: alert.organizationId,
            type: alert.type,
            severity: alert.severity,
            percentage: alert.percentage,
            requestId: ''
        });
    }
    checkAllBudgets() {
        for (const [organizationId, config] of this.configs) {
            const usage = this.usage.get(organizationId);
            if (usage) {
                this.checkBudgetThresholds(organizationId, usage, config);
            }
        }
    }
    cleanupOldAlerts() {
        const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        for (const [organizationId, alerts] of this.alerts) {
            const filteredAlerts = alerts.filter(alert => new Date(alert.timestamp) > cutoffDate);
            this.alerts.set(organizationId, filteredAlerts);
        }
    }
    resetDailyUsage() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (const [organizationId, usage] of this.usage) {
            if (new Date(usage.lastResetDate) < startOfDay) {
                usage.dailyUsage = 0;
                usage.lastResetDate = now.toISOString();
                this.usage.set(organizationId, usage);
            }
        }
    }
    getDaysRemainingInMonth() {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return Math.max(0, endOfMonth.getDate() - now.getDate());
    }
    calculateDailyGrowth(usage) {
        return Math.random() * 10 - 5;
    }
    calculateWeeklyGrowth(usage) {
        return Math.random() * 20 - 10;
    }
    calculateMonthlyGrowth(usage) {
        return Math.random() * 30 - 15;
    }
    calculatePredictionConfidence(usage) {
        return 0.7 + Math.random() * 0.3;
    }
    generateRecommendations(usage, config) {
        const recommendations = [];
        const percentage = (usage.monthlyUsage / config.monthlyLimit) * 100;
        if (percentage > 80) {
            recommendations.push({
                type: 'limit_increase',
                priority: 'high',
                title: 'Consider increasing monthly limit',
                description: 'Current usage is approaching the limit. Consider increasing the monthly budget.',
                impact: 'Prevents service interruption',
                action: 'Contact administrator to increase limit',
            });
        }
        if (usage.averageDailyUsage > (config.dailyLimit || config.monthlyLimit / 30)) {
            recommendations.push({
                type: 'usage_reduction',
                priority: 'medium',
                title: 'Optimize daily usage',
                description: 'Daily usage is above recommended levels. Consider optimizing requests.',
                impact: 'Reduces costs and improves efficiency',
                action: 'Review and optimize AI request patterns',
            });
        }
        return recommendations;
    }
    getTopUsers(usage) {
        return Object.entries(usage.usageByUser)
            .map(([userId, usageAmount]) => ({
            userId,
            usage: usageAmount,
            percentage: (usageAmount / usage.monthlyUsage) * 100,
        }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 5);
    }
    getTopModels(usage) {
        return Object.entries(usage.usageByModel)
            .map(([model, usageAmount]) => ({
            model,
            usage: usageAmount,
            percentage: (usageAmount / usage.monthlyUsage) * 100,
            costPerToken: Math.random() * 0.01,
        }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 5);
    }
    getTopFeatures(usage) {
        return Object.entries(usage.usageByFeature)
            .map(([feature, usageAmount]) => ({
            feature,
            usage: usageAmount,
            percentage: (usageAmount / usage.monthlyUsage) * 100,
        }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 5);
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
export const aiBudgetUXService = new AIBudgetUXService();
//# sourceMappingURL=ai-budget-ux.service.js.map