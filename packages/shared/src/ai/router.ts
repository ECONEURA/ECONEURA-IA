import { logger } from '../logging.js';
import { redactPII } from '../security.js';
import type { AIRequest, AIResponse } from '../types/models/ai.js';

// Router expects additional fields; extend locally to avoid changing shared model now
type RouterAIRequest = AIRequest & {
  org_id: string
  sensitivity?: 'pii' | 'confidential' | 'none'
  tokens_est: number
  budget_cents: number
  tools_needed: string[]
  languages: string[]
}

export interface RouterDecision {
  provider: 'mistral-edge' | 'openai-cloud' | 'azure-openai';
  endpoint: string;
  headers: Record<string, string>;
  shouldRedact: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface RouterConfig {
  mistralEdgeUrl: string;
  openaiApiKey?: string;
  azureOpenaiEndpoint?: string;
  azureOpenaiKey?: string;
  defaultProvider: 'mistral-edge' | 'openai-cloud' | 'azure-openai';
  costLimitsEnabled: boolean;
}

export class AIRouter {
  private config: RouterConfig;
  private costTracker: Map<string, number> = new Map(); // org_id -> cost_eur_this_month

  constructor(config: RouterConfig) {
    this.config = config;
  }

  /**
   * Routes AI request to appropriate provider based on decision matrix
   */
  async routeRequest(request: AIRequest): Promise<RouterDecision> {
    const r = request as unknown as RouterAIRequest;
    logger.info('Routing AI request', {
      org_id: r.org_id,
    });

    // Decision Matrix Implementation
    const decision = await this.makeRoutingDecision(r);

    logger.info('AI routing decision made', {
      org_id: r.org_id,
    });

    return decision;
  }

  private async makeRoutingDecision(request: RouterAIRequest): Promise<RouterDecision> {
    // Rule 1: PII/Sensitive data -> Edge only
    if (request.sensitivity === 'pii' || request.sensitivity === 'confidential') {
      return {
        provider: 'mistral-edge',
        endpoint: `${this.config.mistralEdgeUrl}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
        },
        shouldRedact: false, // No redaction needed for edge
        maxRetries: 2,
        timeoutMs: 30000,
      };
    }

    // Rule 2: Check cost budget
  const currentCost = this.costTracker.get(request.org_id) || 0;
  const estimatedCost = this.estimateCostEUR(request.tokens_est, 'openai-cloud');

    if (currentCost + estimatedCost > request.budget_cents / 100) {
      logger.logFinOpsEvent('Budget exceeded, routing to edge', {
        event_type: 'budget_exceeded',
    org_id: request.org_id,
        current_cost_eur: currentCost,
        budget_cap_eur: request.budget_cents / 100,
      });

      return {
        provider: 'mistral-edge',
        endpoint: `${this.config.mistralEdgeUrl}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
        },
        shouldRedact: false,
        maxRetries: 2,
        timeoutMs: 30000,
      };
    }

    // Rule 3: Special tools/languages -> Cloud
    const requiresCloudTools = request.tools_needed.some((tool: any) =>
      ['function_calling', 'vision', 'code_interpreter'].includes(tool)
    );

    const requiresSpecialLanguages = request.languages.some((lang: any) =>
      !['en', 'es', 'fr'].includes(lang)
    );

    if (requiresCloudTools || requiresSpecialLanguages) {
      if (this.config.openaiApiKey) {
        return {
          provider: 'openai-cloud',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${this.config.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          shouldRedact: true, // Redact PII for cloud
          maxRetries: 3,
          timeoutMs: 60000,
        };
      }
    }

    // Rule 4: Default routing with health check
    const edgeHealthy = await this.isEdgeHealthy();
    if (edgeHealthy) {
      return {
        provider: 'mistral-edge',
        endpoint: `${this.config.mistralEdgeUrl}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
        },
        shouldRedact: false,
        maxRetries: 2,
        timeoutMs: 30000,
      };
    }

    // Rule 5: Fallback to cloud if edge is down
    if (this.config.openaiApiKey) {
      logger.warn('Edge AI unavailable, falling back to cloud', {
        org_id: request.org_id,
      });

      return {
        provider: 'openai-cloud',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        shouldRedact: true,
        maxRetries: 3,
        timeoutMs: 60000,
      };
    }

    // Last resort: return edge anyway (will likely fail, but explicit)
    return {
      provider: 'mistral-edge',
      endpoint: `${this.config.mistralEdgeUrl}/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
      },
      shouldRedact: false,
      maxRetries: 1,
      timeoutMs: 10000,
    };
  }

