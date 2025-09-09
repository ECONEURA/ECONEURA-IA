/**
 * PR-53: Deals NBA Explicable Service
 *
 * Sistema de Next Best Action (NBA) explicable para deals
 */

import { structuredLogger } from './structured-logger.js';

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  closeDate: string;
  ownerId: string;
  organizationId: string;
  companyId: string;
  contactId: string;
  source: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface NBARecommendation {
  id: string;
  dealId: string;
  action: string;
  actionType: 'call' | 'email' | 'meeting' | 'proposal' | 'follow_up' | 'negotiation' | 'close';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  expectedOutcome: string;
  successProbability: number;
  timeToExecute: number;
  explanation: {
    factors: FactorInfluence[];
    reasoning: string;
    alternatives: string[];
    risks: string[];
  };
  context: {
    dealStage: string;
    timeInStage: number;
    lastActivity: string;
    competitorActivity: boolean;
    marketConditions: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface FactorInfluence {
  factor: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  evidence: string[];
}

export interface NBAConfig {
  enabled: boolean;
  modelVersion: string;
  confidenceThreshold: number;
  maxRecommendations: number;
  expirationHours: number;
  factors: {
    dealValue: number;
    stage: number;
    timeInStage: number;
    ownerExperience: number;
    companySize: number;
    industry: number;
    seasonality: number;
    competitorActivity: number;
    lastActivity: number;
    marketConditions: number;
  };
  actions: {
    call: { enabled: boolean; weight: number };
    email: { enabled: boolean; weight: number };
    meeting: { enabled: boolean; weight: number };
    proposal: { enabled: boolean; weight: number };
    follow_up: { enabled: boolean; weight: number };
    negotiation: { enabled: boolean; weight: number };
    close: { enabled: boolean; weight: number };
  };
}

export interface NBAStats {
  totalDeals: number;
  recommendationsGenerated: number;
  recommendationsExecuted: number;
  successRate: number;
  averageConfidence: number;
  topActions: Record<string, number>;
  topFactors: Record<string, number>;
  lastRun: string;
}

export class DealsNBAService {
  private config: NBAConfig;
  private deals: Map<string, Deal> = new Map();
  private recommendations: Map<string, NBARecommendation[]> = new Map();
  private stats: NBAStats;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<NBAConfig> = {}) {
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

  private startPeriodicProcessing(): void {
    if (!this.config.enabled) return;

    this.processingInterval = setInterval(() => {
      this.processNBARecommendations();
    }, 2 * 60 * 60 * 1000); // Cada 2 horas

    structuredLogger.info('Periodic NBA processing started', {
      interval: '2 hours',
      requestId: ''
    });
  }

  async processNBARecommendations(): Promise<NBAStats> {
    if (this.isProcessing) {
      return this.stats;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      let totalRecommendations = 0;
      const actionCounts: Record<string, number> = {};
      const factorCounts: Record<string, number> = {};
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

    } catch (error) {
      structuredLogger.error('NBA recommendations processing failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async generateRecommendations(deal: Deal): Promise<NBARecommendation[]> {
    const recommendations: NBARecommendation[] = [];
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

  private getPossibleActions(deal: Deal): string[] {
    const actions: string[] = [];
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

    return actions.filter(action => ;
      this.config.actions[action as keyof typeof this.config.actions]?.enabled
    );
  }

  async createRecommendation(deal: Deal, action: string): Promise<NBARecommendation> {
    const factors = this.analyzeFactors(deal, action);
    const confidence = this.calculateConfidence(factors);
    const priority = this.determinePriority(deal, action, confidence);
    const successProbability = this.calculateSuccessProbability(deal, action);

    return {
      id: `nba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dealId: deal.id,
      action: this.getActionDescription(action),
      actionType: action as any,
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

  private analyzeFactors(deal: Deal, action: string): FactorInfluence[] {
    const factors: FactorInfluence[] = [];

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

  private calculateConfidence(factors: FactorInfluence[]): number {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const factor of factors) {
      const score = factor.impact === 'positive' ? 1 : factor.impact === 'negative' ? 0 : 0.5;
      weightedScore += score * factor.weight;
      totalWeight += factor.weight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private determinePriority(deal: Deal, action: string, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    let priorityScore = 0;

    if (deal.value > 100000) priorityScore += 2;
    else if (deal.value > 50000) priorityScore += 1;

    if (confidence > 0.8) priorityScore += 2;
    else if (confidence > 0.6) priorityScore += 1;

    const daysToClose = this.getDaysToClose(deal);
    if (daysToClose < 7) priorityScore += 2;
    else if (daysToClose < 30) priorityScore += 1;

    if (priorityScore >= 5) return 'critical';
    if (priorityScore >= 3) return 'high';
    if (priorityScore >= 1) return 'medium';
    return 'low';
  }

  private calculateSuccessProbability(deal: Deal, action: string): number {
    let probability = 0.5;

    const stageMultiplier = this.getStageMultiplier(deal.stage);
    probability *= stageMultiplier;

    if (deal.value > 100000) probability += 0.1;
    else if (deal.value < 10000) probability -= 0.1;

    return Math.max(0, Math.min(1, probability));
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
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

  private getExpectedOutcome(action: string): string {
    const outcomes: Record<string, string> = {
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

  private getTimeToExecute(action: string): number {
    const times: Record<string, number> = {
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

  private generateReasoning(factors: FactorInfluence[], action: string, deal: Deal): string {
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

  private getAlternatives(action: string): string[] {
    const alternatives: Record<string, string[]> = {
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

  private identifyRisks(action: string, deal: Deal): string[] {
    const risks: string[] = [];

    if (deal.probability < 30) {
      risks.push('Low probability of closing may indicate deal issues');
    }

    if (this.getTimeInStage(deal) > 60) {
      risks.push('Deal has been in current stage for extended period');
    }

    return risks;
  }

  private getTimeInStage(deal: Deal): number {
    return Math.floor(Math.random() * 90) + 1;
  }

  private getLastActivity(deal: Deal): string {
    const days = Math.floor(Math.random() * 14) + 1;
    return `${days} days ago`;
  }

  private getDaysToClose(deal: Deal): number {
    const closeDate = new Date(deal.closeDate);
    const now = new Date();
    return Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getMarketConditions(): string {
    const conditions = ['Favorable', 'Neutral', 'Challenging'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private getStageScore(stage: string): number {
    const scores: Record<string, number> = {
      prospecting: 0.2,
      qualification: 0.4,
      proposal: 0.6,
      negotiation: 0.8,
      closing: 0.9
    };
    return scores[stage.toLowerCase()] || 0.5;
  }

  private getStageMultiplier(stage: string): number {
    const multipliers: Record<string, number> = {
      prospecting: 0.3,
      qualification: 0.5,
      proposal: 0.7,
      negotiation: 0.8,
      closing: 0.9
    };
    return multipliers[stage.toLowerCase()] || 0.5;
  }

  getRecommendations(dealId: string): NBARecommendation[] {
    return this.recommendations.get(dealId) || [];
  }

  async executeRecommendation(recommendationId: string, executedBy: string): Promise<void> {
    this.stats.recommendationsExecuted++;

    structuredLogger.info('NBA recommendation executed', {
      recommendationId,
      executedBy,
      requestId: ''
    });
  }

  getStats(): NBAStats {
    return this.stats;
  }

  updateConfig(newConfig: Partial<NBAConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('NBA configuration updated', {
      config: this.config,
      requestId: ''
    });
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    structuredLogger.info('Deals NBA service stopped', { requestId: '' });
  }
}

export const dealsNBAService = new DealsNBAService();
