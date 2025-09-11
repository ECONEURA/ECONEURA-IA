import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

// Base configuration
export interface ECONEURAClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Request/Response schemas
export const MemoryPutRequestSchema = z.object({
  tenantId: z.string(),
  userId: z.string().optional(),
  agentId: z.string().optional(),
  namespace: z.string(),
  vector: z.array(z.number()).optional(),
  text: z.string().optional(),
  ttlSec: z.number().optional(),
  meta: z.record(z.any()).optional(),
});

export const MemoryPutResponseSchema = z.object({
  ok: z.boolean(),
  id: z.string(),
  timestamp: z.string(),
});

export const MemoryQueryRequestSchema = z.object({
  tenantId: z.string(),
  userId: z.string().optional(),
  agentId: z.string().optional(),
  namespace: z.string(),
  query: z.string(),
  topK: z.number().optional().default(10),
});

export const MemoryQueryResponseSchema = z.object({
  matches: z.array(z.object({
    id: z.string(),
    score: z.number(),
    text: z.string().optional(),
    meta: z.record(z.any()).optional(),
  })),
  query: z.string(),
  namespace: z.string(),
  timestamp: z.string(),
  totalMatches: z.number(),
});

export const MemoryStatsResponseSchema = z.object({
  tenantId: z.string(),
  totalRecords: z.number(),
  namespaces: z.array(z.string()),
  lastUpdated: z.string(),
});

export const MemoryCleanupResponseSchema = z.object({
  ok: z.boolean(),
  timestamp: z.string(),
});

export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  traceId: z.string().optional(),
  timestamp: z.string().optional(),
});

// Type exports
export type MemoryPutRequest = z.infer<typeof MemoryPutRequestSchema>;
export type MemoryPutResponse = z.infer<typeof MemoryPutResponseSchema>;
export type MemoryQueryRequest = z.infer<typeof MemoryQueryRequestSchema>;
export type MemoryQueryResponse = z.infer<typeof MemoryQueryResponseSchema>;
export type MemoryStatsResponse = z.infer<typeof MemoryStatsResponseSchema>;
export type MemoryCleanupResponse = z.infer<typeof MemoryCleanupResponseSchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

// Error class
export class ECONEURAError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: ProblemDetails
  ) {
    super(message);
    this.name = 'ECONEURAError';
  }
}

// Main client class
export class ECONEURAClient {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: ECONEURAClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ECONEURA-SDK/1.0.0',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });

    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

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
        console.log(`ECONEURA API request completed in ${duration}ms`);
        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        console.error(`ECONEURA API request failed after ${duration}ms:`, error.message);
        
        if (error.response?.data) {
          try {
            const problemDetails = ProblemDetailsSchema.parse(error.response.data);
            throw new ECONEURAError(
              problemDetails.detail || error.message,
              error.response.status,
              problemDetails
            );
          } catch (parseError) {
            // If parsing fails, throw original error
            throw new ECONEURAError(
              error.message,
              error.response.status
            );
          }
        }
        
        throw new ECONEURAError(error.message, error.response?.status || 0);
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

  // Memory API methods
  async putMemory(request: MemoryPutRequest, idempotencyKey?: string): Promise<MemoryPutResponse> {
    const validatedRequest = MemoryPutRequestSchema.parse(request);
    
    return this.retryWithBackoff(async () => {
      const response = await this.client.post<MemoryPutResponse>('/v1/memory/put', validatedRequest, {
        headers: idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {},
      });
      
      return MemoryPutResponseSchema.parse(response.data);
    });
  }

  async queryMemory(request: MemoryQueryRequest): Promise<MemoryQueryResponse> {
    const validatedRequest = MemoryQueryRequestSchema.parse(request);
    
    return this.retryWithBackoff(async () => {
      const response = await this.client.post<MemoryQueryResponse>('/v1/memory/query', validatedRequest);
      return MemoryQueryResponseSchema.parse(response.data);
    });
  }

  async getMemoryStats(tenantId: string): Promise<MemoryStatsResponse> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.get<MemoryStatsResponse>(`/v1/memory/stats/${tenantId}`);
      return MemoryStatsResponseSchema.parse(response.data);
    });
  }

  async cleanupExpiredMemories(): Promise<MemoryCleanupResponse> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.post<MemoryCleanupResponse>('/v1/memory/cleanup');
      return MemoryCleanupResponseSchema.parse(response.data);
    });
  }

  // Generic method for custom requests
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.request<T>(config);
      return response.data;
    });
  }
}

// Factory function
export function createECONEURAClient(config: ECONEURAClientConfig): ECONEURAClient {
  return new ECONEURAClient(config);
}

// Default configuration
export const defaultConfig: ECONEURAClientConfig = {
  baseURL: process.env.ECONEURA_API_URL || 'http://localhost:4000',
  apiKey: process.env.ECONEURA_API_KEY,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Export default instance
export const econeuraClient = createECONEURAClient(defaultConfig);