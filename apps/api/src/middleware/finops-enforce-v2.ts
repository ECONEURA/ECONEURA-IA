/**
 * FinOps Enforcement Middleware V2
 * FASE 3 - FINOPS ENFORCE
 * 
 * Funcionalidades:
 * - 402 BUDGET_EXCEEDED + evento + kill-switch
 * - Headers: X-Est-Cost-EUR, X-Budget-Pct, X-Latency-ms, X-Route, X-Correlation-Id
 * - Tests de límites de presupuesto
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { logger } from '../infrastructure/logger.js';
import { generateCorrelationId } from '../utils/correlation.js';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

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

// ============================================================================
// INTERFACES
// ============================================================================

export interface CostEstimate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

export interface BudgetLimits {
  dailyLimitEUR: number;
  monthlyLimitEUR: number;
  perRequestLimitEUR: number;
  warningThreshold: number;
  criticalThreshold: number;
  emergencyThreshold: number;
}

export interface CostStatus {
  orgId: string;
  currentDaily: number;
  currentMonthly: number;
  limits: BudgetLimits;
  status: 'healthy' | 'warning' | 'critical' | 'emergency';
  killSwitchActive: boolean;
  lastUpdated: Date;
}

export interface BudgetExceededEvent {
  type: 'BUDGET_EXCEEDED';
  orgId: string;
  currentCost: number;
  limit: number;
  period: 'daily' | 'monthly' | 'per_request';
  provider?: string;
  model?: string;
  route: string;
  correlationId: string;
  timestamp: Date;
  killSwitchActivated: boolean;
}

export interface FinOpsRequest extends Request {
  orgId?: string;
  userId?: string;
  correlationId?: string;
  costEstimate?: CostEstimate;
  startTime?: number;
}

// ============================================================================
// COST CALCULATOR
// ============================================================================

export class CostCalculator {
  private static readonly COST_PER_TOKEN = {
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

  static calculateCost(estimate: CostEstimate): number {
    const inputCost = estimate.inputTokens * estimate.costPerInputToken;
    const outputCost = estimate.outputTokens * estimate.costPerOutputToken;
    return inputCost + outputCost;
  }

  static estimateFromRequest(req: FinOpsRequest): CostEstimate {
    const bodySize = JSON.stringify(req.body || {}).length;
    const querySize = JSON.stringify(req.query || {}).length;
    const totalSize = bodySize + querySize;

    // Rough estimation: 1 token ≈ 4 characters
    const estimatedInputTokens = Math.ceil(totalSize / 4);
    const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.5); // Assume 50% output

    // Default to OpenAI GPT-4 pricing
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

  static getCostPerToken(provider: string, model: string): { input: number; output: number } {
    const providerCosts = this.COST_PER_TOKEN[provider as keyof typeof this.COST_PER_TOKEN];
    if (!providerCosts) {
      return { input: 0.00003, output: 0.00006 }; // Default to GPT-4
    }

    const modelCosts = providerCosts[model as keyof typeof providerCosts];
    if (!modelCosts) {
      return { input: 0.00003, output: 0.00006 }; // Default to GPT-4
    }

    return modelCosts;
  }
}

// ============================================================================
// BUDGET MANAGER
// ============================================================================

export class BudgetManager {
  private static instance: BudgetManager;
  private costStatus: Map<string, CostStatus> = new Map();
  private killSwitches: Map<string, boolean> = new Map();
  private eventListeners: ((event: BudgetExceededEvent) => void)[] = [];

  static getInstance(): BudgetManager {
    if (!this.instance) {
      this.instance = new BudgetManager();
    }
    return this.instance;
  }

  async getCostStatus(orgId: string): Promise<CostStatus> {
    let status = this.costStatus.get(orgId);
    
    if (!status) {
      // Initialize with default limits
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

  async updateCost(orgId: string, cost: number): Promise<CostStatus> {
    const status = await this.getCostStatus(orgId);
    
    // Update costs
    status.currentDaily += cost;
    status.currentMonthly += cost;
    status.lastUpdated = new Date();

    // Check thresholds
    const dailyRatio = status.currentDaily / status.limits.dailyLimitEUR;
    const monthlyRatio = status.currentMonthly / status.limits.monthlyLimitEUR;
    const maxRatio = Math.max(dailyRatio, monthlyRatio);

    if (maxRatio >= status.limits.emergencyThreshold) {
      status.status = 'emergency';
      this.activateKillSwitch(orgId);
    } else if (maxRatio >= status.limits.criticalThreshold) {
      status.status = 'critical';
    } else if (maxRatio >= status.limits.warningThreshold) {
      status.status = 'warning';
    } else {
      status.status = 'healthy';
    }

    status.killSwitchActive = this.killSwitches.has(orgId);
    this.costStatus.set(orgId, status);

    return status;
  }

  async validateRequest(orgId: string, cost: number): Promise<{
    allowed: boolean;
    status: CostStatus;
    exceededLimit?: 'daily' | 'monthly' | 'per_request';
  }> {
    const status = await this.getCostStatus(orgId);

    // Check kill switch
    if (this.killSwitches.has(orgId)) {
      return { allowed: false, status };
    }

    // Check per-request limit
    if (cost > status.limits.perRequestLimitEUR) {
      return { allowed: false, status, exceededLimit: 'per_request' };
    }

    // Check daily limit
    if (status.currentDaily + cost > status.limits.dailyLimitEUR) {
      return { allowed: false, status, exceededLimit: 'daily' };
    }

    // Check monthly limit
    if (status.currentMonthly + cost > status.limits.monthlyLimitEUR) {
      return { allowed: false, status, exceededLimit: 'monthly' };
    }

    return { allowed: true, status };
  }

  activateKillSwitch(orgId: string): void {
    this.killSwitches.set(orgId, true);
    
    logger.error('Kill switch activated', {
      org_id: orgId,
      reason: 'Emergency budget threshold exceeded'
    });

    // Auto-deactivate after 1 hour
    setTimeout(() => {
      this.killSwitches.delete(orgId);
      logger.info('Kill switch deactivated', { org_id: orgId });
    }, 60 * 60 * 1000);
  }

  resetKillSwitch(orgId: string): void {
    this.killSwitches.delete(orgId);
    logger.info('Kill switch reset', { org_id: orgId });
  }

  isKillSwitchActive(orgId: string): boolean {
    return this.killSwitches.has(orgId);
  }

  onBudgetExceeded(listener: (event: BudgetExceededEvent) => void): void {
    this.eventListeners.push(listener);
  }

  private emitBudgetExceeded(event: BudgetExceededEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error in budget exceeded listener', { error });
      }
    });
  }

  async setBudgetLimits(orgId: string, limits: Partial<BudgetLimits>): Promise<void> {
    const status = await this.getCostStatus(orgId);
    status.limits = { ...status.limits, ...limits };
    this.costStatus.set(orgId, status);
  }
}

// ============================================================================
// FINOPS ENFORCEMENT MIDDLEWARE
// ============================================================================

export class FinOpsEnforcementMiddleware {
  private budgetManager: BudgetManager;

  constructor() {
    this.budgetManager = BudgetManager.getInstance();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.budgetManager.onBudgetExceeded((event) => {
      logger.error('Budget exceeded event', event);
      
      // Emit to external systems (e.g., monitoring, alerts)
      this.emitBudgetExceededEvent(event);
    });
  }

  private emitBudgetExceededEvent(event: BudgetExceededEvent): void {
    // This would typically send to external monitoring systems
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

  public enforce = async (req: FinOpsRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startTime = Date.now();
      req.startTime = startTime;

      // Skip enforcement for non-AI endpoints
      if (!this.isAIEndpoint(req.path)) {
        return next();
      }

      // Get organization ID
      const orgId = req.orgId || req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_ORG_ID',
          message: 'Organization ID is required for AI requests'
        });
      }

      // Generate correlation ID if not present
      const correlationId = req.correlationId || generateCorrelationId();
      req.correlationId = correlationId;

      // Get cost estimate
      const costEstimate = req.costEstimate || CostCalculator.estimateFromRequest(req);
      const estimatedCost = CostCalculator.calculateCost(costEstimate);

      // Validate request against budget
      const validation = await this.budgetManager.validateRequest(orgId, estimatedCost);

      if (!validation.allowed) {
        const event: BudgetExceededEvent = {
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

        // Emit event
        this.budgetManager['emitBudgetExceeded'](event);

        // Set headers
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

      // Set headers for successful request
      this.setBudgetHeaders(res, {
        estimatedCost,
        budgetStatus: validation.status,
        correlationId,
        route: req.path,
        latency: Date.now() - startTime,
      });

      // Update cost after successful request
      req.on('finish', async () => {
        if (res.statusCode < 400) {
          await this.budgetManager.updateCost(orgId, estimatedCost);
        }
      });

      next();
    } catch (error) {
      logger.error('FinOps enforcement error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        org_id: req.orgId,
        path: req.path,
        correlation_id: req.correlationId,
      });

      // Fail open for enforcement errors (don't block requests)
      next();
    }
  };

  private isAIEndpoint(path: string): boolean {
    return path.includes('/ai/') || 
           path.includes('/chat/') || 
           path.includes('/agents/') ||
           path.includes('/completion/') ||
           path.includes('/embedding/');
  }

  private setBudgetHeaders(
    res: Response,
    data: {
      estimatedCost: number;
      budgetStatus: CostStatus;
      correlationId: string;
      route: string;
      latency: number;
    }
  ): void {
    const { estimatedCost, budgetStatus, correlationId, route, latency } = data;

    // Required headers from FASE 3
    res.set('X-Est-Cost-EUR', estimatedCost.toFixed(6));
    res.set('X-Budget-Pct', this.calculateBudgetPercentage(budgetStatus).toFixed(2));
    res.set('X-Latency-ms', latency.toString());
    res.set('X-Route', route);
    res.set('X-Correlation-Id', correlationId);

    // Additional helpful headers
    res.set('X-Budget-Daily', budgetStatus.currentDaily.toFixed(4));
    res.set('X-Budget-Monthly', budgetStatus.currentMonthly.toFixed(4));
    res.set('X-Budget-Status', budgetStatus.status);
    res.set('X-Kill-Switch', budgetStatus.killSwitchActive.toString());
  }

  private calculateBudgetPercentage(status: CostStatus): number {
    const dailyRatio = status.currentDaily / status.limits.dailyLimitEUR;
    const monthlyRatio = status.currentMonthly / status.limits.monthlyLimitEUR;
    return Math.max(dailyRatio, monthlyRatio) * 100;
  }

  // Public methods for external access
  public async getCostStatus(orgId: string): Promise<CostStatus> {
    return this.budgetManager.getCostStatus(orgId);
  }

  public async setBudgetLimits(orgId: string, limits: Partial<BudgetLimits>): Promise<void> {
    return this.budgetManager.setBudgetLimits(orgId, limits);
  }

  public resetKillSwitch(orgId: string): void {
    this.budgetManager.resetKillSwitch(orgId);
  }

  public isKillSwitchActive(orgId: string): boolean {
    return this.budgetManager.isKillSwitchActive(orgId);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const finOpsEnforcement = new FinOpsEnforcementMiddleware();
export const finOpsEnforce = finOpsEnforcement.enforce;
