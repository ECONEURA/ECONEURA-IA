/**
 * AI Router Client - Real HTTP Client for AI Agents
 * Provides real-time communication with AI services
 */

import { logger } from '@econeura/shared/src/logging/index';

export interface AIRequest {
  orgId: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    estimated: number;
    actual: number;
    currency: 'EUR';
  };
  metadata: {
    processingTime: number;
    timestamp: string;
    requestId: string;
  };
}

export interface AIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryAfter?: number;
}

export class AIRouterClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }> = new Map();

  constructor(config: {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
  }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Send AI request with retry logic and circuit breaker
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Check circuit breaker
      const circuitState = this.getCircuitBreakerState(request.provider || 'default');
      if (circuitState.state === 'open') {
        throw new AIError('CIRCUIT_BREAKER_OPEN', 'Circuit breaker is open, request blocked');
      }

      // Make request with retry logic
      const response = await this.makeRequestWithRetry(request, requestId);

      // Record success
      this.recordSuccess(request.provider || 'default');

      // Log successful request
      logger.info('AI request completed', {
        request_id: requestId,
        org_id: request.orgId,
        provider: response.provider,
        model: response.model,
        tokens: response.usage.totalTokens,
        cost: response.cost.actual,
        processing_time: Date.now() - startTime
      });

      return response;
    } catch (error) {
      // Record failure
      this.recordFailure(request.provider || 'default');

      // Log error
      logger.error('AI request failed', error as Error, {
        request_id: requestId,
        org_id: request.orgId,
        provider: request.provider,
        processing_time: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(request: AIRequest, requestId: string): Promise<AIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(request, requestId, attempt);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof AIError && this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Make actual HTTP request
   */
  private async makeRequest(request: AIRequest, requestId: string, attempt: number): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Request-ID': requestId,
          'X-Org-ID': request.orgId,
          'X-Attempt': attempt.toString()
        },
        body: JSON.stringify({
          prompt: request.prompt,
          model: request.model,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          provider: request.provider,
          context: request.context,
          metadata: request.metadata
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIError(
          errorData.code || 'HTTP_ERROR',
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            attempt
          },
          response.headers.get('Retry-After') ? parseInt(response.headers.get('Retry-After')!) : undefined
        );
      }

      const data = await response.json();
      return this.mapResponse(data, requestId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AIError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError('TIMEOUT', 'Request timeout', { attempt });
      }
      
      throw new AIError('NETWORK_ERROR', error instanceof Error ? error.message : 'Unknown error', { attempt });
    }
  }

  /**
   * Map API response to AIResponse
   */
  private mapResponse(data: any, requestId: string): AIResponse {
    return {
      id: data.id || requestId,
      content: data.content || data.response || '',
      model: data.model || 'unknown',
      provider: data.provider || 'unknown',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      cost: {
        estimated: data.cost?.estimated || 0,
        actual: data.cost?.actual || 0,
        currency: 'EUR'
      },
      metadata: {
        processingTime: data.metadata?.processing_time || 0,
        timestamp: data.metadata?.timestamp || new Date().toISOString(),
        requestId
      }
    };
  }

  /**
   * Circuit breaker logic
   */
  private getCircuitBreakerState(provider: string): { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' } {
    const state = this.circuitBreaker.get(provider) || { failures: 0, lastFailure: 0, state: 'closed' as const };
    
    // Reset circuit breaker after 5 minutes
    if (state.state === 'open' && Date.now() - state.lastFailure > 5 * 60 * 1000) {
      state.state = 'half-open';
      state.failures = 0;
    }
    
    return state;
  }

  private recordSuccess(provider: string) {
    const state = this.circuitBreaker.get(provider) || { failures: 0, lastFailure: 0, state: 'closed' as const };
    state.failures = 0;
    state.state = 'closed';
    this.circuitBreaker.set(provider, state);
  }

  private recordFailure(provider: string) {
    const state = this.circuitBreaker.get(provider) || { failures: 0, lastFailure: 0, state: 'closed' as const };
    state.failures++;
    state.lastFailure = Date.now();
    
    // Open circuit breaker after 5 failures
    if (state.failures >= 5) {
      state.state = 'open';
    }
    
    this.circuitBreaker.set(provider, state);
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: AIError): boolean {
    const nonRetryableCodes = [
      'BUDGET_EXCEEDED',
      'INVALID_REQUEST',
      'AUTHENTICATION_ERROR',
      'AUTHORIZATION_ERROR',
      'RATE_LIMIT_EXCEEDED'
    ];
    
    return nonRetryableCodes.includes(error.code);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; providers: Record<string, any> }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return { status: 'unhealthy', providers: {} };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { status: 'unhealthy', providers: {} };
    }
  }
}

// Export singleton instance
export const aiRouterClient = new AIRouterClient({
  baseUrl: process.env.AI_ROUTER_BASE_URL || 'http://localhost:3001',
  apiKey: process.env.AI_ROUTER_API_KEY || 'demo-key'
});

// Export error class
export class AIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

