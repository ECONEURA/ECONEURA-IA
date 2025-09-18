import { z } from 'zod'
import { logger } from '../logging'
import { prometheus } from '../metrics'
import { redactPII } from '../security'
import { CostGuardrails, type UsageMetrics } from './cost-guardrails'
import { LLMProviderManager, type LLMProvider, type LLMModel } from './providers'
import { costMeter, type CostUsage } from '../cost-meter'
// import { createTracer } from '../otel'
import { env } from '../env'
import { tracer, meter } from '../otel'

// Request schemas
const AIRequestSchema = z.object({
  orgId: z.string(),
  prompt: z.string().min(1),
  model: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxCostEUR: z.number().positive().optional(),
  providerHint: z.enum(['mistral', 'azure-openai']).optional(),
  language: z.string().optional(),
  sensitivity: z.enum(['low', 'medium', 'high']).optional(),
})

const AIResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  provider: z.string(),
  tokens: z.object({
    input: z.number(),
    output: z.number(),
  }),
  costEUR: z.number(),
  latencyMs: z.number(),
  fallbackUsed: z.boolean(),
  requestId: z.string(),
})

export type AIRequest = z.infer<typeof AIRequestSchema>
export type AIResponse = z.infer<typeof AIResponseSchema>

export interface RouterDecision {
  provider: string
  model: string
  maxRetries: number
  timeoutMs: number
  fallbackProvider?: string
}

export class EnhancedAIRouter {
  private costGuardrails: CostGuardrails
  private providerManager: LLMProviderManager
  private config: {
    costGuardrailsEnabled: boolean
    telemetryEnabled: boolean
    defaultMaxCostEUR: number
    emergencyStopEnabled: boolean
    healthCheckInterval: number
  }
  private activeRequests = new Map<string, {
    orgId: string
    providerId: string
    model: string
    startTime: number
  }>()
  private tracer = tracer
  private meter = meter

  constructor(config = {}) {
    this.config = {
      costGuardrailsEnabled: true,
      telemetryEnabled: true,
      defaultMaxCostEUR: 1.0,
      emergencyStopEnabled: true,
      healthCheckInterval: 30000,
      ...config,
    }

    this.costGuardrails = new CostGuardrails()
    this.providerManager = new LLMProviderManager()

    // Set up alert handlers
    if (this.config.costGuardrailsEnabled) {
      this.costGuardrails.onAlert((alert) => this.handleCostAlert(alert))
    }

    // Set up default cost limits for organizations
    this.setupDefaultCostLimits()

    logger.info('Enhanced AI Router initialized', {
      cost_guardrails_enabled: this.config.costGuardrailsEnabled,
      telemetry: this.config.telemetryEnabled,
      emergency_stop: this.config.emergencyStopEnabled,
    })
  }

  /**
   * Main routing method with cost cap and fallback logic
   */
  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const span = this.tracer.startSpan('ai_route_request')
    const requestId = this.generateRequestId(request.orgId)
    const startTime = Date.now()

