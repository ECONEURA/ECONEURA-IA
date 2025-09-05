import { Router } from 'express';
import { z } from 'zod';
import { aiRouter, AIRequestSchema, AIResponseSchema } from '@econeura/shared/src/ai/mistral-azure-router';
import { structuredLogger } from '../lib/structured-logger.js';
import { sseManager } from '../lib/sse-manager.js';
import { randomUUID } from 'crypto';

const router = Router();

// POST /v1/ai/chat - AI chat completions with routing
router.post('/chat', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const userId = req.headers['x-user-id'] as string;
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Validate request
    const aiRequest = AIRequestSchema.parse({
      ...req.body,
      orgId,
      userId,
      correlationId
    });

    const startTime = Date.now();

    // Check budget before processing
    const budgetStatus = await checkBudgetStatus(orgId);
    if (budgetStatus.utilizationPct >= 100) {
      res.status(429).json({
        error: 'Budget exceeded',
        message: 'Monthly AI budget limit reached. Account is in read-only mode.',
        budgetStatus,
        retryAfter: budgetStatus.resetDate
      });
      return;
    }

    // Send SSE event for request start
    sseManager.broadcastToOrg(orgId, {
      event: 'ai_request_started',
      data: {
        correlationId,
        model: aiRequest.model,
        timestamp: new Date().toISOString()
      }
    }, 'ai_request_started');

    // Route request through providers
    const aiResponse = await aiRouter.makeRequest(aiRequest);

    const totalLatency = Date.now() - startTime;

    // Add FinOps headers
    res.set({
      'X-Est-Cost-EUR': aiResponse.costEur.toFixed(4),
      'X-Budget-Pct': budgetStatus.utilizationPct.toFixed(1),
      'X-Latency-ms': totalLatency.toString(),
      'X-Route': aiResponse.provider,
      'X-Correlation-Id': correlationId
    });

    // Send SSE event for completion
    sseManager.broadcastToOrg(orgId, {
      event: 'ai_request_completed',
      data: {
        correlationId,
        provider: aiResponse.provider,
        costEur: aiResponse.costEur,
        latencyMs: totalLatency,
        tokens: aiResponse.usage.totalTokens,
        timestamp: new Date().toISOString()
      }
    }, 'ai_request_completed');

    structuredLogger.info('AI chat completion', {
      orgId,
      userId,
      correlationId,
      provider: aiResponse.provider,
      model: aiResponse.model,
      totalTokens: aiResponse.usage.totalTokens,
      costEur: aiResponse.costEur,
      latencyMs: totalLatency
    });

    res.json({
      success: true,
      data: aiResponse,
      metadata: {
        provider: aiResponse.provider,
        latencyMs: totalLatency,
        budgetUtilization: budgetStatus.utilizationPct
      }
    });

  } catch (error) {
    const latency = Date.now() - (Date.now() - 1000); // Approximate

    // Send SSE event for error
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
    
    sseManager.broadcastToOrg(orgId, {
      event: 'ai_request_failed',
      data: {
        correlationId,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    }, 'ai_request_failed');

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('AI chat completion failed', error as Error, {
      orgId,
      correlationId,
      body: req.body
    });

    res.status(500).json({
      error: 'AI request failed',
      message: (error as Error).message,
      correlationId
    });
  }
});

// GET /v1/ai/providers - Get provider health status
router.get('/providers', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    const providerHealth = await aiRouter.getProviderHealth();
    const routingStats = aiRouter.getRoutingStats();

    // Add FinOps headers
    const costEur = 0.001;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.1',
      'X-Latency-ms': '25',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    res.json({
      success: true,
      data: {
        providers: providerHealth,
        stats: routingStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to get provider status', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      error: 'Failed to get provider status',
      message: (error as Error).message
    });
  }
});

// POST /v1/ai/providers/:name/reset - Reset circuit breaker
router.post('/providers/:name/reset', async (req, res) => {
  try {
    const { name } = req.params;
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    
    aiRouter.resetCircuitBreaker(name);

    structuredLogger.info('Circuit breaker reset', {
      orgId,
      provider: name,
      userId: req.headers['x-user-id']
    });

    res.json({
      success: true,
      message: `Circuit breaker reset for provider: ${name}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Failed to reset circuit breaker', error as Error, {
      orgId: req.headers['x-org-id'],
      provider: req.params.name
    });

    res.status(500).json({
      error: 'Failed to reset circuit breaker',
      message: (error as Error).message
    });
  }
});

// Helper function to check budget status
async function checkBudgetStatus(orgId: string): Promise<any> {
  // Simulated budget check
  const currentSpend = 15.50 + Math.random() * 5; // Simulate current spend
  const monthlyLimit = 50.00;
  const utilizationPct = (currentSpend / monthlyLimit) * 100;

  // Calculate reset date (next month)
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  return {
    currentSpendEur: Math.round(currentSpend * 100) / 100,
    monthlyLimitEur: monthlyLimit,
    utilizationPct: Math.round(utilizationPct * 10) / 10,
    remainingEur: Math.round((monthlyLimit - currentSpend) * 100) / 100,
    resetDate,
    status: utilizationPct >= 90 ? 'critical' : utilizationPct >= 80 ? 'warning' : 'ok'
  };
}

export { router as aiRouter };