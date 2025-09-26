import { z } from 'zod';

import { structuredLogger } from '../../lib/structured-logger.js';
import { basicAIService } from '../../lib/basic-ai/basic-ai.service.js';
import { ErrorHandler } from '../../lib/error-handler.js';
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
export class BasicAIController {
    async generateResponse(req, res) {
        try {
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
            let currentSessionId = sessionId;
            if (!currentSessionId) {
                currentSessionId = await basicAIService.createSession(user.id, user.organizationId);
            }
            const context = {
                userId: user.id,
                organizationId: user.organizationId,
                sessionId: currentSessionId,
                userPreferences: {
                    language: 'es',
                    responseStyle: 'formal',
                    maxLength: options?.maxTokens || 500
                }
            };
            const aiRequest = {
                prompt,
                context,
                options
            };
            const response = await basicAIService.generateResponse(aiRequest);
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
        }
        catch (error) {
            structuredLogger.error('Failed to generate AI response', error, {
                userId: req.user?.id,
                organizationId: req.user?.organizationId
            });
            const errorResponse = ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                success: false,
                error: errorResponse.message,
                code: errorResponse.code
            });
        }
    }
    async createSession(req, res) {
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
            const sessionId = await basicAIService.createSession(user.id, user.organizationId);
            if (preferences) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to create AI session', error, {
                userId: req.user?.id,
                organizationId: req.user?.organizationId
            });
            const errorResponse = ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                success: false,
                error: errorResponse.message,
                code: errorResponse.code
            });
        }
    }
    async getSessionHistory(req, res) {
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
            const history = await basicAIService.getSessionHistory(sessionId);
            res.json({
                success: true,
                data: {
                    sessionId,
                    history,
                    totalMessages: history.length
                }
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get session history', error, {
                userId: req.user?.id,
                sessionId: req.params.sessionId
            });
            const errorResponse = ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                success: false,
                error: errorResponse.message,
                code: errorResponse.code
            });
        }
    }
    async clearSession(req, res) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to clear AI session', error, {
                userId: req.user?.id,
                sessionId: req.params.sessionId
            });
            const errorResponse = ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                success: false,
                error: errorResponse.message,
                code: errorResponse.code
            });
        }
    }
    async getHealthStatus(req, res) {
        try {
            const healthStatus = await basicAIService.getHealthStatus();
            const statusCode = healthStatus.status === 'healthy' ? 200 :
                healthStatus.status === 'degraded' ? 200 : 503;
            res.status(statusCode).json({
                success: true,
                data: healthStatus
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get AI health status', error);
            res.status(503).json({
                success: false,
                error: 'AI service health check failed',
                code: 'HEALTH_CHECK_FAILED'
            });
        }
    }
    async getCapabilities(req, res) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to get AI capabilities', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get AI capabilities',
                code: 'CAPABILITIES_ERROR'
            });
        }
    }
}
export const basicAIController = new BasicAIController();
//# sourceMappingURL=basic-ai.controller.js.map