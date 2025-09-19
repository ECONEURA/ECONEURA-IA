import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';
import { AppError } from '../lib/errors.js';
export class AzureOpenAIService {
    client;
    defaultModel;
    constructor(config) {
        const endpoint = config?.endpoint || process.env.AZURE_OPENAI_API_ENDPOINT;
        const apiKey = config?.apiKey || process.env.AZURE_OPENAI_API_KEY;
        if (!endpoint || !apiKey) {
            throw new Error('Azure OpenAI credentials not configured');
        }
        this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
        this.defaultModel = process.env.AZURE_OPENAI_DEFAULT_MODEL || 'gpt-4';
    }
    async getHealth() {
        try {
            const start = Date.now();
            await this.client?.listModels?.();
            const latency = Date.now() - start;
            return { status: 'ok', latency };
        }
        catch (error) {
            try {
                logger.error('Health check failed', { error: error.message ?? String(error) });
            }
            catch { }
            return { status: 'error', latency: 0 };
        }
    }
    async complete(request) {
        const startTime = Date.now();
        const model = request.model || this.defaultModel;
        try {
            await this.checkQuota(request.orgId);
            const result = await this.client?.getCompletions?.(model, request.prompt, {
                maxTokens: request.maxTokens || 500,
                temperature: request.temperature || 0.7
            });
            const aiMetrics = this.calculateMetrics(startTime, result);
            try {
                await this.recordMetrics(aiMetrics, model, request.orgId);
            }
            catch { }
            return result.choices?.[0]?.text ?? '';
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async checkQuota(orgId) {
        const getAIQuota = metrics.getAIQuota;
        const quota = typeof getAIQuota === 'function' ? await getAIQuota(orgId) : { remaining: Infinity };
        if (quota.remaining <= 0) {
            throw new AppError(429, 'AI_QUOTA_EXCEEDED', 'Organization AI quota exceeded');
        }
    }
    calculateMetrics(startTime, result) {
        return {
            requestDuration: Date.now() - startTime,
            tokensUsed: result.usage?.totalTokens || 0,
            estimatedCost: this.calculateCost(result.usage?.totalTokens || 0)
        };
    }
    calculateCost(tokens) {
        const costPer1K = 0.03;
        return (tokens / 1000) * costPer1K;
    }
    async recordMetrics(aiMetrics, model, orgId) {
        try {
            const m = metrics;
            if (typeof m.recordAIRequest === 'function') {
                m.recordAIRequest({ duration: aiMetrics.requestDuration, tokens: aiMetrics.tokensUsed, cost: aiMetrics.estimatedCost, model, orgId });
            }
            else if (typeof m.increment === 'function') {
                try {
                    m.increment('ai_request', { model });
                }
                catch { }
            }
        }
        catch { }
        try {
            logger.info('AI request completed', { duration: aiMetrics.requestDuration, tokens: aiMetrics.tokensUsed, cost: aiMetrics.estimatedCost, model, orgId });
        }
        catch { }
    }
    handleError(error) {
        try {
            logger.error('AI request failed', { error: error.message ?? String(error) });
        }
        catch { }
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'AI_SERVICE_ERROR', 'Error processing AI request');
    }
}
//# sourceMappingURL=ai.js.map