import { structuredLogger } from './structured-logger.js';

// Deals NBA (Next Best Action) Explicable Service - PR-39
// Sistema de análisis predictivo de deals con explicabilidad de IA

interface Deal {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  
  // Financial Information
  financial: {
    value: number;
    currency: string;
    probability: number; // 0-100
    expectedValue: number;
    discount?: number;
    margin?: number;
  };
  
  // Timeline
  timeline: {
    createdDate: string;
    expectedCloseDate: string;
    actualCloseDate?: string;
    lastActivityDate: string;
    daysInStage: number;
    totalDays: number;
  };
  
  // Stakeholders
  stakeholders: {
    primaryContact: {
      id: string;
      name: string;
      email: string;
      role: string;
      influence: 'high' | 'medium' | 'low';
    };
    decisionMakers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      influence: 'high' | 'medium' | 'low';
    }>;
    champions: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
  };
  
  // Company Information
  company: {
    id: string;
    name: string;
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    annualRevenue?: number;
    employeeCount?: number;
    location: {
      country: string;
      region: string;
      city: string;
    };
  };
  
  // Deal Characteristics
  characteristics: {
    dealType: 'new_business' | 'upsell' | 'cross_sell' | 'renewal' | 'expansion';
    salesCycle: 'short' | 'medium' | 'long';
    complexity: 'simple' | 'moderate' | 'complex';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    competition: 'none' | 'low' | 'medium' | 'high';
  };
  
  // Activities and Interactions
  activities: Array<{
    id: string;
    type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'negotiation' | 'other';
    date: string;
    description: string;
    outcome: 'positive' | 'neutral' | 'negative';
    nextSteps?: string;
  }>;
  
  // NBA Analysis
  nbaAnalysis?: {
    nextBestAction: string;
    confidence: number; // 0-100
    reasoning: string[];
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
      explanation: string;
    }>;
    alternatives: Array<{
      action: string;
      confidence: number;
      reasoning: string;
    }>;
    lastAnalyzed: string;
  };
  
  // Risk Assessment
  riskAssessment?: {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      probability: number; // 0-100
      impact: string;
      mitigation?: string;
    }>;
    riskScore: number; // 0-100
  };
  
  // Metadata
  metadata: {
    source: string;
    lastUpdated: string;
    customFields?: Record<string, any>;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface NBAModel {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  version: string;
  isActive: boolean;
  
  // Model Configuration
  configuration: {
    algorithm: 'random_forest' | 'gradient_boosting' | 'neural_network' | 'ensemble';
    features: string[];
    targetVariable: string;
    trainingPeriod: {
      startDate: string;
      endDate: string;
    };
    validationSplit: number; // 0-1
  };
  
  // Performance Metrics
  performance: {
    accuracy: number; // 0-100
    precision: number; // 0-100
    recall: number; // 0-100
    f1Score: number; // 0-100
    auc: number; // 0-1
    lastEvaluated: string;
  };
  
  // Feature Importance
  featureImportance: Array<{
    feature: string;
    importance: number; // 0-1
    description: string;
  }>;
  
  // Model Interpretability
  interpretability: {
    shapValues: boolean;
    limeExplanations: boolean;
    featureInteractions: boolean;
    globalExplanations: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface NBAPrediction {
  id: string;
  dealId: string;
  organizationId: string;
  modelId: string;
  
  // Prediction Results
  prediction: {
    nextBestAction: string;
    confidence: number; // 0-100
    probability: number; // 0-1
    expectedOutcome: 'positive' | 'negative' | 'neutral';
    timeToAction: number; // days
  };
  
  // Explanations
  explanations: {
    globalExplanation: string;
    localExplanation: string;
    keyFactors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
      explanation: string;
    }>;
    featureContributions: Array<{
      feature: string;
      value: any;
      contribution: number;
      explanation: string;
    }>;
    counterfactuals?: Array<{
      scenario: string;
      expectedOutcome: string;
      changes: Array<{
        feature: string;
        currentValue: any;
        suggestedValue: any;
      }>;
    }>;
  };
  
  // Recommendations
  recommendations: {
    immediateActions: string[];
    mediumTermActions: string[];
    longTermActions: string[];
    riskMitigation: string[];
    opportunityMaximization: string[];
  };
  
  // Metadata
  metadata: {
    modelVersion: string;
    predictionDate: string;
    dataQuality: number; // 0-100
    confidenceThreshold: number; // 0-100
  };
  
  createdAt: string;
}

interface NBAInsight {
  id: string;
  organizationId: string;
  type: 'trend' | 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Insight Details
  details: {
    affectedDeals: string[];
    impact: {
      financial: number;
      probability: number;
      timeline: number;
    };
    evidence: Array<{
      type: 'data' | 'pattern' | 'correlation' | 'anomaly';
      description: string;
      confidence: number;
    }>;
    recommendations: string[];
  };
  
  // Analytics
  analytics: {
    discoveryDate: string;
    lastUpdated: string;
    status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
    assignedTo?: string;
    resolution?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

class DealsNBAService {
  private deals: Map<string, Deal> = new Map();
  private nbaModels: Map<string, NBAModel> = new Map();
  private predictions: Map<string, NBAPrediction> = new Map();
  private insights: Map<string, NBAInsight> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Deals NBA Explicable Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Demo deals
    const deal1: Deal = {
      id: 'deal_1',
      organizationId: 'demo-org-1',
      name: 'TechCorp Enterprise License',
      description: 'Licencia empresarial para 500 usuarios',
      stage: 'negotiation',
      status: 'active',
      financial: {
        value: 250000,
        currency: 'EUR',
        probability: 75,
        expectedValue: 187500,
        discount: 10,
        margin: 35
      },
      timeline: {
        createdDate: oneMonthAgo.toISOString(),
        expectedCloseDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivityDate: twoWeeksAgo.toISOString(),
        daysInStage: 14,
        totalDays: 30
      },
      stakeholders: {
        primaryContact: {
          id: 'contact_1',
          name: 'Carlos Ruiz',
          email: 'carlos.ruiz@techcorp.com',
          role: 'CEO',
          influence: 'high'
        },
        decisionMakers: [
          {
            id: 'contact_2',
            name: 'Ana Martín',
            email: 'ana.martin@techcorp.com',
            role: 'CFO',
            influence: 'high'
          }
        ],
        champions: [
          {
            id: 'contact_3',
            name: 'Luis García',
            email: 'luis.garcia@techcorp.com',
            role: 'CTO'
          }
        ]
      },
      company: {
        id: 'company_1',
        name: 'TechCorp Solutions',
        industry: 'Technology',
        size: 'medium',
        annualRevenue: 5000000,
        employeeCount: 150,
        location: {
          country: 'Spain',
          region: 'Madrid',
          city: 'Madrid'
        }
      },
      characteristics: {
        dealType: 'new_business',
        salesCycle: 'medium',
        complexity: 'moderate',
        urgency: 'medium',
        competition: 'medium'
      },
      activities: [
        {
          id: 'activity_1',
          type: 'meeting',
          date: twoWeeksAgo.toISOString(),
          description: 'Reunión inicial con stakeholders',
          outcome: 'positive',
          nextSteps: 'Enviar propuesta técnica'
        },
        {
          id: 'activity_2',
          type: 'demo',
          date: new Date(twoWeeksAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Demo del producto',
          outcome: 'positive',
          nextSteps: 'Negociar términos comerciales'
        }
      ],
      nbaAnalysis: {
        nextBestAction: 'Schedule negotiation meeting with CFO',
        confidence: 85,
        reasoning: [
          'High probability deal (75%)',
          'CFO involvement required for approval',
          'Timeline pressure (14 days to close)',
          'Positive stakeholder engagement'
        ],
        factors: [
          {
            factor: 'Deal Probability',
            impact: 'positive',
            weight: 0.3,
            explanation: 'Current 75% probability indicates strong likelihood of closing'
          },
          {
            factor: 'Timeline Pressure',
            impact: 'positive',
            weight: 0.25,
            explanation: '14 days remaining creates urgency for decision'
          },
          {
            factor: 'Stakeholder Engagement',
            impact: 'positive',
            weight: 0.2,
            explanation: 'Positive outcomes from recent activities'
          },
          {
            factor: 'Competition',
            impact: 'negative',
            weight: 0.15,
            explanation: 'Medium competition level requires differentiation'
          },
          {
            factor: 'Deal Size',
            impact: 'positive',
            weight: 0.1,
            explanation: 'Large deal value (€250K) increases priority'
          }
        ],
        alternatives: [
          {
            action: 'Send detailed proposal with pricing',
            confidence: 70,
            reasoning: 'Provide comprehensive information for decision making'
          },
          {
            action: 'Schedule demo with technical team',
            confidence: 60,
            reasoning: 'Address technical concerns and build confidence'
          }
        ],
        lastAnalyzed: now.toISOString()
      },
      riskAssessment: {
        overallRisk: 'medium',
        riskFactors: [
          {
            factor: 'Competition',
            severity: 'medium',
            probability: 60,
            impact: 'Competitor may offer better terms',
            mitigation: 'Highlight unique value proposition'
          },
          {
            factor: 'Budget Approval',
            severity: 'high',
            probability: 30,
            impact: 'CFO may not approve budget',
            mitigation: 'Provide ROI analysis and case studies'
          }
        ],
        riskScore: 45
      },
      metadata: {
        source: 'CRM',
        lastUpdated: now.toISOString()
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: now.toISOString()
    };

    const deal2: Deal = {
      id: 'deal_2',
      organizationId: 'demo-org-1',
      name: 'GreenTech Platform Integration',
      description: 'Integración de plataforma para gestión de energía',
      stage: 'proposal',
      status: 'active',
      financial: {
        value: 120000,
        currency: 'EUR',
        probability: 60,
        expectedValue: 72000,
        discount: 5,
        margin: 40
      },
      timeline: {
        createdDate: twoWeeksAgo.toISOString(),
        expectedCloseDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivityDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        daysInStage: 3,
        totalDays: 14
      },
      stakeholders: {
        primaryContact: {
          id: 'contact_4',
          name: 'Laura Sánchez',
          email: 'laura.sanchez@greentech.com',
          role: 'Founder & CEO',
          influence: 'high'
        },
        decisionMakers: [
          {
            id: 'contact_5',
            name: 'Miguel Torres',
            email: 'miguel.torres@greentech.com',
            role: 'CTO',
            influence: 'high'
          }
        ],
        champions: []
      },
      company: {
        id: 'company_2',
        name: 'GreenTech Innovations',
        industry: 'Clean Technology',
        size: 'startup',
        annualRevenue: 1200000,
        employeeCount: 45,
        location: {
          country: 'Spain',
          region: 'Cataluña',
          city: 'Barcelona'
        }
      },
      characteristics: {
        dealType: 'new_business',
        salesCycle: 'short',
        complexity: 'simple',
        urgency: 'high',
        competition: 'low'
      },
      activities: [
        {
          id: 'activity_3',
          type: 'call',
          date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Llamada inicial de calificación',
          outcome: 'positive',
          nextSteps: 'Enviar propuesta técnica'
        },
        {
          id: 'activity_4',
          type: 'proposal',
          date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Propuesta enviada',
          outcome: 'neutral',
          nextSteps: 'Seguimiento en 48 horas'
        }
      ],
      nbaAnalysis: {
        nextBestAction: 'Follow up on proposal with technical questions',
        confidence: 70,
        reasoning: [
          'Proposal sent 3 days ago',
          'High urgency deal',
          'Technical decision maker involved',
          'Low competition environment'
        ],
        factors: [
          {
            factor: 'Urgency',
            impact: 'positive',
            weight: 0.3,
            explanation: 'High urgency creates momentum for quick decision'
          },
          {
            factor: 'Competition',
            impact: 'positive',
            weight: 0.25,
            explanation: 'Low competition reduces risk of losing deal'
          },
          {
            factor: 'Deal Probability',
            impact: 'neutral',
            weight: 0.2,
            explanation: '60% probability indicates moderate likelihood'
          },
          {
            factor: 'Company Size',
            impact: 'negative',
            weight: 0.15,
            explanation: 'Startup may have budget constraints'
          },
          {
            factor: 'Technical Complexity',
            impact: 'positive',
            weight: 0.1,
            explanation: 'Simple integration reduces implementation risk'
          }
        ],
        alternatives: [
          {
            action: 'Schedule technical demo',
            confidence: 65,
            reasoning: 'Address technical concerns and build confidence'
          },
          {
            action: 'Provide case studies and references',
            confidence: 55,
            reasoning: 'Build trust with startup by showing success stories'
          }
        ],
        lastAnalyzed: now.toISOString()
      },
      riskAssessment: {
        overallRisk: 'low',
        riskFactors: [
          {
            factor: 'Budget Constraints',
            severity: 'medium',
            probability: 40,
            impact: 'Startup may not have budget for full solution',
            mitigation: 'Offer flexible payment terms'
          }
        ],
        riskScore: 25
      },
      metadata: {
        source: 'CRM',
        lastUpdated: now.toISOString()
      },
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: now.toISOString()
    };

    this.deals.set(deal1.id, deal1);
    this.deals.set(deal2.id, deal2);

    // Demo NBA Model
    const model1: NBAModel = {
      id: 'model_1',
      organizationId: 'demo-org-1',
      name: 'Deal Success Prediction Model',
      description: 'Modelo para predecir el éxito de deals y recomendar acciones',
      version: '1.2.0',
      isActive: true,
      configuration: {
        algorithm: 'ensemble',
        features: [
          'deal_value', 'probability', 'days_in_stage', 'stakeholder_count',
          'activity_frequency', 'company_size', 'industry', 'competition_level',
          'urgency', 'complexity', 'deal_type', 'last_activity_days'
        ],
        targetVariable: 'deal_success',
        trainingPeriod: {
          startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: oneMonthAgo.toISOString()
        },
        validationSplit: 0.2
      },
      performance: {
        accuracy: 87.5,
        precision: 85.2,
        recall: 89.1,
        f1Score: 87.1,
        auc: 0.92,
        lastEvaluated: oneMonthAgo.toISOString()
      },
      featureImportance: [
        {
          feature: 'deal_probability',
          importance: 0.25,
          description: 'Current probability of deal closing'
        },
        {
          feature: 'stakeholder_engagement',
          importance: 0.20,
          description: 'Level of stakeholder involvement and engagement'
        },
        {
          feature: 'timeline_pressure',
          importance: 0.15,
          description: 'Days remaining until expected close date'
        },
        {
          feature: 'competition_level',
          importance: 0.12,
          description: 'Level of competitive pressure'
        },
        {
          feature: 'deal_value',
          importance: 0.10,
          description: 'Monetary value of the deal'
        },
        {
          feature: 'company_size',
          importance: 0.08,
          description: 'Size of the target company'
        },
        {
          feature: 'activity_frequency',
          importance: 0.06,
          description: 'Frequency of recent activities'
        },
        {
          feature: 'industry',
          importance: 0.04,
          description: 'Industry of the target company'
        }
      ],
      interpretability: {
        shapValues: true,
        limeExplanations: true,
        featureInteractions: true,
        globalExplanations: true
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.nbaModels.set(model1.id, model1);

    // Demo insights
    const insight1: NBAInsight = {
      id: 'insight_1',
      organizationId: 'demo-org-1',
      type: 'pattern',
      title: 'High-Value Deals in Negotiation Stage',
      description: 'Deals with value >€200K in negotiation stage have 85% higher success rate when CFO is involved',
      severity: 'high',
      details: {
        affectedDeals: ['deal_1'],
        impact: {
          financial: 250000,
          probability: 15,
          timeline: -5
        },
        evidence: [
          {
            type: 'pattern',
            description: 'Historical analysis shows 85% success rate when CFO is involved in negotiation',
            confidence: 92
          },
          {
            type: 'correlation',
            description: 'Strong correlation between CFO involvement and deal success',
            confidence: 88
          }
        ],
        recommendations: [
          'Ensure CFO involvement in all high-value negotiations',
          'Schedule CFO meetings early in negotiation stage',
          'Prepare financial ROI analysis for CFO review'
        ]
      },
      analytics: {
        discoveryDate: now.toISOString(),
        lastUpdated: now.toISOString(),
        status: 'new'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.insights.set(insight1.id, insight1);
  }

  // Deal Management
  async getDeals(organizationId: string, filters: {
    stage?: string;
    status?: string;
    minValue?: number;
    maxValue?: number;
    minProbability?: number;
    maxProbability?: number;
    hasNBA?: boolean;
    search?: string;
    limit?: number;
  } = {}): Promise<Deal[]> {
    let deals = Array.from(this.deals.values())
      .filter(d => d.organizationId === organizationId);

    if (filters.stage) {
      deals = deals.filter(d => d.stage === filters.stage);
    }

    if (filters.status) {
      deals = deals.filter(d => d.status === filters.status);
    }

    if (filters.minValue !== undefined) {
      deals = deals.filter(d => d.financial.value >= filters.minValue!);
    }

    if (filters.maxValue !== undefined) {
      deals = deals.filter(d => d.financial.value <= filters.maxValue!);
    }

    if (filters.minProbability !== undefined) {
      deals = deals.filter(d => d.financial.probability >= filters.minProbability!);
    }

    if (filters.maxProbability !== undefined) {
      deals = deals.filter(d => d.financial.probability <= filters.maxProbability!);
    }

    if (filters.hasNBA !== undefined) {
      deals = deals.filter(d => filters.hasNBA ? !!d.nbaAnalysis : !d.nbaAnalysis);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      deals = deals.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.company.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.limit) {
      deals = deals.slice(0, filters.limit);
    }

    return deals.sort((a, b) => b.financial.expectedValue - a.financial.expectedValue);
  }

  async getDeal(dealId: string): Promise<Deal | undefined> {
    return this.deals.get(dealId);
  }

  // NBA Analysis
  async analyzeDeal(dealId: string): Promise<NBAPrediction> {
    const deal = this.deals.get(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const model = Array.from(this.nbaModels.values())
      .find(m => m.organizationId === deal.organizationId && m.isActive);

    if (!model) {
      throw new Error('No active NBA model found');
    }

    // Simulate NBA analysis
    const prediction = await this.generateNBAPrediction(deal, model);
    this.predictions.set(prediction.id, prediction);

    // Update deal with NBA analysis
    deal.nbaAnalysis = {
      nextBestAction: prediction.prediction.nextBestAction,
      confidence: prediction.prediction.confidence,
      reasoning: prediction.explanations.keyFactors.map(f => f.explanation),
      factors: prediction.explanations.keyFactors,
      alternatives: prediction.explanations.keyFactors.map(f => ({
        action: f.factor,
        confidence: Math.round(f.weight * 100),
        reasoning: f.explanation
      })),
      lastAnalyzed: new Date().toISOString()
    };

    deal.updatedAt = new Date().toISOString();

    structuredLogger.info('NBA analysis completed', { 
      dealId, 
      organizationId: deal.organizationId,
      nextBestAction: prediction.prediction.nextBestAction,
      confidence: prediction.prediction.confidence
    });

    return prediction;
  }

  private async generateNBAPrediction(deal: Deal, model: NBAModel): Promise<NBAPrediction> {
    const now = new Date().toISOString();
    const predictionId = `prediction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Simulate prediction based on deal characteristics
    let nextBestAction = 'Continue current approach';
    let confidence = 50;
    let probability = 0.5;

    // Analyze deal characteristics
    if (deal.stage === 'negotiation' && deal.financial.probability > 70) {
      nextBestAction = 'Schedule negotiation meeting with CFO';
      confidence = 85;
      probability = 0.75;
    } else if (deal.stage === 'proposal' && deal.characteristics.urgency === 'high') {
      nextBestAction = 'Follow up on proposal with technical questions';
      confidence = 70;
      probability = 0.60;
    } else if (deal.stage === 'qualified' && deal.characteristics.competition === 'high') {
      nextBestAction = 'Schedule competitive differentiation meeting';
      confidence = 75;
      probability = 0.65;
    }

    // Generate explanations
    const keyFactors = this.generateKeyFactors(deal);
    const featureContributions = this.generateFeatureContributions(deal, model);

    return {
      id: predictionId,
      dealId: deal.id,
      organizationId: deal.organizationId,
      modelId: model.id,
      prediction: {
        nextBestAction,
        confidence,
        probability,
        expectedOutcome: probability > 0.6 ? 'positive' : probability < 0.4 ? 'negative' : 'neutral',
        timeToAction: this.calculateTimeToAction(deal)
      },
      explanations: {
        globalExplanation: `Based on historical data, deals with similar characteristics have a ${Math.round(probability * 100)}% success rate.`,
        localExplanation: `This deal shows ${keyFactors.filter(f => f.impact === 'positive').length} positive factors and ${keyFactors.filter(f => f.impact === 'negative').length} negative factors.`,
        keyFactors,
        featureContributions,
        counterfactuals: this.generateCounterfactuals(deal)
      },
      recommendations: {
        immediateActions: this.generateImmediateActions(deal),
        mediumTermActions: this.generateMediumTermActions(deal),
        longTermActions: this.generateLongTermActions(deal),
        riskMitigation: this.generateRiskMitigation(deal),
        opportunityMaximization: this.generateOpportunityMaximization(deal)
      },
      metadata: {
        modelVersion: model.version,
        predictionDate: now,
        dataQuality: this.calculateDataQuality(deal),
        confidenceThreshold: 70
      },
      createdAt: now
    };
  }

  private generateKeyFactors(deal: Deal): Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    explanation: string;
  }> {
    const factors = [];

    // Deal probability
    if (deal.financial.probability > 70) {
      factors.push({
        factor: 'Deal Probability',
        impact: 'positive' as const,
        weight: 0.3,
        explanation: `High probability (${deal.financial.probability}%) indicates strong likelihood of closing`
      });
    } else if (deal.financial.probability < 40) {
      factors.push({
        factor: 'Deal Probability',
        impact: 'negative' as const,
        weight: 0.3,
        explanation: `Low probability (${deal.financial.probability}%) indicates risk of not closing`
      });
    }

    // Timeline pressure
    const daysToClose = Math.ceil((new Date(deal.timeline.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysToClose < 14) {
      factors.push({
        factor: 'Timeline Pressure',
        impact: 'positive' as const,
        weight: 0.25,
        explanation: `Only ${daysToClose} days remaining creates urgency for decision`
      });
    }

    // Stakeholder engagement
    const stakeholderCount = deal.stakeholders.decisionMakers.length + deal.stakeholders.champions.length;
    if (stakeholderCount > 2) {
      factors.push({
        factor: 'Stakeholder Engagement',
        impact: 'positive' as const,
        weight: 0.2,
        explanation: `Multiple stakeholders (${stakeholderCount}) involved increases engagement`
      });
    }

    // Competition
    if (deal.characteristics.competition === 'high') {
      factors.push({
        factor: 'Competition',
        impact: 'negative' as const,
        weight: 0.15,
        explanation: 'High competition level requires strong differentiation'
      });
    } else if (deal.characteristics.competition === 'low') {
      factors.push({
        factor: 'Competition',
        impact: 'positive' as const,
        weight: 0.15,
        explanation: 'Low competition reduces risk of losing deal'
      });
    }

    // Deal size
    if (deal.financial.value > 200000) {
      factors.push({
        factor: 'Deal Size',
        impact: 'positive' as const,
        weight: 0.1,
        explanation: `Large deal value (€${deal.financial.value.toLocaleString()}) increases priority`
      });
    }

    return factors;
  }

  private generateFeatureContributions(deal: Deal, model: NBAModel): Array<{
    feature: string;
    value: any;
    contribution: number;
    explanation: string;
  }> {
    const contributions = [];

    // Deal value contribution
    const valueContribution = Math.min(deal.financial.value / 500000, 1) * 0.1;
    contributions.push({
      feature: 'Deal Value',
      value: deal.financial.value,
      contribution: valueContribution,
      explanation: `Deal value of €${deal.financial.value.toLocaleString()} contributes ${Math.round(valueContribution * 100)}% to success probability`
    });

    // Probability contribution
    const probContribution = (deal.financial.probability / 100) * 0.25;
    contributions.push({
      feature: 'Deal Probability',
      value: deal.financial.probability,
      contribution: probContribution,
      explanation: `Current probability of ${deal.financial.probability}% contributes ${Math.round(probContribution * 100)}% to success probability`
    });

    // Timeline contribution
    const daysToClose = Math.ceil((new Date(deal.timeline.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const timelineContribution = Math.max(0, (30 - daysToClose) / 30) * 0.15;
    contributions.push({
      feature: 'Timeline Pressure',
      value: daysToClose,
      contribution: timelineContribution,
      explanation: `${daysToClose} days to close contributes ${Math.round(timelineContribution * 100)}% to success probability`
    });

    return contributions;
  }

  private generateCounterfactuals(deal: Deal): Array<{
    scenario: string;
    expectedOutcome: string;
    changes: Array<{
      feature: string;
      currentValue: any;
      suggestedValue: any;
    }>;
  }> {
    const counterfactuals = [];

    // Increase probability scenario
    if (deal.financial.probability < 80) {
      counterfactuals.push({
        scenario: 'Increase deal probability to 85%',
        expectedOutcome: 'Success probability increases by 15%',
        changes: [
          {
            feature: 'Deal Probability',
            currentValue: deal.financial.probability,
            suggestedValue: 85
          }
        ]
      });
    }

    // Reduce competition scenario
    if (deal.characteristics.competition === 'high') {
      counterfactuals.push({
        scenario: 'Reduce competition level to low',
        expectedOutcome: 'Success probability increases by 10%',
        changes: [
          {
            feature: 'Competition Level',
            currentValue: deal.characteristics.competition,
            suggestedValue: 'low'
          }
        ]
      });
    }

    return counterfactuals;
  }

  private generateImmediateActions(deal: Deal): string[] {
    const actions = [];

    if (deal.stage === 'negotiation') {
      actions.push('Schedule negotiation meeting with CFO');
      actions.push('Prepare financial ROI analysis');
    } else if (deal.stage === 'proposal') {
      actions.push('Follow up on proposal within 48 hours');
      actions.push('Address any technical questions');
    } else if (deal.stage === 'qualified') {
      actions.push('Schedule demo with technical team');
      actions.push('Prepare competitive differentiation materials');
    }

    return actions;
  }

  private generateMediumTermActions(deal: Deal): string[] {
    const actions = [];

    actions.push('Develop stakeholder engagement plan');
    actions.push('Create risk mitigation strategy');
    actions.push('Prepare contract negotiation materials');

    return actions;
  }

  private generateLongTermActions(deal: Deal): string[] {
    const actions = [];

    actions.push('Plan post-sale implementation support');
    actions.push('Identify upselling opportunities');
    actions.push('Develop customer success plan');

    return actions;
  }

  private generateRiskMitigation(deal: Deal): string[] {
    const risks = [];

    if (deal.characteristics.competition === 'high') {
      risks.push('Highlight unique value proposition');
      risks.push('Provide competitive analysis');
    }

    if (deal.financial.probability < 60) {
      risks.push('Increase stakeholder engagement');
      risks.push('Address concerns proactively');
    }

    return risks;
  }

  private generateOpportunityMaximization(deal: Deal): string[] {
    const opportunities = [];

    if (deal.financial.value > 200000) {
      opportunities.push('Explore multi-year contract options');
      opportunities.push('Identify additional use cases');
    }

    if (deal.characteristics.urgency === 'high') {
      opportunities.push('Leverage urgency for faster decision');
      opportunities.push('Offer limited-time incentives');
    }

    return opportunities;
  }

  private calculateTimeToAction(deal: Deal): number {
    // Calculate days until expected close date
    const daysToClose = Math.ceil((new Date(deal.timeline.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    // Adjust based on urgency
    if (deal.characteristics.urgency === 'critical') return 1;
    if (deal.characteristics.urgency === 'high') return Math.min(daysToClose, 3);
    if (deal.characteristics.urgency === 'medium') return Math.min(daysToClose, 7);
    return Math.min(daysToClose, 14);
  }

  private calculateDataQuality(deal: Deal): number {
    let quality = 0;
    let totalFields = 0;

    // Check required fields
    if (deal.name) { quality += 10; totalFields += 10; }
    if (deal.financial.value) { quality += 10; totalFields += 10; }
    if (deal.financial.probability) { quality += 10; totalFields += 10; }
    if (deal.stakeholders.primaryContact.name) { quality += 10; totalFields += 10; }
    if (deal.company.name) { quality += 10; totalFields += 10; }
    if (deal.timeline.expectedCloseDate) { quality += 10; totalFields += 10; }
    if (deal.activities.length > 0) { quality += 10; totalFields += 10; }
    if (deal.description) { quality += 10; totalFields += 10; }
    if (deal.stakeholders.decisionMakers.length > 0) { quality += 10; totalFields += 10; }
    if (deal.characteristics.dealType) { quality += 10; totalFields += 10; }

    return totalFields > 0 ? Math.round((quality / totalFields) * 100) : 0;
  }

  // Insights Management
  async getInsights(organizationId: string, filters: {
    type?: string;
    severity?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<NBAInsight[]> {
    let insights = Array.from(this.insights.values())
      .filter(i => i.organizationId === organizationId);

    if (filters.type) {
      insights = insights.filter(i => i.type === filters.type);
    }

    if (filters.severity) {
      insights = insights.filter(i => i.severity === filters.severity);
    }

    if (filters.status) {
      insights = insights.filter(i => i.analytics.status === filters.status);
    }

    if (filters.limit) {
      insights = insights.slice(0, filters.limit);
    }

    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Statistics
  async getNBAStats(organizationId: string) {
    const deals = Array.from(this.deals.values()).filter(d => d.organizationId === organizationId);
    const predictions = Array.from(this.predictions.values()).filter(p => p.organizationId === organizationId);
    const insights = Array.from(this.insights.values()).filter(i => i.organizationId === organizationId);
    const models = Array.from(this.nbaModels.values()).filter(m => m.organizationId === organizationId);

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentDeals = deals.filter(d => new Date(d.createdAt) >= last30Days);
    const recentPredictions = predictions.filter(p => new Date(p.createdAt) >= last30Days);

    return {
      totalDeals: deals.length,
      dealsWithNBA: deals.filter(d => d.nbaAnalysis).length,
      totalPredictions: predictions.length,
      averageConfidence: predictions.length > 0 ? 
        predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / predictions.length : 0,
      activeModels: models.filter(m => m.isActive).length,
      totalInsights: insights.length,
      criticalInsights: insights.filter(i => i.severity === 'critical').length,
      last30Days: {
        newDeals: recentDeals.length,
        newPredictions: recentPredictions.length,
        newInsights: insights.filter(i => new Date(i.createdAt) >= last30Days).length
      },
      byStage: deals.reduce((acc, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: deals.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byProbability: {
        high: deals.filter(d => d.financial.probability >= 80).length,
        medium: deals.filter(d => d.financial.probability >= 50 && d.financial.probability < 80).length,
        low: deals.filter(d => d.financial.probability < 50).length
      },
      totalValue: deals.reduce((sum, d) => sum + d.financial.value, 0),
      expectedValue: deals.reduce((sum, d) => sum + d.financial.expectedValue, 0)
    };
  }
}

export const dealsNBAService = new DealsNBAService();
