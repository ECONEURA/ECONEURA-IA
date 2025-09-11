import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface AIRouterConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
}

export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

export interface AIResponse {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version?: string;
  uptime?: number;
  dependencies?: Record<string, 'healthy' | 'unhealthy'>;
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

export class AIRouterClient {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: AIRouterConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ECONEURA-AI-Router/1.0.0',
      },
    });

    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold || 5,
      config.circuitBreakerTimeout || 60000
    );

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = {
          startTime: Date.now(),
          requestId: this.generateRequestId(),
        };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata?.startTime;
        console.log(`AI Router request completed in ${duration}ms`);
        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        console.error(`AI Router request failed after ${duration}ms:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempts: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // No retry for client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }

        // Exponential backoff
        if (i < attempts - 1) {
          const delay = this.retryDelay * Math.pow(2, i);
          console.log(`Retrying in ${delay}ms (attempt ${i + 1}/${attempts})`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    return this.circuitBreaker.execute(async () => {
      return this.retryWithBackoff(async () => {
        const response = await this.client.post<AIResponse>('/v1/ai/process', request);
        return response.data;
      });
    });
  }

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await this.client.get<HealthStatus>('/v1/ai/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async executeAgent(agentId: string, request: AIRequest): Promise<AIResponse> {
    return this.circuitBreaker.execute(async () => {
      return this.retryWithBackoff(async () => {
        const response = await this.client.post<AIResponse>(`/v1/agents/${agentId}/execute`, request);
        return response.data;
      });
    });
  }

  async listAgents(): Promise<{ agents: Array<{ id: string; name: string; status: string }> }> {
    try {
      const response = await this.client.get('/v1/agents');
      return response.data;
    } catch (error) {
      console.error('Failed to list agents:', error);
      return { agents: [] };
    }
  }

  async getAgentStatus(agentId: string): Promise<{ id: string; status: string; lastActivity?: string }> {
    try {
      const response = await this.client.get(`/v1/agents/${agentId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get agent ${agentId} status:`, error);
      return { id: agentId, status: 'unknown' };
    }
  }
}

// Factory function
export function createAIRouterClient(config: AIRouterConfig): AIRouterClient {
  return new AIRouterClient(config);
}

// Default configuration
export const defaultAIRouterConfig: AIRouterConfig = {
  baseURL: process.env.AI_ROUTER_BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
};

// Export default instance
export const aiRouterClient = createAIRouterClient(defaultAIRouterConfig);