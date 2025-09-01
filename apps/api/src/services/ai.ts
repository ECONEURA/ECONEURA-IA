import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { MetricsService } from '../lib/metrics';
import { Logger } from '../lib/logger';
import { AppError } from '../lib/errors';

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
  private logger: Logger;
  private metrics: MetricsService;
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
    this.logger = new Logger('azure-openai');
    this.metrics = new MetricsService();
  }

  async getHealth(): Promise<{ status: string; latency: number }> {
    try {
      const start = Date.now();
      await this.client.listModels();
      const latency = Date.now() - start;

      return { status: 'ok', latency };
    } catch (error) {
      this.logger.error('Health check failed', error);
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
      const result = await this.client.getCompletions(
        model,
        request.prompt,
        {
          maxTokens: request.maxTokens || 500,
          temperature: request.temperature || 0.7
        }
      );

      // Calcular métricas
      const metrics = this.calculateMetrics(startTime, result);
      
      // Registrar métricas y costos
      await this.recordMetrics(metrics, model, request.orgId);

      return result.choices[0].text;
    } catch (error) {
      this.handleError(error);
    }
  }

  private async checkQuota(orgId: string): Promise<void> {
    const quota = await this.metrics.getAIQuota(orgId);
    
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
    metrics: AIServiceMetrics,
    model: string,
    orgId: string
  ): Promise<void> {
    this.metrics.recordAIRequest({
      duration: metrics.requestDuration,
      tokens: metrics.tokensUsed,
      cost: metrics.estimatedCost,
      model,
      orgId
    });

    this.logger.info('AI request completed', {
      duration: metrics.requestDuration,
      tokens: metrics.tokensUsed,
      cost: metrics.estimatedCost,
      model,
      orgId
    });
  }

  private handleError(error: any): never {
    this.logger.error('AI request failed', error);

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
