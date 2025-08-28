import { Router, Request } from 'express';
import { z } from 'zod';
import { EnhancedAIRouter, type EnhancedAIRequest } from '@econeura/shared/ai/enhanced-router';
import { logger } from '@econeura/shared/logging';
import { prometheus } from '@econeura/shared/metrics';
import { redactPII } from '@econeura/shared/security';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    org_id: string;
    [key: string]: any;
  };
}

const router = Router();

// Initialize AI Router
const aiRouter = new EnhancedAIRouter({
  costGuardrailsEnabled: process.env.NODE_ENV === 'production',
  telemetryEnabled: true,
  defaultMaxCostEUR: parseFloat(process.env.AI_DEFAULT_MAX_COST_EUR || '1.0'),
  emergencyStopEnabled: process.env.NODE_ENV === 'production',
  healthCheckInterval: 30000,
  alertWebhooks: process.env.COST_ALERT_WEBHOOKS?.split(','),
});

// Request schemas
const AIRequestSchema = z.object({
  content: z.string().min(1).max(50000),
  task_type: z.enum(['draft_email', 'analyze_invoice', 'summarize', 'classify']).default('summarize'),
  model: z.string().optional(),
  max_tokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().optional(),
  tools: z.array(z.string()).optional(),
  sensitivity: z.enum(['public', 'internal', 'confidential', 'pii']).default('internal'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  prefer_edge: z.boolean().default(true),
  max_cost_eur: z.number().positive().max(10).optional(),
  languages: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const ChatCompletionSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  model: z.string().optional(),
  max_tokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(false),
  tools: z.array(z.object({
    type: z.string(),
    function: z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.unknown()),
    }),
  })).optional(),
});

/**
 * POST /ai/chat/completions
 * OpenAI-compatible chat completions endpoint
 */
router.post('/chat/completions', async (req: AuthenticatedRequest, res) => {
  const startTime = Date.now();
  const orgId = req.user?.org_id || 'unknown';
  
  try {
    // Validate request
    const validatedRequest = ChatCompletionSchema.parse(req.body);
    
    // Convert to internal format
    const content = validatedRequest.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const capabilities = [];
    if (validatedRequest.tools?.length) {
      capabilities.push('function_calling');
    }
    
    const aiRequest: EnhancedAIRequest = {
      org_id: orgId,
      taskType: 'summarize', // Default task type for chat completions
      content,
      tokens_est: Math.ceil(content.length / 4), // Rough token estimation
      budget_cents: 200, // 2 EUR default
      sensitivity: 'internal',
      tools_needed: capabilities,
      languages: ['en'],
      model: validatedRequest.model,
      requiresCapabilities: capabilities,
      preferEdge: true,
      maxCostEUR: 2.0,
      priority: 'medium',
      metadata: {
        endpoint: 'chat/completions',
        original_request: validatedRequest,
      },
    };

    // Route the request
    const decision = await aiRouter.routeRequest(aiRequest);
    
    // Process content (with PII redaction if needed)
    const { processedContent, redactionTokens } = await aiRouter.processRequestContent(
      content,
      decision,
      aiRequest
    );

    logger.info('AI request routed', {
      org_id: orgId,
      provider: decision.provider.id,
      model: decision.model,
      estimated_cost: decision.estimatedCost,
      routing_reason: decision.routingReason,
    });

    // For demo purposes, return a mock response
    // In production, this would make the actual API call to the selected provider
    const mockResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: decision.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `[DEMO] This is a mock response from ${decision.provider.name} (${decision.model}). In production, this would contain the actual AI response. Routing reason: ${decision.routingReason}`,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: Math.ceil(content.length / 4),
        completion_tokens: 50,
        total_tokens: Math.ceil(content.length / 4) + 50,
      },
      system_fingerprint: 'econeura-ai-router-v1',
    };

    // Record successful completion
    const requestId = mockResponse.id;
    await aiRouter.recordRequestCompletion(
      requestId,
      true, // success
      decision.estimatedCost,
      mockResponse.usage.prompt_tokens,
      mockResponse.usage.completion_tokens
    );

    // Update metrics
    prometheus.aiRequestsTotal.labels({
      org_id: orgId,
      provider: decision.provider.id,
      model: decision.model,
      status: 'success',
    }).inc();

    const processingTime = Date.now() - startTime;
    prometheus.aiLatency.labels({
      org_id: orgId,
      provider: decision.provider.id,
      model: decision.model,
    }).observe(processingTime / 1000);

    res.json(mockResponse);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('AI request failed', error instanceof Error ? error : new Error(String(error)), {
      org_id: orgId,
      processing_time_ms: processingTime,
    });

    prometheus.aiErrorsTotal.labels({
      org_id: orgId,
      provider: 'unknown',
      error_type: 'request_error',
    }).inc();

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          type: 'invalid_request_error',
          message: 'Invalid request format',
          details: error.errors,
        },
      });
    } else {
      res.status(500).json({
        error: {
          type: 'api_error',
          message: 'Internal server error',
          code: 'ai_router_error',
        },
      });
    }
  }
});

