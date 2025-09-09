import { z } from 'zod';
import { getDatabaseService } from '../lib/database.service.js';
import { logger } from '../lib/logger.js';

// Schemas de validación
const CostOptimizationRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['model_switch', 'provider_switch', 'request_batching', 'cache_optimization', 'budget_alert', 'auto_scaling']),
  condition: z.object({
    metric: z.enum(['cost_per_request', 'daily_cost', 'monthly_cost', 'cost_efficiency', 'token_usage']),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
    threshold: z.number(),
    duration: z.number().positive()
  }),
  action: z.object({
    type: z.enum(['switch_to_cheaper_model', 'switch_to_cheaper_provider', 'enable_batching', 'enable_caching', 'send_alert', 'scale_down']),
    parameters: z.record(z.any()),
    priority: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const CostAnalysisSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  analysisType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  period: z.object({
    start: z.date(),
    end: z.date()
  }),
  summary: z.object({
    totalCost: z.number(),
    totalRequests: z.number(),
    averageCostPerRequest: z.number(),
    costEfficiency: z.number(),
    topModels: z.array(z.object({
      model: z.string(),
      cost: z.number(),
      requests: z.number(),
      efficiency: z.number()
    })),
    topProviders: z.array(z.object({
      provider: z.string(),
      cost: z.number(),
      requests: z.number(),
      efficiency: z.number()
    }))
  }),
  recommendations: z.array(z.object({
    type: z.string(),
    impact: z.number(),
    description: z.string(),
    implementation: z.string()
  })),
  generatedAt: z.date()
});

const CostAlertSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  type: z.enum(['budget_warning', 'budget_exceeded', 'cost_spike', 'inefficiency_detected', 'optimization_opportunity']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'acknowledged', 'resolved']),
  message: z.string(),
  currentValue: z.number(),
  threshold: z.number(),
  metadata: z.record(z.any()),
  triggeredAt: z.date(),
  resolvedAt: z.date().optional(),
  createdAt: z.date()
});

// Tipos TypeScript
export type CostOptimizationRule = z.infer<typeof CostOptimizationRuleSchema>;
export type CostAnalysis = z.infer<typeof CostAnalysisSchema>;
export type CostAlert = z.infer<typeof CostAlertSchema>;

export interface CostOptimizationRequest {
  organizationId: string;
  currentCost: number;
  currentUsage: {
    requests: number;
    tokens: number;
    models: string[];
    providers: string[];
  };
  budget: {
    daily: number;
    monthly: number;
    perRequest: number;
  };
}

export interface CostOptimizationResponse {
  optimized: boolean;
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
    impact: number;
    description: string;
    estimatedSavings: number;
  }>;
  recommendations: string[];
  metrics: {
    before: number;
    after: number;
    savings: number;
    efficiency: number;
  };
}

export interface CostTrend {
  period: string;
  cost: number;
  requests: number;
  efficiency: number;
  topModel: string;
  topProvider: string;
}

export class AICostOptimizationService {
  private db: ReturnType<typeof getDatabaseService>;
  private rulesCache: Map<string, CostOptimizationRule> = new Map();
  private alertsCache: Map<string, CostAlert> = new Map();
  private costHistory: Map<string, CostTrend[]> = new Map();