    try {
      // Validate request
      const validatedRequest = AIRequestSchema.parse(request)

      // Check monthly cost cap first
      const capCheck = await costMeter.checkMonthlyCap(request.orgId)
      if (!capCheck.withinLimit) {
        throw new Error(`AI cost cap exceeded: ${capCheck.currentUsage}€/${capCheck.limit}€`)
      }

      // Make routing decision
      const decision = await this.makeRoutingDecision(validatedRequest)

      // Track active request
      this.activeRequests.set(requestId, {
        orgId: request.orgId,
        providerId: decision.provider,
        model: decision.model,
        startTime,
      })

      // Execute request with fallback
      const result = await this.executeWithFallback(validatedRequest, decision, requestId)

      // Record completion
      await this.recordRequestCompletion(
        requestId,
        true,
        result.costEUR,
        result.tokens.input,
        result.tokens.output
      )

  span.setAttribute('ai.request_id', requestId)
  span.setAttribute('ai.provider', result.provider)
  span.setAttribute('ai.model', result.model)
  span.setAttribute('ai.cost_eur', result.costEUR)
  span.setAttribute('ai.fallback_used', result.fallbackUsed)

      return result

    } catch (error) {
      const errorType = this.classifyError(error)

      await this.recordRequestCompletion(
        requestId,
        false,
        0,
        0,
        0,
        errorType
      )

  span.recordException(error as Error)
  span.setAttribute('ai.error_type', errorType)
  span.setAttribute('ai.request_id', requestId)

      throw error
    } finally {
      span.end()
    }
  }

  /**
   * Makes routing decision based on cost, availability, and preferences
   */
  private async makeRoutingDecision(request: AIRequest): Promise<RouterDecision> {
    const span = this.tracer.startSpan('ai_make_routing_decision')

    try {
  // Get available providers
  const providers = await this.providerManager.getAllProviders()

  // Prefer Mistral for cost efficiency
  const mistralProvider = providers.find((p: LLMProvider) => p.id === 'mistral')
  const azureProvider = providers.find((p: LLMProvider) => p.id === 'azure-openai')

      if (!mistralProvider && !azureProvider) {
        throw new Error('No AI providers available')
      }

  // Check provider health using the provider manager's health map
  const mistralHealth = mistralProvider ? this.providerManager.getProviderHealth(mistralProvider.id) : undefined
  const azureHealth = azureProvider ? this.providerManager.getProviderHealth(azureProvider.id) : undefined
  const mistralHealthy = mistralHealth?.status === 'healthy'
  const azureHealthy = azureHealth?.status === 'healthy'

      // Determine primary and fallback providers
      let primaryProvider: string
      let fallbackProvider: string | undefined
      let model: string

      if (request.providerHint === 'azure-openai' && azureHealthy) {
        primaryProvider = 'azure-openai'
        fallbackProvider = mistralHealthy ? 'mistral' : undefined
        model = request.model || 'gpt-4o-mini'
      } else if (mistralHealthy) {
        primaryProvider = 'mistral'
        fallbackProvider = azureHealthy ? 'azure-openai' : undefined
        model = request.model || 'mistral-instruct'
      } else if (azureHealthy) {
        primaryProvider = 'azure-openai'
        model = request.model || 'gpt-4o-mini'
      } else {
        throw new Error('No healthy AI providers available')
      }

      // Estimate cost for primary provider
      const estimatedTokens = this.estimateTokens(request.prompt, request.maxTokens)
      const estimatedCost = costMeter.calculateCost(
        model,
        estimatedTokens,
        estimatedTokens * 0.5 // Assume 50% output ratio
      )

      // Check if cost exceeds limit
      const maxCost = request.maxCostEUR || this.config.defaultMaxCostEUR
      if (estimatedCost > maxCost) {
        throw new Error(`Estimated cost ${estimatedCost}€ exceeds limit ${maxCost}€`)
      }

      // Some OTEL mocks expose setAttribute (singular) instead of setAttributes.
      const _attrs = {
        'ai.primary_provider': primaryProvider,
        'ai.fallback_provider': fallbackProvider,
        'ai.model': model,
        'ai.estimated_cost': estimatedCost,
      }
      const s1 = span as unknown as { setAttributes?: (a: Record<string, unknown>) => void }
      const s2 = span as unknown as { setAttribute?: (k: string, v: unknown) => void }
      if (typeof s1?.setAttributes === 'function') {
        s1.setAttributes(_attrs)
      } else if (typeof s2?.setAttribute === 'function') {
        Object.entries(_attrs).forEach(([k, v]) => s2.setAttribute!(k, v))
      }

      return {
        provider: primaryProvider,
        model,
        maxRetries: 2,
        timeoutMs: 30000,
        fallbackProvider,
      }

    } finally {
      span.end()
    }
  }

  /**
   * Executes request with automatic fallback
   */
  private async executeWithFallback(
    request: AIRequest,
    decision: RouterDecision,
    requestId: string
  ): Promise<AIResponse> {
    const span = this.tracer.startSpan('ai_execute_with_fallback')

    try {
      // Try primary provider
      try {
        return await this.executeRequest(request, decision.provider, decision.model, requestId, false)
      } catch (error) {
        logger.warn('Primary provider failed, attempting fallback', {
          primary_provider: decision.provider,
          fallback_provider: decision.fallbackProvider,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Try fallback if available
        if (decision.fallbackProvider) {
          try {
            return await this.executeRequest(request, decision.fallbackProvider, decision.model, requestId, true)
          } catch (fallbackError) {
            throw new Error(`Both primary and fallback providers failed: ${error instanceof Error ? error.message : 'Unknown'}, ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`)
          }
        } else {
          throw error
        }
      }
    } finally {
      span.end()
    }
  }

  /**
   * Executes a single request against a specific provider
   */
  private async executeRequest(
    request: AIRequest,
    providerId: string,
    model: string,
    requestId: string,
    isFallback: boolean
  ): Promise<AIResponse> {
    const span = this.tracer.startSpan('ai_execute_request')
    const startTime = Date.now()

    try {
      const provider = this.providerManager.getProvider(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }

      // Prepare request for provider
      const providerRequest = {
        prompt: request.prompt,
        model,
        maxTokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      }

      // Execute request
      if (typeof provider.execute !== 'function') {
        throw new Error(`Provider ${provider.id} does not implement execute()`)
      }
      const response = await provider.execute(providerRequest)

      // Calculate actual cost
      const costUsage = costMeter.recordUsage(
        request.orgId,
        model,
        response.tokens.input,
        response.tokens.output
      )

      const latency = Date.now() - startTime

      const _execAttrs = {
        'ai.provider': providerId,
        'ai.model': model,
        'ai.cost_eur': costUsage.costEur,
        'ai.latency_ms': latency,
        'ai.fallback_used': isFallback,
      }
      const e1 = span as unknown as { setAttributes?: (a: Record<string, unknown>) => void }
      const e2 = span as unknown as { setAttribute?: (k: string, v: unknown) => void }
      if (typeof e1?.setAttributes === 'function') {
        e1.setAttributes(_execAttrs)
      } else if (typeof e2?.setAttribute === 'function') {
        Object.entries(_execAttrs).forEach(([k, v]) => e2.setAttribute!(k, v))
      }

      return {
        content: response.content,
        model,
        provider: providerId,
        tokens: {
          input: response.tokens.input,
          output: response.tokens.output,
        },
        costEUR: costUsage.costEur,
        latencyMs: latency,
        fallbackUsed: isFallback,
        requestId,
      }

    } finally {
      span.end()
    }
  }

  /**
   * Records request completion and updates metrics
   */
  private async recordRequestCompletion(
    requestId: string,
    success: boolean,
    actualCost: number,
    tokensInput: number,
    tokensOutput: number,
    errorType?: string
  ): Promise<void> {
    const activeRequest = this.activeRequests.get(requestId)
    if (!activeRequest) {
      logger.warn('Request completion recorded for unknown request', { x_request_id: requestId })
      return
    }

    const latency = Date.now() - activeRequest.startTime
    const provider = this.providerManager.getProvider(activeRequest.providerId)

    if (!provider) {
      logger.error('Provider not found for completed request', undefined, {
        x_request_id: requestId,
        provider_id: activeRequest.providerId,
      })
      return
    }

    // Record usage in cost guardrails
    if (this.config.costGuardrailsEnabled) {
      const usage: UsageMetrics = {
        orgId: activeRequest.orgId,
        provider: activeRequest.providerId,
        model: activeRequest.model,
        tokensInput,
        tokensOutput,
        costEUR: actualCost,
        latencyMs: latency,
        timestamp: new Date(),
        success,
        errorType,
      }

      this.costGuardrails.recordUsage(usage)
    }

    // Update Prometheus metrics
    prometheus.aiRequestDuration.labels({
      provider: provider.id,
      status: success ? 'success' : 'error',
    }).observe(latency / 1000)

    if (!success && errorType) {
      prometheus.aiErrorsTotal.labels({
        org_id: requestId.split('-')[0],
        provider: provider.id,
        error_type: errorType,
      }).inc()
    }

    // Clean up active request tracking
    this.activeRequests.delete(requestId)

    logger.info('Request completion recorded', {
      x_request_id: requestId,
      provider_id: provider.id,
      success,
      actual_cost: actualCost,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      latency_ms: latency,
    })
  }

  /**
   * Handles cost alerts
   */
  private handleCostAlert(alert: any): void {
    logger.warn('Cost alert triggered', {
      org_id: alert.orgId,
      alert_type: alert.type,
      current_cost: alert.currentCost,
      limit: alert.limit,
    })

    // Implement alert handling (email, Slack, etc.)
      if (this.config.emergencyStopEnabled && alert.type === 'emergency_stop') {
      // Log minimal information to avoid typing issues with Error object shapes
      logger.error(`Emergency stop triggered for organization ${alert.orgId}`)
    }
  }

  /**
   * Sets up default cost limits for organizations
   */
  private setupDefaultCostLimits(): void {
    // Set default limits (50€ monthly cap as per requirements)
    this.costGuardrails.setCostLimits('default', {
      dailyLimitEUR: 5.0,
      monthlyLimitEUR: 50.0,
      perRequestLimitEUR: 5.0,
      warningThresholds: { daily: 80, monthly: 85 },
      emergencyStop: { enabled: true, thresholdEUR: 150.0 },
    })
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(orgId: string): string {
    return `${orgId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Estimates token count for a prompt
   */
  private estimateTokens(prompt: string, maxTokens?: number): number {
    // Simple estimation: ~4 characters per token
    const estimated = Math.ceil(prompt.length / 4)
    return maxTokens ? Math.min(estimated, maxTokens) : estimated
  }

  /**
   * Classifies errors for metrics
   */
  private classifyError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('cost cap exceeded')) return 'cost_cap_exceeded'
      if (error.message.includes('No AI providers available')) return 'no_providers'
      if (error.message.includes('timeout')) return 'timeout'
      if (error.message.includes('rate limit')) return 'rate_limit'
    }
    return 'unknown'
  }

  /**
   * Gets current provider health status
   */
  async getProviderHealth(): Promise<Record<string, any>> {
    // Use manager methods to obtain providers and their health status
    const providers = this.providerManager.getAllProviders()
    return providers.reduce((acc, provider) => {
      const health = this.providerManager.getProviderHealth(provider.id)
      acc[provider.id] = {
        health: health?.status ?? 'unknown',
        lastCheck: health?.lastCheck ?? null,
        models: provider.models,
      }
      return acc
    }, {} as Record<string, any>)
  }

  /**
   * Gets cost usage for an organization
   */
  async getCostUsage(orgId: string): Promise<{
    currentMonthly: number
    limit: number
    usagePercent: number
  }> {
    const capCheck = await costMeter.checkMonthlyCap(orgId)
    return {
      currentMonthly: capCheck.currentUsage,
      limit: capCheck.limit,
      usagePercent: (capCheck.currentUsage / capCheck.limit) * 100,
    }
  }
}

// Default configuration factory
export function createEnhancedAIRouter(config?: Partial<{
  costGuardrailsEnabled: boolean
  telemetryEnabled: boolean
  defaultMaxCostEUR: number
  emergencyStopEnabled: boolean
  healthCheckInterval: number
}>): EnhancedAIRouter {
  const defaultConfig = {
    costGuardrailsEnabled: env().NODE_ENV === 'production',
    telemetryEnabled: true,
    defaultMaxCostEUR: 1.0,
    emergencyStopEnabled: true,
    healthCheckInterval: 30000,
  }

  return new EnhancedAIRouter({ ...defaultConfig, ...config })
}