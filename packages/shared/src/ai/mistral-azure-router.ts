import { z } from 'zod';
import { structuredLogger } from '../utils/logger.js';

// AI Request schema
export const AIRequestSchema = z.object({
  model: z.string().default('gpt-4o-mini'),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(8192).optional().default(1024),
  stream: z.boolean().optional().default(false),
  orgId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  correlationId: z.string().uuid().optional()
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

// AI Response schema
export const AIResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.enum(['assistant']),
      content: z.string()
    }),
    finishReason: z.string().optional()
  })),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number()
  }),
  costEur: z.number().min(0),
  provider: z.enum(['mistral-local', 'azure-openai']),
  latencyMs: z.number(),
  timestamp: z.string().datetime()
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// Provider configuration
interface ProviderConfig {
  name: 'mistral-local' | 'azure-openai';
  endpoint: string;
  apiKey?: string;
  model: string;
  costPerToken: number;
  maxLatencyMs: number;
  priority: number; // Lower = higher priority
  enabled: boolean;
}

export class MistralAzureRouter {
  private providers: Map<string, ProviderConfig> = new Map();
  private failureCount: Map<string, number> = new Map();
  private lastFailure: Map<string, Date> = new Map();
  private circuitBreakerThreshold = 5;
  private circuitBreakerResetTime = 300000; // 5 minutes

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Mistral local (primary)
    this.providers.set('mistral-local', {
      name: 'mistral-local',
      endpoint: process.env.MISTRAL_BASE_URL || 'http://mistral:8080',
      model: 'mistral-7b-instruct',
      costPerToken: 0.0001, // Very low cost for local
      maxLatencyMs: 3000,
      priority: 1,
      enabled: true
    });

    // Azure OpenAI (fallback)
    this.providers.set('azure-openai', {
      name: 'azure-openai',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
      costPerToken: 0.0015, // Higher cost for cloud
      maxLatencyMs: 5000,
      priority: 2,
      enabled: !!process.env.AZURE_OPENAI_ENDPOINT
    });

