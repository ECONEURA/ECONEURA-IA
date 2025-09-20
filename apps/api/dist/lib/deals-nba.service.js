import { structuredLogger } from './structured-logger.js';
export class DealsNBAService {
    config;
    deals = new Map();
    recommendations = new Map();
    stats;
    isProcessing = false;
    processingInterval = null;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            modelVersion: 'v1.0',
            confidenceThreshold: 0.7,
            maxRecommendations: 5,
            expirationHours: 24,
            factors: {
                dealValue: 0.15,
                stage: 0.20,
                timeInStage: 0.10,
                ownerExperience: 0.12,
                companySize: 0.08,
                industry: 0.10,
                seasonality: 0.05,
                competitorActivity: 0.08,
                lastActivity: 0.07,
                marketConditions: 0.05
            },
            actions: {
                call: { enabled: true, weight: 0.25 },
                email: { enabled: true, weight: 0.20 },
                meeting: { enabled: true, weight: 0.20 },
                proposal: { enabled: true, weight: 0.15 },
                follow_up: { enabled: true, weight: 0.10 },
                negotiation: { enabled: true, weight: 0.05 },
                close: { enabled: true, weight: 0.05 }
            },
            ...config
        };
        this.stats = {
            totalDeals: 0,
            recommendationsGenerated: 0,
            recommendationsExecuted: 0,
            successRate: 0,
            averageConfidence: 0,
            topActions: {},
            topFactors: {},
            lastRun: new Date().toISOString()
        };
        this.startPeriodicProcessing();
        structuredLogger.info('Deals NBA service initialized', {
            config: this.config,
            requestId: ''
        });
    }
    startPeriodicProcessing() {
        if (!this.config.enabled)
            return;
        this.processingInterval = setInterval(() => {
            this.processNBARecommendations();
        }, 2 * 60 * 60 * 1000);
        structuredLogger.info('Periodic NBA processing started', {
            interval: '2 hours',
            requestId: ''
        });
    }
    async processNBARecommendations() {
        if (this.isProcessing) {
            return this.stats;
        }
        this.isProcessing = true;
        const startTime = Date.now();
        try {
            let totalRecommendations = 0;
            const actionCounts = {};
            const factorCounts = {};
            let totalConfidence = 0;
            for (const deal of this.deals.values()) {
                const recommendations = await this.generateRecommendations(deal);
                if (recommendations.length > 0) {
                    this.recommendations.set(deal.id, recommendations);
                    totalRecommendations += recommendations.length;
                    for (const rec of recommendations) {
                        actionCounts[rec.actionType] = (actionCounts[rec.actionType] || 0) + 1;
                        totalConfidence += rec.confidence;
                        for (const factor of rec.explanation.factors) {
                            factorCounts[factor.factor] = (factorCounts[factor.factor] || 0) + 1;
                        }
                    }
                }
            }
            this.stats = {
                totalDeals: this.deals.size,
                recommendationsGenerated: totalRecommendations,
                recommendationsExecuted: 0,
                successRate: 0,
                averageConfidence: totalRecommendations > 0 ? totalConfidence / totalRecommendations : 0,
                topActions: actionCounts,
                topFactors: factorCounts,
                lastRun: new Date().toISOString()
            };
            structuredLogger.info('NBA recommendations processing completed', {
                recommendationsGenerated: totalRecommendations,
                processingTime: Date.now() - startTime,
                requestId: ''
            });
            return this.stats;
        }
        catch (error) {
            structuredLogger.error('NBA recommendations processing failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    async generateRecommendations(deal) {
        const recommendations = [];
        const possibleActions = this.getPossibleActions(deal);
        for (const action of possibleActions) {
            const recommendation = await this.createRecommendation(deal, action);
            if (recommendation.confidence >= this.config.confidenceThreshold) {
                recommendations.push(recommendation);
            }
        }
        recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            return b.confidence - a.confidence;
        });
        return recommendations.slice(0, this.config.maxRecommendations);
    }
    getPossibleActions(deal) {
        const actions = [];
        const stage = deal.stage.toLowerCase();
        switch (stage) {
            case 'prospecting':
                actions.push('call', 'email', 'meeting');
                break;
            case 'qualification':
                actions.push('call', 'meeting', 'proposal');
                break;
            case 'proposal':
                actions.push('follow_up', 'negotiation', 'meeting');
                break;
            case 'negotiation':
                actions.push('negotiation', 'proposal', 'close');
                break;
            case 'closing':
                actions.push('close', 'negotiation', 'follow_up');
                break;
            default:
                actions.push('follow_up', 'call', 'email');
        }
        return actions.filter(action => this.config.actions[action]?.enabled);
    }
    async createRecommendation(deal, action) {
        const factors = this.analyzeFactors(deal, action);
        const confidence = this.calculateConfidence(factors);
        const priority = this.determinePriority(deal, action, confidence);
        const successProbability = this.calculateSuccessProbability(deal, action);
        return {
            id: `nba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dealId: deal.id,
            action: this.getActionDescription(action),
            actionType: action,
            priority,
            confidence,
            expectedOutcome: this.getExpectedOutcome(action),
            successProbability,
            timeToExecute: this.getTimeToExecute(action),
            explanation: {
                factors,
                reasoning: this.generateReasoning(factors, action, deal),
                alternatives: this.getAlternatives(action),
                risks: this.identifyRisks(action, deal)
            },
            context: {
                dealStage: deal.stage,
                timeInStage: this.getTimeInStage(deal),
                lastActivity: this.getLastActivity(deal),
                competitorActivity: Math.random() > 0.7,
                marketConditions: this.getMarketConditions()
            },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.config.expirationHours * 60 * 60 * 1000).toISOString()
        };
    }
    analyzeFactors(deal, action) {
        const factors = [];
        const dealValueScore = Math.min(deal.value / 100000, 1);
        factors.push({
            factor: 'Deal Value',
            weight: this.config.factors.dealValue,
            impact: dealValueScore > 0.5 ? 'positive' : 'negative',
            description: `Deal value of ${deal.value} ${deal.currency}`,
            evidence: [`Value: ${deal.value}`, `Currency: ${deal.currency}`]
        });
        const stageScore = this.getStageScore(deal.stage);
        factors.push({
            factor: 'Deal Stage',
            weight: this.config.factors.stage,
            impact: stageScore > 0.5 ? 'positive' : 'negative',
            description: `Currently in ${deal.stage} stage`,
            evidence: [`Stage: ${deal.stage}`, `Probability: ${deal.probability}%`]
        });
        return factors;
    }
    calculateConfidence(factors) {
        let totalWeight = 0;
        let weightedScore = 0;
        for (const factor of factors) {
            const score = factor.impact === 'positive' ? 1 : factor.impact === 'negative' ? 0 : 0.5;
            weightedScore += score * factor.weight;
            totalWeight += factor.weight;
        }
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }
    determinePriority(deal, action, confidence) {
        let priorityScore = 0;
        if (deal.value > 100000)
            priorityScore += 2;
        else if (deal.value > 50000)
            priorityScore += 1;
        if (confidence > 0.8)
            priorityScore += 2;
        else if (confidence > 0.6)
            priorityScore += 1;
        const daysToClose = this.getDaysToClose(deal);
        if (daysToClose < 7)
            priorityScore += 2;
        else if (daysToClose < 30)
            priorityScore += 1;
        if (priorityScore >= 5)
            return 'critical';
        if (priorityScore >= 3)
            return 'high';
        if (priorityScore >= 1)
            return 'medium';
        return 'low';
    }
    calculateSuccessProbability(deal, action) {
        let probability = 0.5;
        const stageMultiplier = this.getStageMultiplier(deal.stage);
        probability *= stageMultiplier;
        if (deal.value > 100000)
            probability += 0.1;
        else if (deal.value < 10000)
            probability -= 0.1;
        return Math.max(0, Math.min(1, probability));
    }
    getActionDescription(action) {
        const descriptions = {
            call: 'Schedule a phone call with the prospect',
            email: 'Send a follow-up email',
            meeting: 'Schedule an in-person or video meeting',
            proposal: 'Prepare and send a formal proposal',
            follow_up: 'Follow up on previous communication',
            negotiation: 'Engage in deal negotiation',
            close: 'Attempt to close the deal'
        };
        return descriptions[action] || action;
    }
    getExpectedOutcome(action) {
        const outcomes = {
            call: 'Gather more information and build rapport',
            email: 'Maintain engagement and provide value',
            meeting: 'Deepen relationship and advance the deal',
            proposal: 'Present formal solution and pricing',
            follow_up: 'Re-engage and move deal forward',
            negotiation: 'Resolve objections and finalize terms',
            close: 'Complete the sale and secure commitment'
        };
        return outcomes[action] || 'Advance the deal';
    }
    getTimeToExecute(action) {
        const times = {
            call: 30,
            email: 15,
            meeting: 60,
            proposal: 120,
            follow_up: 20,
            negotiation: 90,
            close: 45
        };
        return times[action] || 30;
    }
    generateReasoning(factors, action, deal) {
        const positiveFactors = factors.filter(f => f.impact === 'positive');
        const negativeFactors = factors.filter(f => f.impact === 'negative');
        let reasoning = `Based on the analysis, ${action} is recommended because: `;
        if (positiveFactors.length > 0) {
            reasoning += `Positive factors include ${positiveFactors.map(f => f.factor).join(', ')}. `;
        }
        if (negativeFactors.length > 0) {
            reasoning += `However, there are concerns with ${negativeFactors.map(f => f.factor).join(', ')}. `;
        }
        reasoning += `The deal is in ${deal.stage} stage with ${deal.probability}% probability of closing.`;
        return reasoning;
    }
    getAlternatives(action) {
        const alternatives = {
            call: ['email', 'meeting'],
            email: ['call', 'meeting'],
            meeting: ['call', 'proposal'],
            proposal: ['meeting', 'negotiation'],
            follow_up: ['call', 'email'],
            negotiation: ['proposal', 'close'],
            close: ['negotiation', 'follow_up']
        };
        return alternatives[action] || [];
    }
    identifyRisks(action, deal) {
        const risks = [];
        if (deal.probability < 30) {
            risks.push('Low probability of closing may indicate deal issues');
        }
        if (this.getTimeInStage(deal) > 60) {
            risks.push('Deal has been in current stage for extended period');
        }
        return risks;
    }
    getTimeInStage(deal) {
        return Math.floor(Math.random() * 90) + 1;
    }
    getLastActivity(deal) {
        const days = Math.floor(Math.random() * 14) + 1;
        return `${days} days ago`;
    }
    getDaysToClose(deal) {
        const closeDate = new Date(deal.closeDate);
        const now = new Date();
        return Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    getMarketConditions() {
        const conditions = ['Favorable', 'Neutral', 'Challenging'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }
    getStageScore(stage) {
        const scores = {
            prospecting: 0.2,
            qualification: 0.4,
            proposal: 0.6,
            negotiation: 0.8,
            closing: 0.9
        };
        return scores[stage.toLowerCase()] || 0.5;
    }
    getStageMultiplier(stage) {
        const multipliers = {
            prospecting: 0.3,
            qualification: 0.5,
            proposal: 0.7,
            negotiation: 0.8,
            closing: 0.9
        };
        return multipliers[stage.toLowerCase()] || 0.5;
    }
    getRecommendations(dealId) {
        return this.recommendations.get(dealId) || [];
    }
    async executeRecommendation(recommendationId, executedBy) {
        this.stats.recommendationsExecuted++;
        structuredLogger.info('NBA recommendation executed', {
            recommendationId,
            executedBy,
            requestId: ''
        });
    }
    getStats() {
        return this.stats;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('NBA configuration updated', {
            config: this.config,
            requestId: ''
        });
    }
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        structuredLogger.info('Deals NBA service stopped', { requestId: '' });
    }
}
export const dealsNBAService = new DealsNBAService();
//# sourceMappingURL=deals-nba.service.js.map