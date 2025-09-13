import { Request, Response } from 'express';
import { z } from 'zod';
import { structuredLogger } from '../lib/structured-logger.js';
import { predictiveAI } from '../services/predictive-ai.service.js';
import { metricsService } from '../services/metrics.service.js';
import { autoML } from '../services/automl.service.js';
import { sentimentAnalysis } from '../services/sentiment-analysis.service.js';
import { azureOpenAI } from '../services/azure-openai.service.js';
import { webSearch } from '../services/web-search.service.js';
import { getDatabaseService } from '@econeura/db';

// ============================================================================
// ENHANCED ADVANCED FEATURES CONTROLLER
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
    permissions: string[];
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
  processingTime: number;
}

// Validation schemas
const predictDemandSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  days: z.number().min(1).max(365).default(30),
  includeConfidence: z.boolean().default(true),
  includeTrends: z.boolean().default(false)
});

const optimizeInventorySchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  optimizationType: z.enum(['cost', 'service_level', 'balanced']).default('balanced'),
  constraints: z.object({
    maxCost: z.number().optional(),
    minServiceLevel: z.number().min(0).max(1).optional(),
    maxStock: z.number().optional()
  }).optional()
});

const sentimentAnalysisSchema = z.object({
  text: z.string().min(1).max(10000, 'Text too long'),
  source: z.string().optional(),
  includeEmotions: z.boolean().default(true),
  includeTopics: z.boolean().default(true),
  includeKeywords: z.boolean().default(true)
});

const batchSentimentSchema = z.object({
  texts: z.array(z.string().min(1).max(10000)).min(1).max(100, 'Too many texts'),
  source: z.string().optional(),
  includeEmotions: z.boolean().default(true),
  includeTopics: z.boolean().default(true),
  includeKeywords: z.boolean().default(true)
});

export class AdvancedFeaturesController {
  private db: ReturnType<typeof getDatabaseService>;
  private requestMetrics: Map<string, { count: number; totalTime: number }> = new Map();

  constructor() {
    this.db = getDatabaseService();
    this.startMetricsCleanup();
  }

  private startMetricsCleanup(): void {
    setInterval(() => {
      this.requestMetrics.clear();
    }, 300000); // Clear metrics every 5 minutes
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logRequest(
    requestId: string,
    endpoint: string,
    userId: string,
    organizationId: string,
    processingTime: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const db = this.db.getDatabase();
      await db.insert(auditLog).values({
        organizationId,
        userId,
        action: 'create',
        resourceType: 'api_request',
        newValues: {
          requestId,
          endpoint,
          processingTime,
          success,
          error
        },
        createdAt: new Date()
      });
    } catch (error) {
      structuredLogger.error('Failed to log request', error as Error);
    }
  }

  private updateMetrics(endpoint: string, processingTime: number): void {
    const current = this.requestMetrics.get(endpoint) || { count: 0, totalTime: 0 };
    this.requestMetrics.set(endpoint, {
      count: current.count + 1,
      totalTime: current.totalTime + processingTime
    });
  }

  private sendResponse<T>(
    res: Response,
    requestId: string,
    startTime: number,
    data?: T,
    error?: string,
    statusCode: number = 200
  ): void {
    const processingTime = Date.now() - startTime;
    const response: ApiResponse<T> = {
      success: !error,
      data,
      error,
      timestamp: new Date().toISOString(),
      requestId,
      processingTime
    };

    res.status(statusCode).json(response);
  }

  // ========================================================================
  // PREDICTIVE AI ENDPOINTS
  // ========================================================================