/**
 * POST /ai/generate
 * Simple text generation endpoint (mock o real según USE_MOCK_AI)
 */
router.post('/generate', async (req: AuthenticatedRequest, res) => {
  const startTime = Date.now();
  const orgId = req.user?.org_id || 'unknown';

  try {
    const validatedRequest = AIRequestSchema.parse(req.body);
    const USE_MOCK = (process.env.USE_MOCK_AI ?? 'true').toLowerCase() === 'true';

    const aiRequest: EnhancedAIRequest = {
      org_id: orgId,
      taskType: validatedRequest.task_type || 'summarize',
      content: validatedRequest.content,
      tokens_est: Math.ceil(validatedRequest.content.length / 4),
      budget_cents: (validatedRequest.max_cost_eur || 1.0) * 100,
      sensitivity: validatedRequest.sensitivity,
      tools_needed: validatedRequest.tools || [],
      languages: validatedRequest.languages || ['en'],
      model: validatedRequest.model,
      requiresCapabilities: validatedRequest.tools,
      preferEdge: validatedRequest.prefer_edge,
      maxCostEUR: validatedRequest.max_cost_eur || 1.0,
      priority: validatedRequest.priority,
      metadata: {
        endpoint: 'generate',
        max_tokens: validatedRequest.max_tokens,
        temperature: validatedRequest.temperature,
      },
    };

    const decision = await aiRouter.routeRequest(aiRequest);
    const { processedContent } = await aiRouter.processRequestContent(
      validatedRequest.content,
      decision,
      aiRequest
    );

    if (USE_MOCK) {
      const mockResponse = {
        id: `gen-${Date.now()}`,
        created: Math.floor(Date.now() / 1000),
        provider: decision.provider.id,
        model: decision.model,
        content: `[DEMO] Generated response from ${decision.provider.name}. Routing: ${decision.routingReason}`,
        usage: {
          input_tokens: Math.ceil(validatedRequest.content.length / 4),
          output_tokens: 30,
          total_cost_eur: decision.estimatedCost,
        },
        routing: {
          provider: decision.provider.name,
          model: decision.model,
          reason: decision.routingReason,
          fallbacks: decision.fallbackProviders,
        },
      };

      await aiRouter.recordRequestCompletion(
        mockResponse.id,
        true,
        decision.estimatedCost,
        mockResponse.usage.input_tokens,
        mockResponse.usage.output_tokens
      );

      return res.json(mockResponse);
    }

    // TODO: integración real con provider seleccionado (cuando esté disponible)
    const realResponse = {
      id: `gen-${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      provider: decision.provider.id,
      model: decision.model,
      content: `[PLACEHOLDER] Real provider call pending. Routed to ${decision.provider.name} (${decision.model}).`,
      usage: {
        input_tokens: Math.ceil(processedContent.length / 4),
        output_tokens: 0,
        total_cost_eur: decision.estimatedCost,
      },
      routing: {
        provider: decision.provider.name,
        model: decision.model,
        reason: decision.routingReason,
        fallbacks: decision.fallbackProviders,
      },
    };

    await aiRouter.recordRequestCompletion(
      realResponse.id,
      true,
      decision.estimatedCost,
      realResponse.usage.input_tokens,
      realResponse.usage.output_tokens
    );
    res.json(realResponse);

  } catch (error) {
    logger.error('AI generation failed', error instanceof Error ? error : new Error(String(error)), {
      org_id: orgId,
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'AI generation failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

/**
 * GET /ai/usage
 * Get AI usage statistics for the organization
 */
router.get('/usage', (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user?.org_id || 'unknown';
    const usage = aiRouter.getOrganizationUsage(orgId);

    res.json({
      organization_id: orgId,
      usage,
    });
  } catch (error) {
    logger.error('Failed to get AI usage', error instanceof Error ? error : new Error(String(error)), {
      org_id: req.user?.org_id,
    });

    res.status(500).json({
      error: 'Failed to get usage statistics',
    });
  }
});

/**
 * GET /ai/providers
 * Get available AI providers and their health status
 */
router.get('/providers', (req, res) => {
  try {
    const systemStats = aiRouter.getSystemStats();
    
    res.json({
      providers: systemStats.providers,
      system_stats: {
        total_daily_cost: systemStats.totalDailyCost,
        total_monthly_cost: systemStats.totalMonthlyCost,
        active_organizations: systemStats.activeOrganizations,
        requests_24h: systemStats.totalRequests24h,
        average_latency_ms: systemStats.averageLatency,
        error_rate_percent: systemStats.errorRate,
        active_requests: systemStats.activeRequests,
      },
    });
  } catch (error) {
    logger.error('Failed to get providers info', error instanceof Error ? error : new Error(String(error)), {
    });

    res.status(500).json({
      error: 'Failed to get providers information',
    });
  }
});

/**
 * POST /ai/usage/limits
 * Update cost limits for the organization
 */
router.post('/usage/limits', (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user?.org_id || 'unknown';
    
    const limitsSchema = z.object({
      daily_limit_eur: z.number().positive().max(1000).optional(),
      monthly_limit_eur: z.number().positive().max(10000).optional(),
      per_request_limit_eur: z.number().positive().max(50).optional(),
      warning_thresholds: z.object({
        daily: z.number().min(0).max(100).optional(),
        monthly: z.number().min(0).max(100).optional(),
      }).optional(),
      emergency_stop: z.object({
        enabled: z.boolean().optional(),
        threshold_eur: z.number().positive().max(20000).optional(),
      }).optional(),
    });

    const validatedLimits = limitsSchema.parse(req.body);
    
    // Convert to internal format
    const limits: any = {};
    if (validatedLimits.daily_limit_eur) limits.dailyLimitEUR = validatedLimits.daily_limit_eur;
    if (validatedLimits.monthly_limit_eur) limits.monthlyLimitEUR = validatedLimits.monthly_limit_eur;
    if (validatedLimits.per_request_limit_eur) limits.perRequestLimitEUR = validatedLimits.per_request_limit_eur;
    if (validatedLimits.warning_thresholds) limits.warningThresholds = validatedLimits.warning_thresholds;
    if (validatedLimits.emergency_stop) limits.emergencyStop = validatedLimits.emergency_stop;

    aiRouter.updateOrganizationLimits(orgId, limits);

    logger.info('AI cost limits updated', {
      org_id: orgId,
      limits: validatedLimits,
    });

    res.json({
      message: 'Cost limits updated successfully',
      organization_id: orgId,
      updated_limits: validatedLimits,
    });

  } catch (error) {
    logger.error('Failed to update cost limits', error instanceof Error ? error : new Error(String(error)), {
      org_id: req.user?.org_id,
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid limits format',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Failed to update cost limits',
      });
    }
  }
});

/**
 * GET /ai/health
 * AI Router health check
 */
router.get('/health', (req, res) => {
  try {
    const systemStats = aiRouter.getSystemStats();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      providers: systemStats.providers,
      active_requests: systemStats.activeRequests,
      uptime_seconds: process.uptime(),
    };

    res.json(healthStatus);
  } catch (error) {
    logger.error('AI health check failed', error instanceof Error ? error : new Error(String(error)), {
    });

    res.status(503).json({
      status: 'degraded',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;