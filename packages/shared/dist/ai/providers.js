import { logger } from '../logging.js';
export class LLMProviderManager {
    providers = new Map();
    healthStatus = new Map();
    requestCounters = new Map();
    constructor() {
        this.initializeDefaultProviders();
        this.startHealthMonitoring();
    }
    initializeDefaultProviders() {
        this.addProvider({
            id: 'mistral-edge',
            name: 'Mistral Edge (Self-hosted)',
            type: 'edge',
            enabled: true,
            healthEndpoint: '/health',
            models: [
                {
                    id: 'mistral-7b-instruct',
                    name: 'Mistral 7B Instruct',
                    contextWindow: 8192,
                    inputCostPer1KTokens: 0.0,
                    outputCostPer1KTokens: 0.0,
                    maxOutputTokens: 2048,
                    capabilities: ['text-generation', 'instruction-following'],
                },
                {
                    id: 'mixtral-8x7b-instruct',
                    name: 'Mixtral 8x7B Instruct',
                    contextWindow: 32768,
                    inputCostPer1KTokens: 0.0,
                    outputCostPer1KTokens: 0.0,
                    maxOutputTokens: 4096,
                    capabilities: ['text-generation', 'instruction-following', 'multilingual'],
                },
            ],
            rateLimits: {
                requestsPerMinute: 100,
                requestsPerDay: 10000,
                tokensPerMinute: 50000,
                tokensPerDay: 1000000,
            },
            costPerToken: {
                inputTokensPer1K: 0.0,
                outputTokensPer1K: 0.0,
            },
            capabilities: {
                functionCalling: false,
                imageAnalysis: false,
                codeInterpreter: false,
                streaming: true,
                embeddings: false,
                languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
                maxConcurrent: 10,
            },
            config: {
                baseUrl: process.env.MISTRAL_BASE_URL || 'http://mistral-edge.internal:11434',
                timeout: 30000,
                retryAttempts: 2,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
        this.addProvider({
            id: 'openai-gpt4',
            name: 'OpenAI GPT-4',
            type: 'cloud',
            enabled: !!process.env.OPENAI_API_KEY,
            healthEndpoint: undefined,
            models: [
                {
                    id: 'gpt-4o',
                    name: 'GPT-4o',
                    contextWindow: 128000,
                    inputCostPer1KTokens: 0.005,
                    outputCostPer1KTokens: 0.015,
                    maxOutputTokens: 4096,
                    capabilities: ['text-generation', 'function-calling', 'vision', 'code-interpreter'],
                },
                {
                    id: 'gpt-4o-mini',
                    name: 'GPT-4o Mini',
                    contextWindow: 128000,
                    inputCostPer1KTokens: 0.00015,
                    outputCostPer1KTokens: 0.0006,
                    maxOutputTokens: 16384,
                    capabilities: ['text-generation', 'function-calling', 'vision'],
                },
            ],
            rateLimits: {
                requestsPerMinute: 3000,
                requestsPerDay: 100000,
                tokensPerMinute: 150000,
                tokensPerDay: 5000000,
            },
            costPerToken: {
                inputTokensPer1K: 0.005,
                outputTokensPer1K: 0.015,
                imageAnalysis: 0.01275,
                functionCalling: 0.0025,
            },
            capabilities: {
                functionCalling: true,
                imageAnalysis: true,
                codeInterpreter: true,
                streaming: true,
                embeddings: false,
                languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
                maxConcurrent: 50,
            },
            config: {
                baseUrl: 'https://api.openai.com/v1',
                apiKey: process.env.OPENAI_API_KEY,
                timeout: 60000,
                retryAttempts: 3,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
        this.addProvider({
            id: 'anthropic-claude',
            name: 'Anthropic Claude',
            type: 'cloud',
            enabled: !!process.env.ANTHROPIC_API_KEY,
            models: [
                {
                    id: 'claude-3-5-sonnet-20241022',
                    name: 'Claude 3.5 Sonnet',
                    contextWindow: 200000,
                    inputCostPer1KTokens: 0.003,
                    outputCostPer1KTokens: 0.015,
                    maxOutputTokens: 8192,
                    capabilities: ['text-generation', 'vision', 'code-analysis'],
                },
                {
                    id: 'claude-3-haiku-20240307',
                    name: 'Claude 3 Haiku',
                    contextWindow: 200000,
                    inputCostPer1KTokens: 0.00025,
                    outputCostPer1KTokens: 0.00125,
                    maxOutputTokens: 4096,
                    capabilities: ['text-generation', 'vision'],
                },
            ],
            rateLimits: {
                requestsPerMinute: 1000,
                requestsPerDay: 50000,
                tokensPerMinute: 100000,
                tokensPerDay: 3000000,
            },
            costPerToken: {
                inputTokensPer1K: 0.003,
                outputTokensPer1K: 0.015,
                imageAnalysis: 0.01,
            },
            capabilities: {
                functionCalling: false,
                imageAnalysis: true,
                codeInterpreter: false,
                streaming: true,
                embeddings: false,
                languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
                maxConcurrent: 20,
            },
            config: {
                baseUrl: 'https://api.anthropic.com/v1',
                apiKey: process.env.ANTHROPIC_API_KEY,
                timeout: 60000,
                retryAttempts: 3,
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                },
            },
        });
        this.addProvider({
            id: 'google-gemini',
            name: 'Google Gemini',
            type: 'cloud',
            enabled: !!process.env.GOOGLE_AI_API_KEY,
            models: [
                {
                    id: 'gemini-1.5-pro',
                    name: 'Gemini 1.5 Pro',
                    contextWindow: 1000000,
                    inputCostPer1KTokens: 0.00125,
                    outputCostPer1KTokens: 0.005,
                    maxOutputTokens: 8192,
                    capabilities: ['text-generation', 'vision', 'function-calling', 'code-execution'],
                },
                {
                    id: 'gemini-1.5-flash',
                    name: 'Gemini 1.5 Flash',
                    contextWindow: 1000000,
                    inputCostPer1KTokens: 0.000075,
                    outputCostPer1KTokens: 0.0003,
                    maxOutputTokens: 8192,
                    capabilities: ['text-generation', 'vision', 'function-calling'],
                },
            ],
            rateLimits: {
                requestsPerMinute: 2000,
                requestsPerDay: 100000,
                tokensPerMinute: 120000,
                tokensPerDay: 4000000,
            },
            costPerToken: {
                inputTokensPer1K: 0.00125,
                outputTokensPer1K: 0.005,
                imageAnalysis: 0.002,
                functionCalling: 0.001,
            },
            capabilities: {
                functionCalling: true,
                imageAnalysis: true,
                codeInterpreter: true,
                streaming: true,
                embeddings: false,
                languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
                maxConcurrent: 30,
            },
            config: {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey: process.env.GOOGLE_AI_API_KEY,
                timeout: 60000,
                retryAttempts: 3,
            },
        });
        if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY) {
            this.addProvider({
                id: 'azure-openai',
                name: 'Azure OpenAI',
                type: 'cloud',
                enabled: true,
                models: [
                    {
                        id: 'gpt-4o',
                        name: 'GPT-4o (Azure)',
                        contextWindow: 128000,
                        inputCostPer1KTokens: 0.005,
                        outputCostPer1KTokens: 0.015,
                        maxOutputTokens: 4096,
                        capabilities: ['text-generation', 'function-calling', 'vision'],
                    },
                ],
                rateLimits: {
                    requestsPerMinute: 2000,
                    requestsPerDay: 80000,
                    tokensPerMinute: 120000,
                    tokensPerDay: 4000000,
                },
                costPerToken: {
                    inputTokensPer1K: 0.005,
                    outputTokensPer1K: 0.015,
                    imageAnalysis: 0.01275,
                    functionCalling: 0.0025,
                },
                capabilities: {
                    functionCalling: true,
                    imageAnalysis: true,
                    codeInterpreter: false,
                    streaming: true,
                    embeddings: true,
                    languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
                    maxConcurrent: 40,
                },
                config: {
                    baseUrl: process.env.AZURE_OPENAI_ENDPOINT,
                    apiKey: process.env.AZURE_OPENAI_KEY,
                    timeout: 60000,
                    retryAttempts: 3,
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': process.env.AZURE_OPENAI_KEY,
                    },
                },
            });
        }
    }
    addProvider(provider) {
        this.providers.set(provider.id, provider);
        logger.info('LLM provider registered', {
            provider: provider.id,
            provider_name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            models_count: provider.models.length,
        });
    }
    getProvider(providerId) {
        return this.providers.get(providerId);
    }
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    getEnabledProviders() {
        return Array.from(this.providers.values()).filter(p => p.enabled);
    }
    getProvidersByType(type) {
        return Array.from(this.providers.values()).filter(p => p.type === type && p.enabled);
    }
    getProvidersWithCapability(capability) {
        return Array.from(this.providers.values()).filter(p => p.enabled && p.capabilities[capability] === true);
    }
    getBestProvider(requirements) {
        const candidates = this.getEnabledProviders()
            .filter(provider => {
            if (requirements.excludeProviders?.includes(provider.id)) {
                return false;
            }
            if (requirements.capabilities) {
                const hasAllCapabilities = requirements.capabilities.every(cap => provider.models.some(model => model.capabilities.includes(cap)));
                if (!hasAllCapabilities)
                    return false;
            }
            if (requirements.languages) {
                const supportsAllLanguages = requirements.languages.every(lang => provider.capabilities.languages.includes(lang));
                if (!supportsAllLanguages)
                    return false;
            }
            if (requirements.maxCost !== undefined) {
                const minCost = Math.min(...provider.models.map(m => m.inputCostPer1KTokens));
                if (minCost > requirements.maxCost)
                    return false;
            }
            return true;
        });
        if (candidates.length === 0)
            return null;
        return candidates.sort((a, b) => {
            if (requirements.preferEdge) {
                if (a.type === 'edge' && b.type !== 'edge')
                    return -1;
                if (b.type === 'edge' && a.type !== 'edge')
                    return 1;
            }
            const healthA = this.healthStatus.get(a.id);
            const healthB = this.healthStatus.get(b.id);
            if (healthA?.status === 'healthy' && healthB?.status !== 'healthy')
                return -1;
            if (healthB?.status === 'healthy' && healthA?.status !== 'healthy')
                return 1;
            const costA = Math.min(...a.models.map(m => m.inputCostPer1KTokens));
            const costB = Math.min(...b.models.map(m => m.inputCostPer1KTokens));
            return costA - costB;
        })[0];
    }
    checkRateLimit(providerId, tokensRequested) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return { allowed: false, reason: 'Provider not found' };
        }
        const now = Date.now();
        const counter = this.requestCounters.get(providerId) || {
            requests: 0,
            tokens: 0,
            resetTime: now + 60000
        };
        if (now >= counter.resetTime) {
            counter.requests = 0;
            counter.tokens = 0;
            counter.resetTime = now + 60000;
        }
        if (counter.requests >= provider.rateLimits.requestsPerMinute) {
            return {
                allowed: false,
                reason: 'Request rate limit exceeded',
                resetTime: counter.resetTime
            };
        }
        if (counter.tokens + tokensRequested > provider.rateLimits.tokensPerMinute) {
            return {
                allowed: false,
                reason: 'Token rate limit exceeded',
                resetTime: counter.resetTime
            };
        }
        counter.requests++;
        counter.tokens += tokensRequested;
        this.requestCounters.set(providerId, counter);
        return { allowed: true };
    }
    getProviderHealth(providerId) {
        return this.healthStatus.get(providerId);
    }
    getAllProviderHealth() {
        return Array.from(this.healthStatus.values());
    }
    startHealthMonitoring() {
        this.checkAllProviderHealth();
        setInterval(() => {
            this.checkAllProviderHealth();
        }, 30000);
    }
    async checkAllProviderHealth() {
        const providers = this.getEnabledProviders();
        await Promise.allSettled(providers.map(provider => this.checkProviderHealth(provider)));
    }
    async checkProviderHealth(provider) {
        const startTime = Date.now();
        try {
            let isHealthy = false;
            let responseTime = 0;
            if (provider.healthEndpoint && provider.type === 'edge') {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(`${provider.config.baseUrl}${provider.healthEndpoint}`, {
                    signal: controller.signal,
                    headers: provider.config.headers,
                });
                clearTimeout(timeout);
                responseTime = Date.now() - startTime;
                isHealthy = response.ok;
            }
            else if (provider.type === 'cloud') {
                isHealthy = !!provider.config.apiKey;
                responseTime = 0;
            }
            const errorRate = 0;
            const health = {
                providerId: provider.id,
                status: isHealthy ? 'healthy' : 'down',
                latency: responseTime,
                errorRate,
                lastCheck: new Date(),
                details: {
                    responseTime,
                    availability: isHealthy ? 100 : 0,
                    concurrentRequests: 0,
                },
            };
            this.healthStatus.set(provider.id, health);
            logger.debug('Provider health checked', {
                provider: provider.id,
                status: health.status,
                latency: responseTime,
            });
        }
        catch (error) {
            const health = {
                providerId: provider.id,
                status: 'down',
                latency: Date.now() - startTime,
                errorRate: 100,
                lastCheck: new Date(),
            };
            this.healthStatus.set(provider.id, health);
            logger.warn('Provider health check failed', {
                provider: provider.id,
                error_message: error.message,
            });
        }
    }
    estimateCost(providerId, modelId, inputTokens, outputTokens, extras) {
        const provider = this.providers.get(providerId);
        if (!provider)
            return 0;
        const model = provider.models.find(m => m.id === modelId);
        if (!model)
            return 0;
        let cost = 0;
        cost += (inputTokens / 1000) * model.inputCostPer1KTokens;
        cost += (outputTokens / 1000) * model.outputCostPer1KTokens;
        if (extras?.images && provider.costPerToken.imageAnalysis) {
            cost += extras.images * provider.costPerToken.imageAnalysis;
        }
        if (extras?.functionCalls && provider.costPerToken.functionCalling) {
            cost += extras.functionCalls * provider.costPerToken.functionCalling;
        }
        return cost;
    }
}
//# sourceMappingURL=providers.js.map