  /**
   * Processes AI request with redaction if needed
   */
  async processRequest(
    content: string,
    decision: RouterDecision,
    request: AIRequest
  ): Promise<{ processedContent: string; tokens?: Record<string, string> }> {
    if (decision.shouldRedact) {
      const r = request as unknown as RouterAIRequest;
      const { redacted, tokens } = redactPII(content);
      logger.info('PII redacted for cloud processing', {
        org_id: r.org_id,
      });
      return { processedContent: redacted, tokens };
    }

    return { processedContent: content };
  }

  /**
   * Estimates cost in EUR for given tokens and provider
   */
  estimateCostEUR(tokens: number, provider: string): number {
    const costPer1KTokens = {
      'mistral-edge': 0.0, // Self-hosted
      'openai-cloud': 0.002, // GPT-4 pricing
      'azure-openai': 0.002,
    };

    const rate = costPer1KTokens[provider as keyof typeof costPer1KTokens] || 0.002;
    return (tokens / 1000) * rate;
  }

  /**
   * Updates cost tracking for organization
   */
  updateCostTracking(orgId: string, costEUR: number): void {
    const currentCost = this.costTracker.get(orgId) || 0;
    this.costTracker.set(orgId, currentCost + costEUR);

    logger.logFinOpsEvent('AI cost updated', {
      event_type: 'cost_calculation',
      org_id: orgId,
      current_cost_eur: currentCost + costEUR,
      budget_cap_eur: 0, // Will be filled by caller
    });
  }

  /**
   * Checks if edge AI service is healthy
   */
  private async isEdgeHealthy(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.mistralEdgeUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn('Edge AI health check failed');
      return false;
    }
  }

  /**
   * Gets current cost for organization
   */
  getCurrentCost(orgId: string): number {
    return this.costTracker.get(orgId) || 0;
  }

  /**
   * Resets monthly cost tracking (called by cron job)
   */
  resetMonthlyCosts(): void {
    this.costTracker.clear();
    logger.info('Monthly AI cost tracking reset');
  }

  /**
   * Checks if organization is within budget
   */
  isWithinBudget(orgId: string, budgetEUR: number): boolean {
    const currentCost = this.getCurrentCost(orgId);
    return currentCost < budgetEUR;
  }

  /**
   * Gets budget utilization percentage
   */
  getBudgetUtilization(orgId: string, budgetEUR: number): number {
    const currentCost = this.getCurrentCost(orgId);
    return budgetEUR > 0 ? (currentCost / budgetEUR) * 100 : 0;
  }
}

// Default configuration factory
export function createAIRouter(config?: Partial<RouterConfig>): AIRouter {
  const defaultConfig: RouterConfig = {
    mistralEdgeUrl: process.env.MISTRAL_BASE_URL || 'https://mistral-edge.internal:11434',
    openaiApiKey: process.env.OPENAI_API_KEY,
    azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenaiKey: process.env.AZURE_OPENAI_KEY,
    defaultProvider: ((val: unknown) => {
      const allowed = new Set(['mistral-edge','openai-cloud','azure-openai'] as const)
      return (typeof val === 'string' && allowed.has(val as any)) ? (val as typeof val & ('mistral-edge' | 'openai-cloud' | 'azure-openai')) : 'mistral-edge'
    })(process.env.ROUTER_DEFAULT_PROVIDER),
    costLimitsEnabled: process.env.NODE_ENV === 'production',
  };

  return new AIRouter({ ...defaultConfig, ...config });
}
