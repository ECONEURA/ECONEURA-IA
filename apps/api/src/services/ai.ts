import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';
import { AppError } from '../lib/errors.js';

interface AIServiceConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
}

interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  orgId: string;
}

interface AIServiceMetrics {
  requestDuration: number;
  tokensUsed: number;
  estimatedCost: number;
}

export class AzureOpenAIService {
  private client: OpenAIClient;
  private defaultModel: string;

  constructor(config?: AIServiceConfig) {
    const endpoint = config?.endpoint || process.env.AZURE_OPENAI_API_ENDPOINT;
    const apiKey = config?.apiKey || process.env.AZURE_OPENAI_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    this.client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    this.defaultModel = process.env.AZURE_OPENAI_DEFAULT_MODEL || 'gpt-4';
  }

  async getHealth(): Promise<{ status: string; latency: number }> {
    try {
      const start = Date.now();
  await this.client?.listModels?.();
      const latency = Date.now() - start;

      return { status: 'ok', latency };
    } catch (error) {
      try { logger.error('Health check failed', { error: (error as Error).message ?? String(error) }); } catch {}
      return { status: 'error', latency: 0 };
    }
  }

  async complete(request: CompletionRequest): Promise<string> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      // Verificar cuota disponible
      await this.checkQuota(request.orgId);

      // Realizar la petición
  const result = await this.client?.getCompletions?.(
        model,
        request.prompt,
        {
          maxTokens: request.maxTokens || 500,
          temperature: request.temperature || 0.7
        }
      );

  // Calcular métricas
  const aiMetrics = this.calculateMetrics(startTime, result);

  // Registrar métricas y costos (best-effort)
  try { await this.recordMetrics(aiMetrics, model, request.orgId); } catch {}

  return result.choices?.[0]?.text ?? '';
    } catch (error) {
      this.handleError(error);
    }
  }

  private async checkQuota(orgId: string): Promise<void> {
  const getAIQuota = (metrics as unknown as { getAIQuota?: (orgId: string) => Promise<{ remaining: number }> }).getAIQuota;
  const quota = typeof getAIQuota === 'function' ? await getAIQuota(orgId) : { remaining: Infinity };

    if (quota.remaining <= 0) {
      throw new AppError(
        429,
        'AI_QUOTA_EXCEEDED',
        'Organization AI quota exceeded'
      );
    }
  }

  private calculateMetrics(startTime: number, result: any): AIServiceMetrics {
    return {
      requestDuration: Date.now() - startTime,
      tokensUsed: result.usage?.totalTokens || 0,
      estimatedCost: this.calculateCost(result.usage?.totalTokens || 0)
    };
  }

  private calculateCost(tokens: number): number {
    // Costo por 1000 tokens en EUR
    const costPer1K = 0.03;
    return (tokens / 1000) * costPer1K;
  }

  private async recordMetrics(
    aiMetrics: AIServiceMetrics,
    model: string,
    orgId: string
  ): Promise<void> {
    try {
      const m = metrics as unknown as { recordAIRequest?: (payload: any) => void; increment?: (key: string, labels?: Record<string, unknown>) => void };
      if (typeof m.recordAIRequest === 'function') {
        m.recordAIRequest({ duration: aiMetrics.requestDuration, tokens: aiMetrics.tokensUsed, cost: aiMetrics.estimatedCost, model, orgId });
      } else if (typeof m.increment === 'function') {
        try { m.increment('ai_request', { model }); } catch {}
      }
    } catch {}

    try { logger.info('AI request completed', { duration: aiMetrics.requestDuration, tokens: aiMetrics.tokensUsed, cost: aiMetrics.estimatedCost, model, orgId }); } catch {}
  }

  private handleError(error: any): never {
  try { logger.error('AI request failed', { error: (error as Error).message ?? String(error) }); } catch {}

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      500,
      'AI_SERVICE_ERROR',
      'Error processing AI request'
    );
  }
}