  async predictDemand(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // Validate request
      const validation = predictDemandSchema.safeParse(req.body);
      if (!validation.success) {
        this.sendResponse(res, requestId, startTime, undefined, 
          `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
        return;
      }

      const { productId, days, includeConfidence, includeTrends } = validation.data;
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId || !organizationId) {
        this.sendResponse(res, requestId, startTime, undefined, 'Authentication required', 401);
        return;
      }

      // Check permissions
      if (!req.user?.permissions.includes('predictive:read')) {
        this.sendResponse(res, requestId, startTime, undefined, 'Insufficient permissions', 403);
        return;
      }

      // Perform prediction
      const prediction = await predictiveAI.predictDemand(productId, days, {
        includeConfidence,
        includeTrends,
        organizationId,
        userId
      });

      // Log successful request
      await this.logRequest(requestId, 'predictDemand', userId, organizationId, 
        Date.now() - startTime, true);

      this.sendResponse(res, requestId, startTime, prediction);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      structuredLogger.error('Failed to predict demand', {
        error: errorMessage,
        requestId,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        processingTime
      });

      // Log failed request
      if (req.user?.id && req.user?.organizationId) {
        await this.logRequest(requestId, 'predictDemand', req.user.id, 
          req.user.organizationId, processingTime, false, errorMessage);
      }

      this.sendResponse(res, requestId, startTime, undefined, 'Failed to predict demand', 500);
    }
  }

  async optimizeInventory(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      const optimization = await predictiveAI.optimizeInventory(productId);
      
      res.json({
        success: true,
        data: optimization
      });
    } catch (error) {
      structuredLogger.error('Failed to optimize inventory', error as Error);
      res.status(500).json({ error: 'Failed to optimize inventory' });
    }
  }

  async analyzeSeasonality(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      const analysis = await predictiveAI.analyzeSeasonality(productId);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      structuredLogger.error('Failed to analyze seasonality', error as Error);
      res.status(500).json({ error: 'Failed to analyze seasonality' });
    }
  }

  async generateRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      const recommendations = await predictiveAI.generateRecommendations(productId);
      
      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      structuredLogger.error('Failed to generate recommendations', error as Error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }

  // PR-13: Metrics endpoints
  async getKPIScorecard(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      
      const scorecard = await metricsService.getKPIScorecard(category as string);
      
      res.json({
        success: true,
        data: scorecard
      });
    } catch (error) {
      structuredLogger.error('Failed to get KPI scorecard', error as Error);
      res.status(500).json({ error: 'Failed to get KPI scorecard' });
    }
  }

  async getTrendAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { metricId, period = '30d' } = req.query;
      
      if (!metricId) {
        res.status(400).json({ error: 'Metric ID is required' });
        return;
      }

      const analysis = await metricsService.getTrendAnalysis(metricId as string, period as string);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      structuredLogger.error('Failed to get trend analysis', error as Error);
      res.status(500).json({ error: 'Failed to get trend analysis' });
    }
  }

  async generateAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await metricsService.generateAlerts();
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      structuredLogger.error('Failed to generate alerts', error as Error);
      res.status(500).json({ error: 'Failed to generate alerts' });
    }
  }

  async updateMetric(req: Request, res: Response): Promise<void> {
    try {
      const { metricId, value } = req.body;
      
      if (!metricId || value === undefined) {
        res.status(400).json({ error: 'Metric ID and value are required' });
        return;
      }

      await metricsService.updateMetric(metricId, value);
      
      res.json({
        success: true,
        message: 'Metric updated successfully'
      });
    } catch (error) {
      structuredLogger.error('Failed to update metric', error as Error);
      res.status(500).json({ error: 'Failed to update metric' });
    }
  }

  // PR-14: AutoML endpoints
  async trainModel(req: Request, res: Response): Promise<void> {
    try {
      const { modelId, data, algorithm } = req.body;
      
      if (!modelId || !data) {
        res.status(400).json({ error: 'Model ID and training data are required' });
        return;
      }

      const model = await autoML.trainModel(modelId, data, algorithm);
      
      res.json({
        success: true,
        data: model
      });
    } catch (error) {
      structuredLogger.error('Failed to train model', error as Error);
      res.status(500).json({ error: 'Failed to train model' });
    }
  }

  async predict(req: Request, res: Response): Promise<void> {
    try {
      const { modelId, features } = req.body;
      
      if (!modelId || !features) {
        res.status(400).json({ error: 'Model ID and features are required' });
        return;
      }

      const prediction = await autoML.predict(modelId, features);
      
      res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      structuredLogger.error('Failed to generate prediction', error as Error);
      res.status(500).json({ error: 'Failed to generate prediction' });
    }
  }

  async evaluateModel(req: Request, res: Response): Promise<void> {
    try {
      const { modelId, testData } = req.body;
      
      if (!modelId || !testData) {
        res.status(400).json({ error: 'Model ID and test data are required' });
        return;
      }

      const evaluation = await autoML.evaluateModel(modelId, testData);
      
      res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      structuredLogger.error('Failed to evaluate model', error as Error);
      res.status(500).json({ error: 'Failed to evaluate model' });
    }
  }

  async getModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await autoML.getModels();
      
      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      structuredLogger.error('Failed to get models', error as Error);
      res.status(500).json({ error: 'Failed to get models' });
    }
  }

  // PR-14: Sentiment Analysis endpoints
  async analyzeSentiment(req: Request, res: Response): Promise<void> {
    try {
      const { text, source } = req.body;
      
      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const result = await sentimentAnalysis.analyzeSentiment(text, source);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      structuredLogger.error('Failed to analyze sentiment', error as Error);
      res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  }

  async analyzeBatchSentiment(req: Request, res: Response): Promise<void> {
    try {
      const { texts, source } = req.body;
      
      if (!texts || !Array.isArray(texts)) {
        res.status(400).json({ error: 'Texts array is required' });
        return;
      }

      const result = await sentimentAnalysis.analyzeBatch(texts, source);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      structuredLogger.error('Failed to analyze batch sentiment', error as Error);
      res.status(500).json({ error: 'Failed to analyze batch sentiment' });
    }
  }

  async getSentimentTrends(req: Request, res: Response): Promise<void> {
    try {
      const { source, period = '30d' } = req.query;
      
      if (!source) {
        res.status(400).json({ error: 'Source is required' });
        return;
      }

      const trends = await sentimentAnalysis.getTrendAnalysis(source as string, period as string);
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      structuredLogger.error('Failed to get sentiment trends', error as Error);
      res.status(500).json({ error: 'Failed to get sentiment trends' });
    }
  }

  // PR-15: Azure OpenAI endpoints
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { messages, options } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required' });
        return;
      }

      const response = await azureOpenAI.chat(messages, options);
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      structuredLogger.error('Failed to process chat', error as Error);
      res.status(500).json({ error: 'Failed to process chat' });
    }
  }

  async generateImage(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, size, quality, style } = req.body;
      
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const response = await azureOpenAI.generateImage({
        prompt,
        size,
        quality,
        style
      });
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      structuredLogger.error('Failed to generate image', error as Error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  }

  async textToSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { text, voice, speed, pitch } = req.body;
      
      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const response = await azureOpenAI.textToSpeech({
        text,
        voice,
        speed,
        pitch
      });
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      structuredLogger.error('Failed to convert text to speech', error as Error);
      res.status(500).json({ error: 'Failed to convert text to speech' });
    }
  }

  async getUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;
      
      const stats = await azureOpenAI.getUsageStats(period as string);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      structuredLogger.error('Failed to get usage stats', error as Error);
      res.status(500).json({ error: 'Failed to get usage stats' });
    }
  }

  // Web Search endpoints
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, options } = req.body;
      
      if (!query) {
        res.status(400).json({ error: 'Query is required' });
        return;
      }

      const response = await webSearch.search(query, options);
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      structuredLogger.error('Failed to perform web search', error as Error);
      res.status(500).json({ error: 'Failed to perform web search' });
    }
  }

  async searchNews(req: Request, res: Response): Promise<void> {
    try {
      const { query, options } = req.body;
      
      if (!query) {
        res.status(400).json({ error: 'Query is required' });
        return;
      }

      const response = await webSearch.searchNews(query, options);
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      structuredLogger.error('Failed to search news', error as Error);
      res.status(500).json({ error: 'Failed to search news' });
    }
  }

  async getTrendingTopics(req: Request, res: Response): Promise<void> {
    try {
      const topics = await webSearch.getTrendingTopics();
      
      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      structuredLogger.error('Failed to get trending topics', error as Error);
      res.status(500).json({ error: 'Failed to get trending topics' });
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        services: {
          predictiveAI: 'operational',
          metrics: 'operational',
          autoML: 'operational',
          sentimentAnalysis: 'operational',
          azureOpenAI: 'operational',
          webSearch: 'operational'
        },
        timestamp: new Date()
      };
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      structuredLogger.error('Health check failed', error as Error);
      res.status(500).json({ error: 'Health check failed' });
    }
  }
}

export const advancedFeaturesController = new AdvancedFeaturesController();
