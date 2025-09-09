/**
 * FinOps Enforcement Middleware
 * Blocks requests when budget limits are exceeded
 */

import { Request, Response, NextFunction } from 'express';
import { CostGuardrails } from '@econeura/shared/ai/cost-guardrails';
import { logger } from '@econeura/shared/monitoring/logger';

interface FinOpsRequest extends Request {
  orgId?: string;
  estimatedCost?: number;
  provider?: string;
  model?: string;
}

interface BudgetExceededResponse {
  error: 'BUDGET_EXCEEDED';
  message: string;
  details: {
    orgId: string;
    currentCost: number;
    limit: number;
    period: 'daily' | 'monthly' | 'request';
    provider?: string;
    model?: string;
  };
  retryAfter?: number;
}

export class FinOpsEnforcementMiddleware {
  private costGuardrails: CostGuardrails;
  private killSwitch: Map<string, boolean> = new Map();
  private alertThresholds = {
    warning: 0.8, // 80% of limit
    critical: 0.95, // 95% of limit
    emergency: 1.0 // 100% of limit
  };

  constructor() {
    this.costGuardrails = new CostGuardrails();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Listen for cost alerts
    this.costGuardrails.onAlert((alert) => {
      this.handleCostAlert(alert);
    });

    // Listen for emergency stops
    this.costGuardrails.onEmergencyStop((orgId) => {
      this.activateKillSwitch(orgId);
    });
  }

  private handleCostAlert(alert: any) {
    const { orgId, currentCost, limit, period } = alert;

    logger.warn('Cost alert triggered', {
      org_id: orgId,
      current_cost: currentCost,
      limit: limit,
      period: period,
      alert_type: alert.type
    });

    // Activate kill switch for emergency stops
    if (alert.type === 'emergency_stop') {
      this.activateKillSwitch(orgId);
    }
  }

  private activateKillSwitch(orgId: string) {
    this.killSwitch.set(orgId, true);

    logger.error('Kill switch activated', {
      org_id: orgId,
      reason: 'Emergency cost threshold exceeded'
    });

    // Auto-deactivate after 1 hour
    setTimeout(() => {
      this.killSwitch.delete(orgId);
      logger.info('Kill switch deactivated', { org_id: orgId });
    }, 60 * 60 * 1000);
  }

  private isKillSwitchActive(orgId: string): boolean {
    return this.killSwitch.has(orgId);
  }

  private createBudgetExceededResponse(
    orgId: string,
    currentCost: number,
    limit: number,
    period: 'daily' | 'monthly' | 'request',
    provider?: string,
    model?: string
  ): BudgetExceededResponse {
    const response: BudgetExceededResponse = {
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

    // Add retry-after header for rate limiting
    if (period === 'daily') {
      response.retryAfter = 24 * 60 * 60; // 24 hours
    } else if (period === 'monthly') {
      response.retryAfter = 30 * 24 * 60 * 60; // 30 days
    } else {
      response.retryAfter = 60; // 1 minute
    }

    return response;
  }

  /**
   * Main middleware function
   */
  public enforce = async (req: FinOpsRequest, res: Response, next: NextFunction) => {
    try {
      // Skip enforcement for non-AI endpoints
      if (!req.path.includes('/ai/') && !req.path.includes('/chat/')) {
        return next();
      }

      const orgId = req.orgId || req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({
          error: 'MISSING_ORG_ID',
          message: 'Organization ID is required for AI requests'
        });
      }

      // Check kill switch first
      if (this.isKillSwitchActive(orgId)) {
        const response = this.createBudgetExceededResponse(
          orgId,
          0,
          0,
          'monthly',
          req.provider,
          req.model
        );

        return res.status(402).json(response);
      }

      // Get estimated cost from request
      const estimatedCost = req.estimatedCost || this.estimateRequestCost(req);
      const provider = req.provider || 'unknown';
      const model = req.model || 'unknown';

      // Validate request against cost limits
      const validation = await this.costGuardrails.validateRequest(
        orgId,
        estimatedCost,
        provider,
        model
      );

      if (!validation.allowed) {
        const response = this.createBudgetExceededResponse(
          orgId,
          estimatedCost,
          validation.alert?.limit || 0,
          validation.alert?.period || 'request',
          provider,
          model
        );

        // Set retry-after header
        if (response.retryAfter) {
          res.set('Retry-After', response.retryAfter.toString());
        }

        return res.status(402).json(response);
      }

      // Add cost tracking headers
      res.set('X-Cost-Estimated', estimatedCost.toString());
      res.set('X-Cost-Limit', validation.alert?.limit?.toString() || '0');
      res.set('X-Cost-Period', validation.alert?.period || 'request');

      next();
    } catch (error) {
      logger.error('FinOps enforcement error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        org_id: req.orgId,
        path: req.path
      });

      // Fail open for enforcement errors (don't block requests)
      next();
    }
  };

  /**
   * Estimate cost for a request
   */
  private estimateRequestCost(req: FinOpsRequest): number {
    // Basic cost estimation based on request size
    const bodySize = JSON.stringify(req.body || {}).length;
    const querySize = JSON.stringify(req.query || {}).length;
    const totalSize = bodySize + querySize;

    // Rough estimation: 1 token ≈ 4 characters, $0.002 per 1K tokens
    const estimatedTokens = Math.ceil(totalSize / 4);
    const costPerToken = 0.002 / 1000; // $0.002 per 1K tokens

    return estimatedTokens * costPerToken;
  }

  /**
   * Get current cost status for an organization
   */
  public async getCostStatus(orgId: string) {
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
    } catch (error) {
      logger.error('Error getting cost status', {
        org_id: orgId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private getCostStatusLevel(
    daily: number,
    monthly: number,
    limits: any
  ): 'healthy' | 'warning' | 'critical' | 'emergency' {
    const dailyRatio = daily / limits.dailyLimitEUR;
    const monthlyRatio = monthly / limits.monthlyLimitEUR;
    const maxRatio = Math.max(dailyRatio, monthlyRatio);

    if (maxRatio >= this.alertThresholds.emergency) {
      return 'emergency';
    } else if (maxRatio >= this.alertThresholds.critical) {
      return 'critical';
    } else if (maxRatio >= this.alertThresholds.warning) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Reset kill switch for an organization (admin only)
   */
  public resetKillSwitch(orgId: string) {
    this.killSwitch.delete(orgId);
    logger.info('Kill switch reset', { org_id: orgId });
  }
}

// Export singleton instance
export const finOpsEnforcement = new FinOpsEnforcementMiddleware();

// Export middleware function
export const finOpsEnforce = finOpsEnforcement.enforce;