    structuredLogger.info('AI providers initialized', {
      providers: Array.from(this.providers.keys()),
      mistralEnabled: this.providers.get('mistral-local')?.enabled,
      azureEnabled: this.providers.get('azure-openai')?.enabled
    });
  }

  // Select best available provider
  private selectProvider(orgId: string): ProviderConfig | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.enabled && this.isProviderHealthy(p.name))
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      structuredLogger.error('No healthy AI providers available', new Error('No providers'), { orgId });
      return null;
    }

    const selected = availableProviders[0];
    
    structuredLogger.debug('AI provider selected', {
      orgId,
      provider: selected.name,
      priority: selected.priority,
      availableCount: availableProviders.length
    });

    return selected;
  }

  // Check if provider is healthy (circuit breaker)
  private isProviderHealthy(providerName: string): boolean {
    const failures = this.failureCount.get(providerName) || 0;
    const lastFailure = this.lastFailure.get(providerName);

    // If under threshold, provider is healthy
    if (failures < this.circuitBreakerThreshold) {
      return true;
    }

    // If over threshold, check if reset time has passed
    if (lastFailure) {
      const timeSinceFailure = Date.now() - lastFailure.getTime();
      if (timeSinceFailure > this.circuitBreakerResetTime) {
        // Reset circuit breaker
        this.failureCount.set(providerName, 0);
        this.lastFailure.delete(providerName);
        
        structuredLogger.info('Circuit breaker reset', {
          provider: providerName,
          timeSinceFailure
        });
        
        return true;
      }
    }

    return false;
  }

  // Record provider failure
  private recordFailure(providerName: string): void {
    const currentFailures = this.failureCount.get(providerName) || 0;
    this.failureCount.set(providerName, currentFailures + 1);
    this.lastFailure.set(providerName, new Date());

    const failures = this.failureCount.get(providerName)!;
    
    if (failures >= this.circuitBreakerThreshold) {
      structuredLogger.warn('Circuit breaker opened', {
        provider: providerName,
        failures,
        threshold: this.circuitBreakerThreshold
      });
    }
  }

  // Record provider success
  private recordSuccess(providerName: string): void {
    // Gradually reduce failure count on success
    const currentFailures = this.failureCount.get(providerName) || 0;
    if (currentFailures > 0) {
      this.failureCount.set(providerName, Math.max(0, currentFailures - 1));
    }
  }

  // Make AI request with automatic fallback
  async makeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Try each provider in priority order
    const providers = Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of providers) {
      if (!this.isProviderHealthy(provider.name)) {
        continue;
      }

      try {
        const response = await this.callProvider(provider, request);
        this.recordSuccess(provider.name);
        
        const totalLatency = Date.now() - startTime;
        
        structuredLogger.info('AI request completed', {
          orgId: request.orgId,
          correlationId: request.correlationId,
          provider: provider.name,
          model: response.model,
          totalTokens: response.usage.totalTokens,
          costEur: response.costEur,
          latencyMs: totalLatency
        });

        return {
          ...response,
          latencyMs: totalLatency
        };

      } catch (error) {
        lastError = error as Error;
        this.recordFailure(provider.name);
        
        structuredLogger.warn('AI provider failed, trying next', {
          orgId: request.orgId,
          provider: provider.name,
          error: lastError.message,
          remainingProviders: providers.length - providers.indexOf(provider) - 1
        });
      }
    }

    // All providers failed
    const totalLatency = Date.now() - startTime;
    
    structuredLogger.error('All AI providers failed', lastError || new Error('No providers available'), {
      orgId: request.orgId,
      correlationId: request.correlationId,
      attemptedProviders: providers.map(p => p.name),
      totalLatency
    });

    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'No providers available'}`);
  }

  // Call specific provider
  private async callProvider(provider: ProviderConfig, request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      let response: any;

      if (provider.name === 'mistral-local') {
        response = await this.callMistralLocal(provider, request);
      } else if (provider.name === 'azure-openai') {
        response = await this.callAzureOpenAI(provider, request);
      } else {
        throw new Error(`Unknown provider: ${provider.name}`);
      }

      const latency = Date.now() - startTime;

      // Check latency threshold
      if (latency > provider.maxLatencyMs) {
        throw new Error(`Provider latency exceeded: ${latency}ms > ${provider.maxLatencyMs}ms`);
      }

      return response;

    } catch (error) {
      const latency = Date.now() - startTime;
      
      structuredLogger.error('Provider call failed', error as Error, {
        provider: provider.name,
        latency,
        orgId: request.orgId
      });

      throw error;
    }
  }

  // Call Mistral local instance
  private async callMistralLocal(provider: ProviderConfig, request: AIRequest): Promise<AIResponse> {
    const requestPayload = {
      model: provider.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false
    };

    const response = await fetch(`${provider.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(provider.maxLatencyMs)
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Calculate cost
    const totalTokens = data.usage?.total_tokens || 0;
    const costEur = totalTokens * provider.costPerToken;

    return {
      id: data.id || `mistral-${Date.now()}`,
      model: provider.model,
      choices: data.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: 'assistant',
          content: choice.message.content
        },
        finishReason: choice.finish_reason
      })),
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      costEur,
      provider: 'mistral-local',
      latencyMs: 0, // Will be set by caller
      timestamp: new Date().toISOString()
    };
  }

  // Call Azure OpenAI
  private async callAzureOpenAI(provider: ProviderConfig, request: AIRequest): Promise<AIResponse> {
    if (!provider.apiKey || !provider.endpoint) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    const requestPayload = {
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false
    };

    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    const url = `${provider.endpoint}/openai/deployments/${provider.model}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': provider.apiKey
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(provider.maxLatencyMs)
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Calculate cost (Azure OpenAI pricing)
    const totalTokens = data.usage?.total_tokens || 0;
    const costEur = totalTokens * provider.costPerToken;

    return {
      id: data.id || `azure-${Date.now()}`,
      model: provider.model,
      choices: data.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: 'assistant',
          content: choice.message.content
        },
        finishReason: choice.finish_reason
      })),
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      costEur,
      provider: 'azure-openai',
      latencyMs: 0, // Will be set by caller
      timestamp: new Date().toISOString()
    };
  }

  // Get provider health status
  async getProviderHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      const failures = this.failureCount.get(name) || 0;
      const lastFailure = this.lastFailure.get(name);
      const isHealthy = this.isProviderHealthy(name);

      health[name] = {
        enabled: provider.enabled,
        healthy: isHealthy,
        failures,
        lastFailure: lastFailure?.toISOString(),
        endpoint: provider.endpoint,
        model: provider.model,
        costPerToken: provider.costPerToken,
        maxLatencyMs: provider.maxLatencyMs,
        priority: provider.priority
      };
    }

    return health;
  }

  // Get routing statistics
  getRoutingStats(): any {
    const stats = {
      providers: {} as Record<string, any>,
      totalRequests: 0,
      totalCost: 0,
      avgLatency: 0
    };

    for (const [name, provider] of this.providers) {
      const failures = this.failureCount.get(name) || 0;
      
      stats.providers[name] = {
        enabled: provider.enabled,
        healthy: this.isProviderHealthy(name),
        failures,
        priority: provider.priority,
        costPerToken: provider.costPerToken
      };
    }

    return stats;
  }

  // Force provider status (for testing)
  setProviderStatus(providerName: string, enabled: boolean): void {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.enabled = enabled;
      
      structuredLogger.info('Provider status changed', {
        provider: providerName,
        enabled
      });
    }
  }

  // Reset circuit breaker for provider
  resetCircuitBreaker(providerName: string): void {
    this.failureCount.set(providerName, 0);
    this.lastFailure.delete(providerName);
    
    structuredLogger.info('Circuit breaker manually reset', {
      provider: providerName
    });
  }
}

export const aiRouter = new MistralAzureRouter();