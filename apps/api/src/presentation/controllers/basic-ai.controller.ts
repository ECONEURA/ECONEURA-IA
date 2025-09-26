import { Request, Response } from 'express';
import { z } from 'zod';

import { structuredLogger } from '../../lib/structured-logger.js';
import { basicAIService, AIRequest, AIContext } from '../../lib/basic-ai/basic-ai.service.js';
import { ErrorHandler } from '../../lib/error-handler.js';

// ============================================================================
// BASIC AI CONTROLLER - PR-16
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    roles: string[];
    permissions: string[];
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GenerateResponseSchema = z.object({
  prompt: z.string().min(1).max(5000),
  sessionId: z.string().optional(),
  options: z.object({
    maxTokens: z.number().min(1).max(4000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    includeAnalysis: z.boolean().optional(),
    includeSuggestions: z.boolean().optional()
  }).optional()
});

const CreateSessionSchema = z.object({
  preferences: z.object({
    language: z.string().optional(),
    responseStyle: z.enum(['formal', 'casual', 'technical']).optional(),
    maxLength: z.number().min(100).max(2000).optional()
  }).optional()
});

// ============================================================================
// CONTROLLER CLASS
// ============================================================================

export class BasicAIController {
  
  // ============================================================================
  // POST /api/ai/generate - Generate AI Response
  // ============================================================================
  
  async generateResponse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validar request
      const validationResult = GenerateResponseSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
        return;
      }

      const { prompt, sessionId, options } = validationResult.data;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Crear o usar sesión existente
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await basicAIService.createSession(user.id, user.organizationId);
      }

      // Crear contexto de IA
      const context: AIContext = {
        userId: user.id,
        organizationId: user.organizationId,
        sessionId: currentSessionId,
        userPreferences: {
          language: 'es',
          responseStyle: 'formal',
          maxLength: options?.maxTokens || 500
        }
      };

      // Crear request de IA
      const aiRequest: AIRequest = {
        prompt,
        context,
        options
      };

      // Generar respuesta
      const response = await basicAIService.generateResponse(aiRequest);

      // Log de la interacción
      structuredLogger.info('AI response generated', {
        userId: user.id,
        organizationId: user.organizationId,
        sessionId: currentSessionId,
        responseId: response.id,
        responseType: response.type,
        confidence: response.confidence,
        processingTime: response.metadata.processingTime
      });

      res.json({
        success: true,
        data: {
          response,
          sessionId: currentSessionId
        }
      });

    } catch (error) {
      structuredLogger.error('Failed to generate AI response', error as Error, {
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      const errorResponse = ErrorHandler.handle(error as Error);
      res.status(errorResponse.statusCode).json({
        success: false,
        error: errorResponse.message,
        code: errorResponse.code
      });
    }
  }

  // ============================================================================
  // POST /api/ai/sessions - Create New Session
  // ============================================================================
  
  async createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validationResult = CreateSessionSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
        return;
      }

      const { preferences } = validationResult.data;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Crear nueva sesión
      const sessionId = await basicAIService.createSession(user.id, user.organizationId);

      // Aplicar preferencias si se proporcionan
      if (preferences) {
        // Las preferencias se aplicarán en futuras interacciones
        structuredLogger.info('AI session created with preferences', {
          userId: user.id,
          organizationId: user.organizationId,
          sessionId,
          preferences
        });
      }

      res.json({
        success: true,
        data: {
          sessionId,
          preferences: preferences || {
            language: 'es',
            responseStyle: 'formal',
            maxLength: 500
          }
        }
      });

    } catch (error) {
      structuredLogger.error('Failed to create AI session', error as Error, {
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      const errorResponse = ErrorHandler.handle(error as Error);
      res.status(errorResponse.statusCode).json({
        success: false,
        error: errorResponse.message,
        code: errorResponse.code
      });
    }
  }

  // ============================================================================
  // GET /api/ai/sessions/:sessionId/history - Get Session History
  // ============================================================================
  
  async getSessionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
        return;
      }

      // Obtener historial de la sesión
      const history = await basicAIService.getSessionHistory(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          history,
          totalMessages: history.length
        }
      });

    } catch (error) {
      structuredLogger.error('Failed to get session history', error as Error, {
        userId: req.user?.id,
        sessionId: req.params.sessionId
      });

      const errorResponse = ErrorHandler.handle(error as Error);
      res.status(errorResponse.statusCode).json({
        success: false,
        error: errorResponse.message,
        code: errorResponse.code
      });
    }
  }

  // ============================================================================
  // DELETE /api/ai/sessions/:sessionId - Clear Session
  // ============================================================================
  
  async clearSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
        return;
      }

      // Limpiar sesión
      await basicAIService.clearSession(sessionId);

      structuredLogger.info('AI session cleared', {
        userId: user.id,
        organizationId: user.organizationId,
        sessionId
      });

      res.json({
        success: true,
        message: 'Session cleared successfully'
      });

    } catch (error) {
      structuredLogger.error('Failed to clear AI session', error as Error, {
        userId: req.user?.id,
        sessionId: req.params.sessionId
      });

      const errorResponse = ErrorHandler.handle(error as Error);
      res.status(errorResponse.statusCode).json({
        success: false,
        error: errorResponse.message,
        code: errorResponse.code
      });
    }
  }

  // ============================================================================
  // GET /api/ai/health - Health Check
  // ============================================================================
  
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await basicAIService.getHealthStatus();

      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        success: true,
        data: healthStatus
      });

    } catch (error) {
      structuredLogger.error('Failed to get AI health status', error as Error);

      res.status(503).json({
        success: false,
        error: 'AI service health check failed',
        code: 'HEALTH_CHECK_FAILED'
      });
    }
  }

  // ============================================================================
  // GET /api/ai/capabilities - Get AI Capabilities
  // ============================================================================
  
  async getCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const capabilities = {
        textGeneration: {
          available: true,
          models: ['azure-openai-gpt-4', 'azure-openai-gpt-3.5-turbo'],
          maxTokens: 4000,
          supportedLanguages: ['es', 'en', 'fr', 'de', 'it', 'pt']
        },
        sentimentAnalysis: {
          available: true,
          models: ['sentiment-analysis-v2'],
          supportedLanguages: ['es', 'en', 'fr', 'de', 'it', 'pt'],
          features: ['emotion-detection', 'topic-extraction', 'keyword-extraction']
        },
        predictiveAnalytics: {
          available: true,
          models: ['predictive-ai-v1'],
          features: ['demand-forecasting', 'trend-analysis', 'recommendations']
        },
        webSearch: {
          available: true,
          models: ['web-search-v1'],
          maxResults: 10,
          features: ['summarization', 'relevance-scoring']
        },
        sessionManagement: {
          available: true,
          maxSessions: 100,
          maxMessagesPerSession: 50,
          features: ['context-preservation', 'preference-management']
        }
      };

      res.json({
        success: true,
        data: capabilities
      });

    } catch (error) {
      structuredLogger.error('Failed to get AI capabilities', error as Error);

      res.status(500).json({
        success: false,
        error: 'Failed to get AI capabilities',
        code: 'CAPABILITIES_ERROR'
      });
    }
  }
}

// ============================================================================
// EXPORT CONTROLLER INSTANCE
// ============================================================================

export const basicAIController = new BasicAIController();

