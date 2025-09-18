import { logger } from '../logging.js';
import { redactPII } from '../security.js';
export class AIRouter {
    config;
    costTracker = new Map();
    constructor(config) {
        this.config = config;
    }
    async routeRequest(request) {
        const r = request;
        logger.info('Routing AI request', {
            org_id: r.org_id,
        });
        const decision = await this.makeRoutingDecision(r);
        logger.info('AI routing decision made', {
            org_id: r.org_id,
        });
        return decision;
    }
    async makeRoutingDecision(request) {
        if (request.sensitivity === 'pii' || request.sensitivity === 'confidential') {
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
        const requiresCloudTools = request.tools_needed.some((tool) => ['function_calling', 'vision', 'code_interpreter'].includes(tool));
        const requiresSpecialLanguages = request.languages.some((lang) => !['en', 'es', 'fr'].includes(lang));
        if (requiresCloudTools || requiresSpecialLanguages) {
            if (this.config.openaiApiKey) {
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
        }
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
    async processRequest(content, decision, request) {
        if (decision.shouldRedact) {
            const r = request;
            const { redacted, tokens } = redactPII(content);
            logger.info('PII redacted for cloud processing', {
                org_id: r.org_id,
            });
            return { processedContent: redacted, tokens };
        }
        return { processedContent: content };
    }
    estimateCostEUR(tokens, provider) {
        const costPer1KTokens = {
            'mistral-edge': 0.0,
            'openai-cloud': 0.002,
            'azure-openai': 0.002,
        };
        const rate = costPer1KTokens[provider] || 0.002;
        return (tokens / 1000) * rate;
    }
    updateCostTracking(orgId, costEUR) {
        const currentCost = this.costTracker.get(orgId) || 0;
        this.costTracker.set(orgId, currentCost + costEUR);
        logger.logFinOpsEvent('AI cost updated', {
            event_type: 'cost_calculation',
            org_id: orgId,
            current_cost_eur: currentCost + costEUR,
            budget_cap_eur: 0,
        });
    }
    async isEdgeHealthy() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${this.config.mistralEdgeUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        catch (error) {
            logger.warn('Edge AI health check failed');
            return false;
        }
    }
    getCurrentCost(orgId) {
        return this.costTracker.get(orgId) || 0;
    }
    resetMonthlyCosts() {
        this.costTracker.clear();
        logger.info('Monthly AI cost tracking reset');
    }
    isWithinBudget(orgId, budgetEUR) {
        const currentCost = this.getCurrentCost(orgId);
        return currentCost < budgetEUR;
    }
    getBudgetUtilization(orgId, budgetEUR) {
        const currentCost = this.getCurrentCost(orgId);
        return budgetEUR > 0 ? (currentCost / budgetEUR) * 100 : 0;
    }
}
export function createAIRouter(config) {
    const defaultConfig = {
        mistralEdgeUrl: process.env.MISTRAL_BASE_URL || 'https://mistral-edge.internal:11434',
        openaiApiKey: process.env.OPENAI_API_KEY,
        azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenaiKey: process.env.AZURE_OPENAI_KEY,
        defaultProvider: ((val) => {
            const allowed = new Set(['mistral-edge', 'openai-cloud', 'azure-openai']);
            return (typeof val === 'string' && allowed.has(val)) ? val : 'mistral-edge';
        })(process.env.ROUTER_DEFAULT_PROVIDER),
        costLimitsEnabled: process.env.NODE_ENV === 'production',
    };
    return new AIRouter({ ...defaultConfig, ...config });
}
//# sourceMappingURL=router.js.map