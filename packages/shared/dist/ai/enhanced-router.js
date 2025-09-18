import { z } from 'zod';
import { logger } from '../logging.js';
import { prometheus } from '../metrics.js';
import { CostGuardrails } from './cost-guardrails.js';
import { LLMProviderManager } from './providers.js';
import { costMeter } from '../cost-meter.js';
import { env } from '../env.js';
import { tracer, meter } from '../otel.js';
const AIRequestSchema = z.object({
    orgId: z.string(),
    prompt: z.string().min(1),
    model: z.string().optional(),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxCostEUR: z.number().positive().optional(),
    providerHint: z.enum(['mistral', 'azure-openai']).optional(),
    language: z.string().optional(),
    sensitivity: z.enum(['low', 'medium', 'high']).optional(),
});
const AIResponseSchema = z.object({
    content: z.string(),
    model: z.string(),
    provider: z.string(),
    tokens: z.object({
        input: z.number(),
        output: z.number(),
    }),
    costEUR: z.number(),
    latencyMs: z.number(),
    fallbackUsed: z.boolean(),
    requestId: z.string(),
});
export class EnhancedAIRouter {
    costGuardrails;
    providerManager;
    config;
    activeRequests = new Map();
    tracer = tracer;
    meter = meter;
    constructor(config = {}) {
        this.config = {
            costGuardrailsEnabled: true,
            telemetryEnabled: true,
            defaultMaxCostEUR: 1.0,
            emergencyStopEnabled: true,
            healthCheckInterval: 30000,
            ...config,
        };
        this.costGuardrails = new CostGuardrails();
        this.providerManager = new LLMProviderManager();
        if (this.config.costGuardrailsEnabled) {
            this.costGuardrails.onAlert((alert) => this.handleCostAlert(alert));
        }
        this.setupDefaultCostLimits();
        logger.info('Enhanced AI Router initialized', {
            cost_guardrails_enabled: this.config.costGuardrailsEnabled,
            telemetry: this.config.telemetryEnabled,
            emergency_stop: this.config.emergencyStopEnabled,
        });
    }
    async routeRequest(request) {
        const span = this.tracer.startSpan('ai_route_request');
        const requestId = this.generateRequestId(request.orgId);
        const startTime = Date.now();
        try {
            const validatedRequest = AIRequestSchema.parse(request);
            const capCheck = await costMeter.checkMonthlyCap(request.orgId);
            if (!capCheck.withinLimit) {
                throw new Error(`AI cost cap exceeded: ${capCheck.currentUsage}€/${capCheck.limit}€`);
            }
            const decision = await this.makeRoutingDecision(validatedRequest);
            this.activeRequests.set(requestId, {
                orgId: request.orgId,
                providerId: decision.provider,
                model: decision.model,
                startTime,
            });
            const result = await this.executeWithFallback(validatedRequest, decision, requestId);
            await this.recordRequestCompletion(requestId, true, result.costEUR, result.tokens.input, result.tokens.output);
            span.setAttribute('ai.request_id', requestId);
            span.setAttribute('ai.provider', result.provider);
            span.setAttribute('ai.model', result.model);
            span.setAttribute('ai.cost_eur', result.costEUR);
            span.setAttribute('ai.fallback_used', result.fallbackUsed);
            return result;
        }
        catch (error) {
            const errorType = this.classifyError(error);
            await this.recordRequestCompletion(requestId, false, 0, 0, 0, errorType);
            span.recordException(error);
            span.setAttribute('ai.error_type', errorType);
            span.setAttribute('ai.request_id', requestId);
            throw error;
        }
        finally {
            span.end();
        }
    }
    async makeRoutingDecision(request) {
        const span = this.tracer.startSpan('ai_make_routing_decision');
        try {
            const providers = await this.providerManager.getAllProviders();
            const mistralProvider = providers.find((p) => p.id === 'mistral');
            const azureProvider = providers.find((p) => p.id === 'azure-openai');
            if (!mistralProvider && !azureProvider) {
                throw new Error('No AI providers available');
            }
            const mistralHealth = mistralProvider ? this.providerManager.getProviderHealth(mistralProvider.id) : undefined;
            const azureHealth = azureProvider ? this.providerManager.getProviderHealth(azureProvider.id) : undefined;
            const mistralHealthy = mistralHealth?.status === 'healthy';
            const azureHealthy = azureHealth?.status === 'healthy';
            let primaryProvider;
            let fallbackProvider;
            let model;
            if (request.providerHint === 'azure-openai' && azureHealthy) {
                primaryProvider = 'azure-openai';
                fallbackProvider = mistralHealthy ? 'mistral' : undefined;
                model = request.model || 'gpt-4o-mini';
            }
            else if (mistralHealthy) {
                primaryProvider = 'mistral';
                fallbackProvider = azureHealthy ? 'azure-openai' : undefined;
                model = request.model || 'mistral-instruct';
            }
            else if (azureHealthy) {
                primaryProvider = 'azure-openai';
                model = request.model || 'gpt-4o-mini';
            }
            else {
                throw new Error('No healthy AI providers available');
            }
            const estimatedTokens = this.estimateTokens(request.prompt, request.maxTokens);
            const estimatedCost = costMeter.calculateCost(model, estimatedTokens, estimatedTokens * 0.5);
            const maxCost = request.maxCostEUR || this.config.defaultMaxCostEUR;
            if (estimatedCost > maxCost) {
                throw new Error(`Estimated cost ${estimatedCost}€ exceeds limit ${maxCost}€`);
            }
            const _attrs = {
                'ai.primary_provider': primaryProvider,
                'ai.fallback_provider': fallbackProvider,
                'ai.model': model,
                'ai.estimated_cost': estimatedCost,
            };
            const s1 = span;
            const s2 = span;
            if (typeof s1?.setAttributes === 'function') {
                s1.setAttributes(_attrs);
            }
            else if (typeof s2?.setAttribute === 'function') {
                Object.entries(_attrs).forEach(([k, v]) => s2.setAttribute(k, v));
            }
            return {
                provider: primaryProvider,
                model,
                maxRetries: 2,
                timeoutMs: 30000,
                fallbackProvider,
            };
        }
        finally {
            span.end();
        }
    }
    async executeWithFallback(request, decision, requestId) {
        const span = this.tracer.startSpan('ai_execute_with_fallback');
        try {
            try {
                return await this.executeRequest(request, decision.provider, decision.model, requestId, false);
            }
            catch (error) {
                logger.warn('Primary provider failed, attempting fallback', {
                    primary_provider: decision.provider,
                    fallback_provider: decision.fallbackProvider,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                if (decision.fallbackProvider) {
                    try {
                        return await this.executeRequest(request, decision.fallbackProvider, decision.model, requestId, true);
                    }
                    catch (fallbackError) {
                        throw new Error(`Both primary and fallback providers failed: ${error instanceof Error ? error.message : 'Unknown'}, ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
                    }
                }
                else {
                    throw error;
                }
            }
        }
        finally {
            span.end();
        }
    }
    async executeRequest(request, providerId, model, requestId, isFallback) {
        const span = this.tracer.startSpan('ai_execute_request');
        const startTime = Date.now();
        try {
            const provider = this.providerManager.getProvider(providerId);
            if (!provider) {
                throw new Error(`Provider ${providerId} not found`);
            }
            const providerRequest = {
                prompt: request.prompt,
                model,
                maxTokens: request.maxTokens || 1000,
                temperature: request.temperature || 0.7,
            };
            if (typeof provider.execute !== 'function') {
                throw new Error(`Provider ${provider.id} does not implement execute()`);
            }
            const response = await provider.execute(providerRequest);
            const costUsage = costMeter.recordUsage(request.orgId, model, response.tokens.input, response.tokens.output);
            const latency = Date.now() - startTime;
            const _execAttrs = {
                'ai.provider': providerId,
                'ai.model': model,
                'ai.cost_eur': costUsage.costEur,
                'ai.latency_ms': latency,
                'ai.fallback_used': isFallback,
            };
            const e1 = span;
            const e2 = span;
            if (typeof e1?.setAttributes === 'function') {
                e1.setAttributes(_execAttrs);
            }
            else if (typeof e2?.setAttribute === 'function') {
                Object.entries(_execAttrs).forEach(([k, v]) => e2.setAttribute(k, v));
            }
            return {
                content: response.content,
                model,
                provider: providerId,
                tokens: {
                    input: response.tokens.input,
                    output: response.tokens.output,
                },
                costEUR: costUsage.costEur,
                latencyMs: latency,
                fallbackUsed: isFallback,
                requestId,
            };
        }
        finally {
            span.end();
        }
    }
    async recordRequestCompletion(requestId, success, actualCost, tokensInput, tokensOutput, errorType) {
        const activeRequest = this.activeRequests.get(requestId);
        if (!activeRequest) {
            logger.warn('Request completion recorded for unknown request', { x_request_id: requestId });
            return;
        }
        const latency = Date.now() - activeRequest.startTime;
        const provider = this.providerManager.getProvider(activeRequest.providerId);
        if (!provider) {
            logger.error('Provider not found for completed request', undefined, {
                x_request_id: requestId,
                provider_id: activeRequest.providerId,
            });
            return;
        }
        if (this.config.costGuardrailsEnabled) {
            const usage = {
                orgId: activeRequest.orgId,
                provider: activeRequest.providerId,
                model: activeRequest.model,
                tokensInput,
                tokensOutput,
                costEUR: actualCost,
                latencyMs: latency,
                timestamp: new Date(),
                success,
                errorType,
            };
            this.costGuardrails.recordUsage(usage);
        }
        prometheus.aiRequestDuration.labels({
            provider: provider.id,
            status: success ? 'success' : 'error',
        }).observe(latency / 1000);
        if (!success && errorType) {
            prometheus.aiErrorsTotal.labels({
                org_id: requestId.split('-')[0],
                provider: provider.id,
                error_type: errorType,
            }).inc();
        }
        this.activeRequests.delete(requestId);
        logger.info('Request completion recorded', {
            x_request_id: requestId,
            provider_id: provider.id,
            success,
            actual_cost: actualCost,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            latency_ms: latency,
        });
    }
    handleCostAlert(alert) {
        logger.warn('Cost alert triggered', {
            org_id: alert.orgId,
            alert_type: alert.type,
            current_cost: alert.currentCost,
            limit: alert.limit,
        });
        if (this.config.emergencyStopEnabled && alert.type === 'emergency_stop') {
            logger.error(`Emergency stop triggered for organization ${alert.orgId}`);
        }
    }
    setupDefaultCostLimits() {
        this.costGuardrails.setCostLimits('default', {
            dailyLimitEUR: 5.0,
            monthlyLimitEUR: 50.0,
            perRequestLimitEUR: 5.0,
            warningThresholds: { daily: 80, monthly: 85 },
            emergencyStop: { enabled: true, thresholdEUR: 150.0 },
        });
    }
    generateRequestId(orgId) {
        return `${orgId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    estimateTokens(prompt, maxTokens) {
        const estimated = Math.ceil(prompt.length / 4);
        return maxTokens ? Math.min(estimated, maxTokens) : estimated;
    }
    classifyError(error) {
        if (error instanceof Error) {
            if (error.message.includes('cost cap exceeded'))
                return 'cost_cap_exceeded';
            if (error.message.includes('No AI providers available'))
                return 'no_providers';
            if (error.message.includes('timeout'))
                return 'timeout';
            if (error.message.includes('rate limit'))
                return 'rate_limit';
        }
        return 'unknown';
    }
    async getProviderHealth() {
        const providers = this.providerManager.getAllProviders();
        return providers.reduce((acc, provider) => {
            const health = this.providerManager.getProviderHealth(provider.id);
            acc[provider.id] = {
                health: health?.status ?? 'unknown',
                lastCheck: health?.lastCheck ?? null,
                models: provider.models,
            };
            return acc;
        }, {});
    }
    async getCostUsage(orgId) {
        const capCheck = await costMeter.checkMonthlyCap(orgId);
        return {
            currentMonthly: capCheck.currentUsage,
            limit: capCheck.limit,
            usagePercent: (capCheck.currentUsage / capCheck.limit) * 100,
        };
    }
}
export function createEnhancedAIRouter(config) {
    const defaultConfig = {
        costGuardrailsEnabled: env().NODE_ENV === 'production',
        telemetryEnabled: true,
        defaultMaxCostEUR: 1.0,
        emergencyStopEnabled: true,
        healthCheckInterval: 30000,
    };
    return new EnhancedAIRouter({ ...defaultConfig, ...config });
}
//# sourceMappingURL=enhanced-router.js.map