  // Modelos y sus costos por 1K tokens (EUR)
  private readonly MODEL_COSTS = {
    'mistral-instruct': { input: 0.14, output: 0.42, provider: 'mistral' },
    'gpt-4o-mini': { input: 0.15, output: 0.60, provider: 'azure-openai' },
    'gpt-4o': { input: 2.50, output: 10.00, provider: 'azure-openai' },
    'gpt-3.5-turbo': { input: 0.10, output: 0.30, provider: 'azure-openai' },
    'claude-3-haiku': { input: 0.20, output: 0.60, provider: 'anthropic' },
    'claude-3-sonnet': { input: 2.00, output: 8.00, provider: 'anthropic' }
  };

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.createTables();
      await this.loadOptimizationRules();
      await this.initializeDefaultRules();
      await this.startCostMonitoring();
      logger.info('AI Cost Optimization Service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize AI Cost Optimization Service', { error: error.message });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      // Tabla de reglas de optimización de costos
      `CREATE TABLE IF NOT EXISTS ai_cost_optimization_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('model_switch', 'provider_switch', 'request_batching', 'cache_optimization', 'budget_alert', 'auto_scaling')),
        condition JSONB NOT NULL,
        action JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla de análisis de costos
      `CREATE TABLE IF NOT EXISTS ai_cost_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        analysis_type VARCHAR(20) NOT NULL CHECK (analysis_type IN ('daily', 'weekly', 'monthly', 'custom')),
        period JSONB NOT NULL,
        summary JSONB NOT NULL,
        recommendations JSONB NOT NULL DEFAULT '[]',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla de alertas de costos
      `CREATE TABLE IF NOT EXISTS ai_cost_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('budget_warning', 'budget_exceeded', 'cost_spike', 'inefficiency_detected', 'optimization_opportunity')),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
        message TEXT NOT NULL,
        current_value DECIMAL(15,4) NOT NULL,
        threshold DECIMAL(15,4) NOT NULL,
        metadata JSONB DEFAULT '{}',
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla de métricas de costos
      `CREATE TABLE IF NOT EXISTS ai_cost_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        model VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost_eur DECIMAL(15,6) NOT NULL,
        efficiency_score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];

    for (const query of queries) {
      await this.db.query(query);
    }
  }

  private async loadOptimizationRules(): Promise<void> {
    try {
      const result = await this.db.query('SELECT * FROM ai_cost_optimization_rules WHERE is_active = true');
      this.rulesCache.clear();

      for (const row of result.rows) {
        this.rulesCache.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          type: row.type,
          condition: row.condition,
          action: row.action,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }

      logger.info(`Loaded ${this.rulesCache.size} cost optimization rules`);
    } catch (error: any) {
      logger.error('Failed to load cost optimization rules', { error: error.message });
    }
  }

  private async initializeDefaultRules(): Promise<void> {
    const defaultRules = [
      {
        name: 'High Cost Per Request Alert',
        description: 'Alert when cost per request exceeds €0.01',
        type: 'budget_alert',
        condition: {
          metric: 'cost_per_request',
          operator: 'gt',
          threshold: 0.01,
          duration: 300
        },
        action: {
          type: 'send_alert',
          parameters: { channels: ['email', 'slack'] },
          priority: 'high'
        }
      },
      {
        name: 'Switch to Cheaper Model',
        description: 'Switch to cheaper model when daily cost exceeds €10',
        type: 'model_switch',
        condition: {
          metric: 'daily_cost',
          operator: 'gt',
          threshold: 10,
          duration: 600
        },
        action: {
          type: 'switch_to_cheaper_model',
          parameters: { fallbackModel: 'gpt-3.5-turbo' },
          priority: 'medium'
        }
      },
      {
        name: 'Enable Request Batching',
        description: 'Enable request batching for high volume usage',
        type: 'request_batching',
        condition: {
          metric: 'token_usage',
          operator: 'gt',
          threshold: 10000,
          duration: 1800
        },
        action: {
          type: 'enable_batching',
          parameters: { batchSize: 10, maxWaitTime: 5000 },
          priority: 'low'
        }
      },
      {
        name: 'Monthly Budget Warning',
        description: 'Alert when monthly cost reaches 80% of budget',
        type: 'budget_alert',
        condition: {
          metric: 'monthly_cost',
          operator: 'gte',
          threshold: 0.8,
          duration: 3600
        },
        action: {
          type: 'send_alert',
          parameters: { channels: ['email', 'dashboard'] },
          priority: 'critical'
        }
      }
    ];

    for (const rule of defaultRules) {
      const existing = await this.db.query(
        'SELECT id FROM ai_cost_optimization_rules WHERE name = $1',
        [rule.name]
      );

      if (existing.rows.length === 0) {
        await this.db.query(
          `INSERT INTO ai_cost_optimization_rules (name, description, type, condition, action)
           VALUES ($1, $2, $3, $4, $5)`,
          [rule.name, rule.description, rule.type, JSON.stringify(rule.condition), JSON.stringify(rule.action)]
        );
      }
    }
  }

  private async startCostMonitoring(): Promise<void> {
    // Monitoreo de costos en background cada 5 minutos
    setInterval(async () => {
      try {
        await this.analyzeCostTrends();
        await this.evaluateOptimizationRules();
        await this.generateCostInsights();
      } catch (error: any) {
        logger.error('Cost monitoring error', { error: error.message });
      }
    }, 300000); // Cada 5 minutos
  }

  // Gestión de reglas de optimización
  async createOptimizationRule(rule: Omit<CostOptimizationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostOptimizationRule> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_cost_optimization_rules (name, description, type, condition, action, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          rule.name,
          rule.description,
          rule.type,
          JSON.stringify(rule.condition),
          JSON.stringify(rule.action),
          rule.isActive
        ]
      );

      const newRule = result.rows[0];
      this.rulesCache.set(newRule.id, newRule);

      logger.info('Cost optimization rule created', { ruleId: newRule.id, name: newRule.name });
      return {
        id: newRule.id,
        name: newRule.name,
        description: newRule.description,
        type: newRule.type,
        condition: newRule.condition,
        action: newRule.action,
        isActive: newRule.is_active,
        createdAt: newRule.created_at,
        updatedAt: newRule.updated_at
      };
    } catch (error: any) {
      logger.error('Failed to create cost optimization rule', { error: error.message });
      throw error;
    }
  }

  async getOptimizationRules(): Promise<CostOptimizationRule[]> {
    try {
      const result = await this.db.query('SELECT * FROM ai_cost_optimization_rules ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        condition: row.condition,
        action: row.action,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error: any) {
      logger.error('Failed to get cost optimization rules', { error: error.message });
      throw error;
    }
  }

  // Análisis de costos
  async generateCostAnalysis(organizationId: string, analysisType: CostAnalysis['analysisType'], period: { start: Date; end: Date }): Promise<CostAnalysis> {
    try {
      const metrics = await this.getCostMetrics(organizationId, period);

      const summary = {
        totalCost: metrics.reduce((sum, m) => sum + m.cost_eur, 0),
        totalRequests: metrics.length,
        averageCostPerRequest: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.cost_eur, 0) / metrics.length : 0,
        costEfficiency: this.calculateCostEfficiency(metrics),
        topModels: this.getTopModels(metrics),
        topProviders: this.getTopProviders(metrics)
      };

      const recommendations = this.generateRecommendations(summary, metrics);

      const analysis: CostAnalysis = {
        id: `analysis_${Date.now()}`,
        organizationId,
        analysisType,
        period,
        summary,
        recommendations,
        generatedAt: new Date()
      };

      // Guardar análisis en base de datos
      await this.db.query(
        `INSERT INTO ai_cost_analyses (organization_id, analysis_type, period, summary, recommendations)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          organizationId,
          analysisType,
          JSON.stringify(period),
          JSON.stringify(summary),
          JSON.stringify(recommendations);
        ]
      );

      logger.info('Cost analysis generated', {
        analysisId: analysis.id,
        organizationId,
        analysisType
      });

      return analysis;
    } catch (error: any) {
      logger.error('Failed to generate cost analysis', { error: error.message });
      throw error;
    }
  }

  private async getCostMetrics(organizationId: string, period: { start: Date; end: Date }): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM ai_cost_metrics
         WHERE organization_id = $1 AND timestamp BETWEEN $2 AND $3
         ORDER BY timestamp DESC`,
        [organizationId, period.start, period.end]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to get cost metrics', { error: error.message });
      return [];
    }
  }

  private calculateCostEfficiency(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const totalCost = metrics.reduce((sum, m) => sum + parseFloat(m.cost_eur), 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.input_tokens + m.output_tokens, 0);

    // Eficiencia = tokens por euro
    return totalCost > 0 ? totalTokens / totalCost : 0;
  }

  private getTopModels(metrics: any[]): CostAnalysis['summary']['topModels'] {
    const modelStats = new Map<string, { cost: number; requests: number; tokens: number }>();

    for (const metric of metrics) {
      const existing = modelStats.get(metric.model) || { cost: 0, requests: 0, tokens: 0 };
      modelStats.set(metric.model, {
        cost: existing.cost + parseFloat(metric.cost_eur),
        requests: existing.requests + 1,
        tokens: existing.tokens + metric.input_tokens + metric.output_tokens
      });
    }

    return Array.from(modelStats.entries());
      .map(([model, stats]) => ({
        model,
        cost: stats.cost,
        requests: stats.requests,
        efficiency: stats.cost > 0 ? stats.tokens / stats.cost : 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  }

  private getTopProviders(metrics: any[]): CostAnalysis['summary']['topProviders'] {
    const providerStats = new Map<string, { cost: number; requests: number; tokens: number }>();

    for (const metric of metrics) {
      const existing = providerStats.get(metric.provider) || { cost: 0, requests: 0, tokens: 0 };
      providerStats.set(metric.provider, {
        cost: existing.cost + parseFloat(metric.cost_eur),
        requests: existing.requests + 1,
        tokens: existing.tokens + metric.input_tokens + metric.output_tokens
      });
    }

    return Array.from(providerStats.entries());
      .map(([provider, stats]) => ({
        provider,
        cost: stats.cost,
        requests: stats.requests,
        efficiency: stats.cost > 0 ? stats.tokens / stats.cost : 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  }

  private generateRecommendations(summary: CostAnalysis['summary'], metrics: any[]): CostAnalysis['recommendations'] {
    const recommendations: CostAnalysis['recommendations'] = [];

    // Recomendación de modelo más eficiente
    if (summary.topModels.length > 0) {
      const mostEfficient = summary.topModels.reduce((prev, current) =>
        current.efficiency > prev.efficiency ? current : prev
      );
      const leastEfficient = summary.topModels.reduce((prev, current) =>
        current.efficiency < prev.efficiency ? current : prev
      );

      if (mostEfficient.efficiency > leastEfficient.efficiency * 1.5) {
        recommendations.push({
          type: 'model_optimization',
          impact: 0.3,
          description: `Switch from ${leastEfficient.model} to ${mostEfficient.model} for better cost efficiency`,
          implementation: `Update model selection logic to prefer ${mostEfficient.model} for similar tasks`
        });
      }
    }

    // Recomendación de batching
    if (summary.totalRequests > 1000) {
      recommendations.push({
        type: 'request_batching',
        impact: 0.2,
        description: 'Implement request batching to reduce API call overhead',
        implementation: 'Group similar requests and send them in batches of 10-20'
      });
    }

    // Recomendación de caching
    if (summary.averageCostPerRequest > 0.005) {
      recommendations.push({
        type: 'response_caching',
        impact: 0.4,
        description: 'Implement response caching for repeated queries',
        implementation: 'Cache responses for 1 hour for identical prompts'
      });
    }

    // Recomendación de provider switching
    if (summary.topProviders.length > 1) {
      const cheapest = summary.topProviders.reduce((prev, current) =>
        current.cost / current.requests < prev.cost / prev.requests ? current : prev
      );
      recommendations.push({
        type: 'provider_optimization',
        impact: 0.25,
        description: `Consider using ${cheapest.provider} more frequently for cost savings`,
        implementation: `Route more requests to ${cheapest.provider} when quality requirements allow`
      });
    }

    return recommendations;
  }

  // Optimización automática
  async optimizeCosts(request: CostOptimizationRequest): Promise<CostOptimizationResponse> {
    try {
      const beforeCost = request.currentCost;
      const actions: CostOptimizationResponse['actions'] = [];
      const recommendations: string[] = [];

      // Analizar uso actual y generar optimizaciones
      const analysis = await this.analyzeCurrentUsage(request);

      // Acción 1: Cambio de modelo más eficiente
      if (analysis.inefficientModels.length > 0) {
        const mostEfficient = analysis.efficientModels[0];
        const leastEfficient = analysis.inefficientModels[0];

        actions.push({
          type: 'switch_to_cheaper_model',
          parameters: {
            from: leastEfficient.model,
            to: mostEfficient.model,
            provider: mostEfficient.provider
          },
          impact: 0.3,
          description: `Switch from ${leastEfficient.model} to ${mostEfficient.model}`,
          estimatedSavings: (leastEfficient.costPerToken - mostEfficient.costPerToken) * request.currentUsage.tokens
        });
      }

      // Acción 2: Habilitar batching
      if (request.currentUsage.requests > 100) {
        actions.push({
          type: 'enable_batching',
          parameters: {
            batchSize: 10,
            maxWaitTime: 5000,
            enabledModels: request.currentUsage.models
          },
          impact: 0.15,
          description: 'Enable request batching for high-volume usage',
          estimatedSavings: request.currentCost * 0.15
        });
      }

      // Acción 3: Habilitar caching
      if (request.currentCost > 5) {
        actions.push({
          type: 'enable_caching',
          parameters: {
            ttl: 3600,
            maxSize: 1000,
            cacheKeyStrategy: 'prompt_hash'
          },
          impact: 0.4,
          description: 'Enable response caching for repeated queries',
          estimatedSavings: request.currentCost * 0.4
        });
      }

      // Acción 4: Cambio de provider
      if (analysis.cheaperProvider) {
        actions.push({
          type: 'switch_to_cheaper_provider',
          parameters: {
            from: analysis.currentProvider,
            to: analysis.cheaperProvider.provider,
            fallbackModel: analysis.cheaperProvider.model
          },
          impact: 0.25,
          description: `Switch to ${analysis.cheaperProvider.provider} for cost savings`,
          estimatedSavings: request.currentCost * 0.25
        });
      }

      // Calcular métricas finales
      const totalSavings = actions.reduce((sum, action) => sum + action.estimatedSavings, 0);
      const afterCost = beforeCost - totalSavings;
      const efficiency = afterCost > 0 ? (beforeCost - afterCost) / beforeCost : 0;

      // Generar recomendaciones
      if (actions.length > 0) {
        recommendations.push('Implement the suggested optimizations to reduce costs');
        recommendations.push('Monitor cost trends after implementing changes');
        recommendations.push('Consider setting up automated cost alerts');
      } else {
        recommendations.push('Current usage appears to be cost-optimized');
        recommendations.push('Continue monitoring for optimization opportunities');
      }

      logger.info('Cost optimization completed', {
        organizationId: request.organizationId,
        beforeCost,
        afterCost,
        totalSavings,
        actionsCount: actions.length
      });

      return {
        optimized: actions.length > 0,
        actions,
        recommendations,
        metrics: {
          before: beforeCost,
          after: afterCost,
          savings: totalSavings,
          efficiency
        }
      };
    } catch (error: any) {
      logger.error('Failed to optimize costs', { error: error.message });
      throw error;
    }
  }

  private async analyzeCurrentUsage(request: CostOptimizationRequest): Promise<any> {
    // Simular análisis de uso actual
    const models = request.currentUsage.models.map(model => {
      const costInfo = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];
      return {
        model,
        provider: costInfo?.provider || 'unknown',
        costPerToken: costInfo ? (costInfo.input + costInfo.output) / 2 : 0
      };
    });

    const efficientModels = models
      .filter(m => m.costPerToken > 0)
      .sort((a, b) => a.costPerToken - b.costPerToken);

    const inefficientModels = models
      .filter(m => m.costPerToken > 0)
      .sort((a, b) => b.costPerToken - a.costPerToken);

    const cheaperProvider = {
      provider: 'mistral',
      model: 'mistral-instruct',
      costPerToken: 0.28
    };

    return {
      efficientModels,
      inefficientModels,
      cheaperProvider,
      currentProvider: 'azure-openai'
    };
  }

  // Gestión de alertas
  async createCostAlert(alert: Omit<CostAlert, 'id' | 'triggeredAt' | 'createdAt'>): Promise<CostAlert> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_cost_alerts (organization_id, type, severity, status, message, current_value, threshold, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          alert.organizationId,
          alert.type,
          alert.severity,
          alert.status,
          alert.message,
          alert.currentValue,
          alert.threshold,
          JSON.stringify(alert.metadata || {});
        ]
      );

      const newAlert = result.rows[0];
      this.alertsCache.set(newAlert.id, newAlert);

      logger.warn('Cost alert created', {
        alertId: newAlert.id,
        type: newAlert.type,
        severity: newAlert.severity,
        organizationId: newAlert.organization_id
      });

      return {
        id: newAlert.id,
        organizationId: newAlert.organization_id,
        type: newAlert.type,
        severity: newAlert.severity,
        status: newAlert.status,
        message: newAlert.message,
        currentValue: parseFloat(newAlert.current_value),
        threshold: parseFloat(newAlert.threshold),
        metadata: newAlert.metadata,
        triggeredAt: newAlert.triggered_at,
        resolvedAt: newAlert.resolved_at,
        createdAt: newAlert.created_at
      };
    } catch (error: any) {
      logger.error('Failed to create cost alert', { error: error.message });
      throw error;
    }
  }

  async getCostAlerts(organizationId?: string): Promise<CostAlert[]> {
    try {
      let query = 'SELECT * FROM ai_cost_alerts';
      const params: any[] = [];

      if (organizationId) {
        query += ' WHERE organization_id = $1';
        params.push(organizationId);
      }

      query += ' ORDER BY triggered_at DESC';

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        organizationId: row.organization_id,
        type: row.type,
        severity: row.severity,
        status: row.status,
        message: row.message,
        currentValue: parseFloat(row.current_value),
        threshold: parseFloat(row.threshold),
        metadata: row.metadata,
        triggeredAt: row.triggered_at,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at
      }));
    } catch (error: any) {
      logger.error('Failed to get cost alerts', { error: error.message });
      throw error;
    }
  }

  // Métricas y tendencias
  async getCostTrends(organizationId: string, days: number = 30): Promise<CostTrend[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await this.db.query(
        `SELECT
           DATE(timestamp) as period,
           SUM(cost_eur) as cost,
           COUNT(*) as requests,
           AVG(efficiency_score) as efficiency,
           MODE() WITHIN GROUP (ORDER BY model) as top_model,
           MODE() WITHIN GROUP (ORDER BY provider) as top_provider
         FROM ai_cost_metrics
         WHERE organization_id = $1 AND timestamp >= $2
         GROUP BY DATE(timestamp)
         ORDER BY period DESC`,
        [organizationId, startDate]
      );

      return result.rows.map(row => ({
        period: row.period.toISOString().split('T')[0],
        cost: parseFloat(row.cost),
        requests: parseInt(row.requests),
        efficiency: parseFloat(row.efficiency),
        topModel: row.top_model,
        topProvider: row.top_provider
      }));
    } catch (error: any) {
      logger.error('Failed to get cost trends', { error: error.message });
      return [];
    }
  }

  // Monitoreo y análisis automático
  private async analyzeCostTrends(): Promise<void> {
    try {
      // Analizar tendencias de costos y detectar anomalías
      const organizations = await this.getActiveOrganizations();

      for (const orgId of organizations) {
        const trends = await this.getCostTrends(orgId, 7);
        if (trends.length > 1) {
          const recentCost = trends[0].cost;
          const averageCost = trends.reduce((sum, t) => sum + t.cost, 0) / trends.length;

          // Detectar picos de costos
          if (recentCost > averageCost * 2) {
            await this.createCostAlert({
              organizationId: orgId,
              type: 'cost_spike',
              severity: 'high',
              status: 'active',
              message: `Cost spike detected: €${recentCost.toFixed(2)} vs average €${averageCost.toFixed(2)}`,
              currentValue: recentCost,
              threshold: averageCost * 2,
              metadata: {
                averageCost,
                trend: trends.slice(0, 3).map(t => ({ period: t.period, cost: t.cost }))
              }
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to analyze cost trends', { error: error.message });
    }
  }

  private async evaluateOptimizationRules(): Promise<void> {
    try {
      for (const [ruleId, rule] of this.rulesCache) {
        if (!rule.isActive) continue;

        // Evaluar regla y ejecutar acción si es necesario
        const shouldExecute = await this.evaluateRule(rule);
        if (shouldExecute) {
          await this.executeOptimizationAction(rule);
        }
      }
    } catch (error: any) {
      logger.error('Failed to evaluate optimization rules', { error: error.message });
    }
  }

  private async evaluateRule(rule: CostOptimizationRule): Promise<boolean> {
    // Lógica simplificada de evaluación de reglas
    // En implementación real, esto consultaría métricas actuales
    return Math.random() > 0.8; // 20% de probabilidad de ejecutar
  }

  private async executeOptimizationAction(rule: CostOptimizationRule): Promise<void> {
    logger.info('Executing cost optimization action', {
      ruleId: rule.id,
      ruleName: rule.name,
      actionType: rule.action.type
    });
  }

  private async generateCostInsights(): Promise<void> {
    try {
      // Generar insights automáticos de costos
      const organizations = await this.getActiveOrganizations();

      for (const orgId of organizations) {
        const analysis = await this.generateCostAnalysis(orgId, 'daily', {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        });

        // Crear alerta si hay oportunidades de optimización
        if (analysis.recommendations.length > 0) {
          await this.createCostAlert({
            organizationId: orgId,
            type: 'optimization_opportunity',
            severity: 'medium',
            status: 'active',
            message: `Found ${analysis.recommendations.length} cost optimization opportunities`,
            currentValue: analysis.summary.totalCost,
            threshold: analysis.summary.totalCost * 0.8,
            metadata: {
              recommendations: analysis.recommendations,
              analysisId: analysis.id
            }
          });
        }
      }
    } catch (error: any) {
      logger.error('Failed to generate cost insights', { error: error.message });
    }
  }

  private async getActiveOrganizations(): Promise<string[]> {
    try {
      const result = await this.db.query(
        'SELECT DISTINCT organization_id FROM ai_cost_metrics WHERE timestamp >= NOW() - INTERVAL \'7 days\''
      );
      return result.rows.map(row => row.organization_id);
    } catch (error: any) {
      logger.error('Failed to get active organizations', { error: error.message });
      return [];
    }
  }

  // Health check
  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; services: Record<string, boolean>; lastCheck: Date }> {
    try {
      const services = {
        database: await this.checkDatabaseHealth(),
        rules: this.rulesCache.size > 0,
        monitoring: true
      };

      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyServices === totalServices) {
        status = 'healthy';
      } else if (healthyServices >= totalServices * 0.5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        services,
        lastCheck: new Date()
      };
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        services: { database: false, rules: false, monitoring: false },
        lastCheck: new Date()
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export const aiCostOptimizationService = new AICostOptimizationService();
