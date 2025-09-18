import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '../lib/database.service.js';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const NextAIRequestSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestType: z.enum(['chat', 'analysis', 'prediction', 'generation', 'optimization', 'insights']),
  input: z.object({
    text: z.string().optional(),
    data: z.record(z.any()).optional(),
    context: z.record(z.any()).optional(),
    preferences: z.record(z.any()).optional(),
  }),
  options: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
    stream: z.boolean().optional(),
    includeMetadata: z.boolean().optional(),
  }).optional(),
});

export const NextAIResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    requestType: z.string(),
    output: z.any(),
    metadata: z.object({
      model: z.string(),
      tokens: z.object({
        input: z.number(),
        output: z.number(),
        total: z.number(),
      }),
      processingTime: z.number(),
      confidence: z.number().optional(),
      suggestions: z.array(z.string()).optional(),
    }),
    insights: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  error: z.string().optional(),
});

export type NextAIRequest = z.infer<typeof NextAIRequestSchema>;
export type NextAIResponse = z.infer<typeof NextAIResponseSchema>;

// ============================================================================
// NEXT AI PLATFORM SERVICE
// ============================================================================

export class NextAIPlatformService {
  private db: ReturnType<typeof getDatabaseService>;
  private sessionCache: Map<string, any> = new Map();
  private modelRegistry: Map<string, any> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing Next AI Platform Service', {
        service: 'next-ai-platform',
        timestamp: new Date().toISOString(),
      });

      // Initialize platform tables
      await this.initializePlatformTables();
      
      // Register AI models
      await this.registerAIModels();
      
      // Start background processing
      this.startBackgroundProcessing();

      structuredLogger.info('Next AI Platform Service initialized successfully', {
        service: 'next-ai-platform',
        status: 'ready',
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize Next AI Platform Service', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async initializePlatformTables(): Promise<void> {
    try {
      // Create next AI platform tables
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS next_ai_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL,
          user_id UUID NOT NULL,
          organization_id UUID NOT NULL,
          session_type VARCHAR(50) NOT NULL,
          session_data JSONB,
          context JSONB,
          preferences JSONB,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS next_ai_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL,
          user_id UUID NOT NULL,
          organization_id UUID NOT NULL,
          request_type VARCHAR(50) NOT NULL,
          input_data JSONB NOT NULL,
          output_data JSONB,
          model_used VARCHAR(100),
          tokens_used INTEGER,
          processing_time_ms INTEGER,
          confidence_score DECIMAL(3,2),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS next_ai_models (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          model_name VARCHAR(100) NOT NULL UNIQUE,
          model_type VARCHAR(50) NOT NULL,
          capabilities JSONB NOT NULL,
          performance_metrics JSONB,
          cost_per_token DECIMAL(10,6),
          availability BOOLEAN DEFAULT true,
          version VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS next_ai_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          insight_type VARCHAR(50) NOT NULL,
          insight_title VARCHAR(200) NOT NULL,
          insight_content TEXT NOT NULL,
          insight_data JSONB,
          confidence_score DECIMAL(3,2),
          impact_level VARCHAR(20),
          actionable BOOLEAN DEFAULT true,
          tags JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
      `);

      // Create indexes
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_next_ai_sessions_org 
        ON next_ai_sessions(organization_id, created_at);
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_next_ai_requests_session 
        ON next_ai_requests(session_id, created_at);
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_next_ai_models_type 
        ON next_ai_models(model_type, availability);
      `);

      structuredLogger.info('Next AI Platform tables initialized successfully', {
        service: 'next-ai-platform',
        tables: ['sessions', 'requests', 'models', 'insights'],
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize platform tables', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async registerAIModels(): Promise<void> {
    try {
      const models = [
        {
          name: 'gpt-4o-mini',
          type: 'chat',
          capabilities: ['text-generation', 'conversation', 'analysis'],
          cost_per_token: 0.00015,
          version: '1.0',
        },
        {
          name: 'gpt-4o',
          type: 'chat',
          capabilities: ['text-generation', 'conversation', 'analysis', 'reasoning'],
          cost_per_token: 0.005,
          version: '1.0',
        },
        {
          name: 'dall-e-3',
          type: 'image',
          capabilities: ['image-generation', 'image-editing'],
          cost_per_token: 0.04,
          version: '1.0',
        },
        {
          name: 'whisper-1',
          type: 'audio',
          capabilities: ['speech-to-text', 'transcription'],
          cost_per_token: 0.006,
          version: '1.0',
        },
        {
          name: 'tts-1',
          type: 'audio',
          capabilities: ['text-to-speech', 'voice-synthesis'],
          cost_per_token: 0.015,
          version: '1.0',
        },
      ];

      for (const model of models) {
        await this.db.query(`
          INSERT INTO next_ai_models (
            model_name, model_type, capabilities, cost_per_token, version
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (model_name) DO UPDATE SET
            model_type = EXCLUDED.model_type,
            capabilities = EXCLUDED.capabilities,
            cost_per_token = EXCLUDED.cost_per_token,
            version = EXCLUDED.version,
            updated_at = NOW()
        `, [
          model.name,
          model.type,
          JSON.stringify(model.capabilities),
          model.cost_per_token,
          model.version,
        ]);

        this.modelRegistry.set(model.name, model);
      }

      structuredLogger.info('AI models registered successfully', {
        service: 'next-ai-platform',
        modelsCount: models.length,
      });
    } catch (error) {
      structuredLogger.error('Failed to register AI models', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private startBackgroundProcessing(): void {
    // Process insights every 10 minutes
    setInterval(async () => {
      try {
        await this.processInsights();
      } catch (error) {
        structuredLogger.error('Background insights processing failed', {
          service: 'next-ai-platform',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 10 * 60 * 1000);

    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        structuredLogger.error('Session cleanup failed', {
          service: 'next-ai-platform',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 60 * 60 * 1000);
  }

  // ============================================================================
  // MAIN PLATFORM METHODS
  // ============================================================================

  async processRequest(request: NextAIRequest): Promise<NextAIResponse> {
    const startTime = Date.now();
    
    try {
      structuredLogger.info('Processing Next AI request', {
        service: 'next-ai-platform',
        requestType: request.requestType,
        userId: request.userId,
        organizationId: request.organizationId,
      });

      // Get or create session
      const session = await this.getOrCreateSession(request);
      
      // Process based on request type
      let result: any;
      switch (request.requestType) {
        case 'chat':
          result = await this.processChatRequest(request, session);
          break;
        case 'analysis':
          result = await this.processAnalysisRequest(request, session);
          break;
        case 'prediction':
          result = await this.processPredictionRequest(request, session);
          break;
        case 'generation':
          result = await this.processGenerationRequest(request, session);
          break;
        case 'optimization':
          result = await this.processOptimizationRequest(request, session);
          break;
        case 'insights':
          result = await this.processInsightsRequest(request, session);
          break;
        default:
          throw new Error(`Unsupported request type: ${request.requestType}`);
      }

      // Record request
      await this.recordRequest(request, result, Date.now() - startTime);

      const response: NextAIResponse = {
        success: true,
        data: {
          requestType: request.requestType,
          output: result.output,
          metadata: {
            model: result.model || 'gpt-4o-mini',
            tokens: {
              input: result.inputTokens || 0,
              output: result.outputTokens || 0,
              total: (result.inputTokens || 0) + (result.outputTokens || 0),
            },
            processingTime: Date.now() - startTime,
            confidence: result.confidence,
            suggestions: result.suggestions,
          },
          insights: result.insights,
          recommendations: result.recommendations,
        },
      };

      structuredLogger.info('Next AI request processed successfully', {
        service: 'next-ai-platform',
        requestType: request.requestType,
        processingTime: Date.now() - startTime,
        tokens: response.data.metadata.tokens.total,
      });

      return response;
    } catch (error) {
      structuredLogger.error('Failed to process Next AI request', {
        service: 'next-ai-platform',
        requestType: request.requestType,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });

      return {
        success: false,
        data: {
          requestType: request.requestType,
          output: null,
          metadata: {
            model: 'error',
            tokens: { input: 0, output: 0, total: 0 },
            processingTime: Date.now() - startTime,
          },
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // REQUEST TYPE PROCESSORS
  // ============================================================================

  private async processChatRequest(request: NextAIRequest, session: any): Promise<any> {
    const { input, options } = request;
    const model = options?.model || 'gpt-4o-mini';
    
    // Simulate chat processing
    const response = await this.simulateAIResponse(input.text || '', 'chat', model);
    
    return {
      output: {
        message: response.text,
        conversationId: session.id,
        timestamp: new Date().toISOString(),
      },
      model,
      inputTokens: this.estimateTokens(input.text || ''),
      outputTokens: this.estimateTokens(response.text),
      confidence: response.confidence,
      suggestions: response.suggestions,
      insights: response.insights,
      recommendations: response.recommendations,
    };
  }

  private async processAnalysisRequest(request: NextAIRequest, session: any): Promise<any> {
    const { input, options } = request;
    const model = options?.model || 'gpt-4o';
    
    // Simulate analysis processing
    const response = await this.simulateAIResponse(JSON.stringify(input.data || {}), 'analysis', model);
    
    return {
      output: {
        analysis: response.analysis,
        summary: response.summary,
        keyFindings: response.keyFindings,
        timestamp: new Date().toISOString(),
      },
      model,
      inputTokens: this.estimateTokens(JSON.stringify(input.data || {})),
      outputTokens: this.estimateTokens(JSON.stringify(response)),
      confidence: response.confidence,
      insights: response.insights,
      recommendations: response.recommendations,
    };
  }

  private async processPredictionRequest(request: NextAIRequest, session: any): Promise<any> {
    const { input, options } = request;
    const model = options?.model || 'gpt-4o';
    
    // Simulate prediction processing
    const response = await this.simulateAIResponse(JSON.stringify(input.data || {}), 'prediction', model);
    
    return {
      output: {
        predictions: response.predictions,
        confidence: response.confidence,
        timeframe: response.timeframe,
        factors: response.factors,
        timestamp: new Date().toISOString(),
      },
      model,
      inputTokens: this.estimateTokens(JSON.stringify(input.data || {})),
      outputTokens: this.estimateTokens(JSON.stringify(response)),
      confidence: response.confidence,
      insights: response.insights,
      recommendations: response.recommendations,
    };
  }

  private async processGenerationRequest(request: NextAIRequest, session: any): Promise<any> {
    const { input, options } = request;
    const model = options?.model || 'gpt-4o-mini';
    
    // Simulate generation processing
    const response = await this.simulateAIResponse(input.text || '', 'generation', model);
    
    return {
      output: {
        generated: response.generated,
        alternatives: response.alternatives,
        metadata: response.metadata,
        timestamp: new Date().toISOString(),
      },
      model,
      inputTokens: this.estimateTokens(input.text || ''),
      outputTokens: this.estimateTokens(response.generated),
      confidence: response.confidence,
      suggestions: response.suggestions,
      insights: response.insights,
      recommendations: response.recommendations,
    };
  }

  private async processOptimizationRequest(request: NextAIRequest, session: any): Promise<any> {
    const { input, options } = request;
    const model = options?.model || 'gpt-4o';
    
    // Simulate optimization processing
    const response = await this.simulateAIResponse(JSON.stringify(input.data || {}), 'optimization', model);
    
    return {
      output: {
        optimized: response.optimized,
        improvements: response.improvements,
        metrics: response.metrics,
        timestamp: new Date().toISOString(),
      },
      model,
      inputTokens: this.estimateTokens(JSON.stringify(input.data || {})),
      outputTokens: this.estimateTokens(JSON.stringify(response)),
      confidence: response.confidence,
      insights: response.insights,
      recommendations: response.recommendations,
    };
  }

  private async processInsightsRequest(request: NextAIRequest, session: any): Promise<any> {
    const { input, options } = request;
    const model = options?.model || 'gpt-4o';
    
    // Simulate insights processing
    const response = await this.simulateAIResponse(JSON.stringify(input.data || {}), 'insights', model);
    
    return {
      output: {
        insights: response.insights,
        patterns: response.patterns,
        recommendations: response.recommendations,
        timestamp: new Date().toISOString(),
      },
      model,
      inputTokens: this.estimateTokens(JSON.stringify(input.data || {})),
      outputTokens: this.estimateTokens(JSON.stringify(response)),
      confidence: response.confidence,
      insights: response.insights,
      recommendations: response.recommendations,
    };
  }

  // ============================================================================
  // AI SIMULATION METHODS
  // ============================================================================

  private async simulateAIResponse(input: string, type: string, model: string): Promise<any> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const responses = {
      chat: {
        text: `I understand you're asking about: "${input.substring(0, 100)}...". Here's my response based on the context.`,
        confidence: 0.85,
        suggestions: ['Would you like more details?', 'Should I elaborate on any specific aspect?'],
        insights: ['The query shows interest in detailed information'],
        recommendations: ['Consider asking follow-up questions for deeper understanding'],
      },
      analysis: {
        analysis: 'Comprehensive analysis of the provided data',
        summary: 'Key findings and patterns identified',
        keyFindings: ['Finding 1', 'Finding 2', 'Finding 3'],
        confidence: 0.90,
        insights: ['Data shows clear patterns', 'Trends are consistent'],
        recommendations: ['Monitor these patterns regularly', 'Consider additional data sources'],
      },
      prediction: {
        predictions: [
          85, confidence: 0.8, timeframe: '1 month',
          92, confidence: 0.7, timeframe: '3 months',
        ],
        confidence: 0.75,
        timeframe: '1-3 months',
        factors: ['Factor 1', 'Factor 2', 'Factor 3'],
        insights: ['Predictions show upward trend', 'Confidence decreases with longer timeframe'],
        recommendations: ['Focus on short-term predictions', 'Gather more data for long-term accuracy'],
      },
      generation: {
        generated: `Generated content based on: "${input.substring(0, 50)}..."`,
        alternatives: ['Alternative 1', 'Alternative 2'],
        metadata: { style: 'professional', length: 'medium' },
        confidence: 0.88,
        suggestions: ['Try a different style', 'Adjust the length'],
        insights: ['Content follows requested format', 'Quality meets standards'],
        recommendations: ['Review and refine as needed', 'Consider user feedback'],
      },
      optimization: {
        optimized: 'Optimized version of the input',
        improvements: ['Improvement 1', 'Improvement 2'],
        metrics: { efficiency: 0.95, performance: 0.87 },
        confidence: 0.92,
        insights: ['Significant improvements possible', 'Multiple optimization paths available'],
        recommendations: ['Implement suggested improvements', 'Monitor performance metrics'],
      },
      insights: {
        insights: ['Clear patterns identified', 'Actionable insights available'],
        patterns: ['Pattern A', 'Pattern B'],
        recommendations: ['Act on high-confidence insights', 'Investigate patterns further'],
        confidence: 0.80,
      },
    };

    return responses[type as keyof typeof responses] || responses.chat;
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  private async getOrCreateSession(request: NextAIRequest): Promise<any> {
    try {
      // Check if session exists
      const existingSession = await this.db.query(`
        SELECT * FROM next_ai_sessions 
        WHERE session_id = $1 AND status = 'active'
      `, [request.sessionId]);

      if (existingSession.rows.length > 0) {
        return existingSession.rows[0];
      }

      // Create new session
      const newSession = await this.db.query(`
        INSERT INTO next_ai_sessions (
          session_id, user_id, organization_id, session_type, 
          session_data, context, preferences, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        request.sessionId,
        request.userId,
        request.organizationId,
        request.requestType,
        JSON.stringify(request.input),
        JSON.stringify(request.input.context || {}),
        JSON.stringify(request.input.preferences || {}),
        new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ]);

      return newSession.rows[0];
    } catch (error) {
      structuredLogger.error('Failed to get or create session', {
        service: 'next-ai-platform',
        sessionId: request.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async recordRequest(request: NextAIRequest, result: any, processingTime: number): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO next_ai_requests (
          session_id, user_id, organization_id, request_type,
          input_data, output_data, model_used, tokens_used,
          processing_time_ms, confidence_score, success, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        request.sessionId,
        request.userId,
        request.organizationId,
        request.requestType,
        JSON.stringify(request.input),
        JSON.stringify(result.output),
        result.model,
        result.inputTokens + result.outputTokens,
        processingTime,
        result.confidence,
        true,
        JSON.stringify({
          options: request.options,
          timestamp: new Date().toISOString(),
        }),
      ]);
    } catch (error) {
      structuredLogger.error('Failed to record request', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // BACKGROUND PROCESSING
  // ============================================================================

  private async processInsights(): Promise<void> {
    try {
      // Get organizations with recent activity
      const orgsResult = await this.db.query(`
        SELECT DISTINCT organization_id 
        FROM next_ai_requests 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);

      for (const org of orgsResult.rows) {
        await this.generateOrganizationInsights(org.organization_id);
      }
    } catch (error) {
      structuredLogger.error('Failed to process insights', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async generateOrganizationInsights(organizationId: string): Promise<void> {
    try {
      // Analyze usage patterns
      const usageResult = await this.db.query(`
        SELECT 
          request_type,
          COUNT(*) as request_count,
          AVG(processing_time_ms) as avg_processing_time,
          AVG(confidence_score) as avg_confidence
        FROM next_ai_requests
        WHERE organization_id = $1
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY request_type
      `, [organizationId]);

      for (const row of usageResult.rows) {
        if (row.avg_confidence < 0.7) {
          await this.createInsight(organizationId, {
            type: 'performance',
            title: `Low confidence in ${row.request_type} requests`,
            content: `${row.request_type} requests have average confidence of ${(row.avg_confidence * 100).toFixed(1)}%`,
            data: { requestType: row.request_type, confidence: row.avg_confidence },
            confidence: 0.9,
            impact: 'medium',
            actionable: true,
            tags: ['performance', 'confidence'],
          });
        }
      }
    } catch (error) {
      structuredLogger.error('Failed to generate organization insights', {
        service: 'next-ai-platform',
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async createInsight(organizationId: string, insight: any): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO next_ai_insights (
          organization_id, insight_type, insight_title, insight_content,
          insight_data, confidence_score, impact_level, actionable, tags, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        organizationId,
        insight.type,
        insight.title,
        insight.content,
        JSON.stringify(insight.data),
        insight.confidence,
        insight.impact,
        insight.actionable,
        JSON.stringify(insight.tags),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ]);
    } catch (error) {
      structuredLogger.error('Failed to create insight', {
        service: 'next-ai-platform',
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.db.query(`
        UPDATE next_ai_sessions 
        SET status = 'expired' 
        WHERE expires_at < NOW() AND status = 'active'
      `);

      await this.db.query(`
        DELETE FROM next_ai_insights 
        WHERE expires_at < NOW()
      `);

      structuredLogger.info('Expired sessions and insights cleaned up', {
        service: 'next-ai-platform',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      structuredLogger.error('Session cleanup failed', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  async getAvailableModels(): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM next_ai_models 
        WHERE availability = true 
        ORDER BY model_type, model_name
      `);

      return result.rows.map(row => ({
        name: row.model_name,
        type: row.model_type,
        capabilities: row.capabilities,
        costPerToken: parseFloat(row.cost_per_token),
        version: row.version,
      }));
    } catch (error) {
      structuredLogger.error('Failed to get available models', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM next_ai_requests 
        WHERE session_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [sessionId]);

      return result.rows.map(row => ({
        id: row.id,
        requestType: row.request_type,
        input: row.input_data,
        output: row.output_data,
        model: row.model_used,
        tokens: row.tokens_used,
        processingTime: row.processing_time_ms,
        confidence: parseFloat(row.confidence_score),
        success: row.success,
        createdAt: row.created_at,
      }));
    } catch (error) {
      structuredLogger.error('Failed to get session history', {
        service: 'next-ai-platform',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getInsights(organizationId: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM next_ai_insights 
        WHERE organization_id = $1 
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY confidence_score DESC, created_at DESC 
        LIMIT $2
      `, [organizationId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        type: row.insight_type,
        title: row.insight_title,
        content: row.insight_content,
        data: row.insight_data,
        confidence: parseFloat(row.confidence_score),
        impact: row.impact_level,
        actionable: row.actionable,
        tags: row.tags,
        createdAt: row.created_at,
      }));
    } catch (error) {
      structuredLogger.error('Failed to get insights', {
        service: 'next-ai-platform',
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    lastCheck: Date;
  }> {
    try {
      const services = {
        database: true,
        cache: true,
        backgroundProcessing: true,
        modelRegistry: true,
      };

      // Check database connection
      try {
        await this.db.query('SELECT 1');
      } catch (error) {
        services.database = false;
      }

      // Check cache
      services.cache = this.sessionCache.size >= 0;

      // Check model registry
      services.modelRegistry = this.modelRegistry.size > 0;

      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyServices === totalServices) {
        status = 'healthy';
      } else if (healthyServices > totalServices / 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        services,
        lastCheck: new Date(),
      };
    } catch (error) {
      structuredLogger.error('Failed to get health status', {
        service: 'next-ai-platform',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        status: 'unhealthy',
        services: {
          database: false,
          cache: false,
          backgroundProcessing: false,
          modelRegistry: false,
        },
        lastCheck: new Date(),
      };
    }
  }
}

export const nextAIPlatformService = new NextAIPlatformService();
