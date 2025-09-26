import { logger } from '../logging/index.js';/;
import { prometheus } from '../metrics/index.js';/;
import { redactPII } from '../security/index.ts.js';/;
import { CostGuardrails } from './cost-guardrails.js';/;
import { LLMProviderManager } from './providers.js';
export class EnhancedAIRouter {;
  costGuardrails;
  providerManager;
  config;
  activeRequests = new Map();
  constructor(config = {}) {
    this.config = {
      costGuardrailsEnabled: true,
      telemetryEnabled: true,
      defaultMaxCostEUR: 1.0,
      emergencyStopEnabled: true,
      healthCheckInterval: 30000,
      ...config,
    };
    this.costGuardrails = new CostGuardrails();
    this.providerManager = new LLMProviderManager();/
    // Set up alert handlers
    if (this.config.costGuardrailsEnabled) {
      this.costGuardrails.onAlert((alert) => this.handleCostAlert(alert));
    }/
    // Set up default cost limits for organizations
    this.setupDefaultCostLimits();
    logger.info('Enhanced AI Router initialized', {
      cost_guardrails_enabled: this.config.costGuardrailsEnabled,
      telemetry: this.config.telemetryEnabled,
      emergency_stop: this.config.emergencyStopEnabled,
    });
  }/
  /**
   * Routes AI request with enhanced decision making/
   */
  async routeRequest(request) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    logger.info('Enhanced AI routing started', {
      x_x_request_id: requestId,
      org_id: request.org_id,
      tokens_est: request.tokens_est,
      priority: request.priority || 'medium',
    });
    try {/
      // Step 1: Find suitable providers
      const suitableProviders = this.findSuitableProviders(request);
      if (suitableProviders.length === 0) {
        throw new Error('No suitable providers found for request requirements');
      }/
      // Step 2: Cost validation
      let selectedProvider = null;
      let estimatedCost = 0;
      let rateLimitOk = false;
      for (const provider of suitableProviders) {
        const model = this.selectBestModel(provider, request);
        if (!model) continue;/
        // Estimate cost
        estimatedCost = this.providerManager.estimateCost(
          provider.id,
          model.id,
          request.tokens_est || 1000,/
          Math.floor((request.tokens_est || 1000) * 0.3), // Assume 30% output ratio
          {
            images: request.content?.includes('image') ? 1 : 0,
            functionCalls: request.tools_needed.includes('function_calling') ? 1 : 0,
          },
        );/
        // Check cost guardrails
        if (this.config.costGuardrailsEnabled) {
          const costValidation = await this.costGuardrails.validateRequest(;
            request.org_id,
            estimatedCost,
            provider.id,
            model.id,
          );
          if (!costValidation.allowed) {
            logger.warn('Request blocked by cost guardrails', {
              x_request_id: requestId,
              org_id: request.org_id,
              provider_id: provider.id,
              estimated_cost: estimatedCost,
              reason: costValidation.reason,
            });
            continue;
          }
        }/
        // Check rate limits
        const rateLimitCheck = this.providerManager.checkRateLimit(;
          provider.id,
          request.tokens_est || 1000,
        );
        if (!rateLimitCheck.allowed) {
          logger.warn('Request blocked by rate limits', {
            x_request_id: requestId,
            org_id: request.org_id,
            provider_id: provider.id,
            reason: rateLimitCheck.reason,
          });
          continue;
        }/
        // Provider selected!
        selectedProvider = provider;
        rateLimitOk = rateLimitCheck.allowed;
        break;
      }
      if (!selectedProvider) {
        throw new Error('All providers rejected the request due to cost or rate limits');
      }/
      // Step 3: Build routing decision
      const model = this.selectBestModel(selectedProvider, request);
      const decision = this.buildRoutingDecision(;
        selectedProvider,
        model,
        request,
        estimatedCost,
        rateLimitOk,
        suitableProviders.filter((p) => p.id !== selectedProvider.id).map((p) => p.id),
      );/
      // Step 4: Track active request
      this.activeRequests.set(requestId, {
        providerId: selectedProvider.id,
        startTime,
      });/
      // Step 5: Update metrics
      prometheus.aiRoutingDecisions
        .labels({
          org_id: request.org_id,
          provider: selectedProvider.id,
          model: model.id,
          routing_reason: decision.routingReason,
        })
        .inc();
      logger.info('AI routing decision completed', {
        x_request_id: requestId,
        org_id: request.org_id,
        selected_provider: selectedProvider.id,
        selected_model: model.id,
        estimated_cost: estimatedCost,
        routing_reason: decision.routingReason,
        decision_time_ms: Date.now() - startTime,
      });
      return decision;
    } catch (error) {
      logger.error('AI routing failed', error instanceof Error ? error : new Error(String(error)), {
        x_request_id: requestId,
        org_id: request.org_id,
        decision_time_ms: Date.now() - startTime,
      });
      prometheus.aiRoutingErrors
        .labels({
          org_id: request.org_id,
          error_type: 'routing_failure',
        })
        .inc();
      throw error;
    }
  }/
  /**
   * Records request completion and updates metrics/
   */
  async recordRequestCompletion(
    requestId,
    success,
    actualCost,
    tokensInput,
    tokensOutput,
    errorType,
  ) {
    const activeRequest = this.activeRequests.get(requestId);
    if (!activeRequest) {
      logger.warn('Request completion recorded for unknown request', { x_request_id: requestId });
      return;
    }
    const latency = Date.now() - activeRequest.startTime;
    const provider = this.providerManager.getProvider(activeRequest.providerId);
    if (!provider) {
      logger.error('Provider not found for completed request', undefined, {
        x_request_id: requestId,
        provider_id: activeRequest.providerId,
      });
      return;
    }/
    // Record usage in cost guardrails
    if (this.config.costGuardrailsEnabled) {
      const usage = {/;
        orgId: requestId.split('-')[0], // Extract org ID from request ID
        provider: provider.id,/
        model: 'unknown', // TODO: Extract from request context
        tokensInput,
        tokensOutput,
        costEUR: actualCost,
        latencyMs: latency,
        timestamp: new Date(),
        success,
        errorType,
      };
      this.costGuardrails.recordUsage(usage);
    }/
    // Update Prometheus metrics
    prometheus.aiRequestDuration
      .labels({
        provider: provider.id,
        status: success ? 'success' : 'error',
      })/
      .observe(latency / 1000);
    if (!success && errorType) {
      prometheus.aiErrorsTotal
        .labels({
          org_id: requestId.split('-')[0],
          provider: provider.id,
          error_type: errorType,
        })
        .inc();
    }/
    // Clean up active request tracking
    this.activeRequests.delete(requestId);
    logger.info('Request completion recorded', {
      x_request_id: requestId,
      provider_id: provider.id,
      success,
      actual_cost: actualCost,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      latency_ms: latency,
    });
  }/
  /**
   * Processes request content with redaction if needed/
   */
  async processRequestContent(content, decision, request) {
    if (decision.shouldRedact) {
      const { redacted, tokens } = redactPII(content);
      logger.info('PII redacted for cloud processing', {
        org_id: request.org_id,
        provider: decision.provider.id,
        redaction_tokens: Object.keys(tokens).length,
      });
      return { processedContent: redacted, redactionTokens: tokens };
    }
    return { processedContent: content };
  }/
  /**
   * Gets current usage and cost information for an organization/
   */
  getOrganizationUsage(orgId) {
    const usage = this.costGuardrails.getUsage(orgId);
    const recentHistory = this.costGuardrails.getUsageHistory(orgId, 50);
    const providerHealth = this.providerManager.getAllProviderHealth();
    return {
      costs: {
        daily: usage.daily,
        monthly: usage.monthly,
        limits: usage.limits,
        utilization: {
          daily: usage.utilizationDaily,
          monthly: usage.utilizationMonthly,
        },
      },
      recentRequests: recentHistory,
      providerStatus: providerHealth,
      activeRequests: Array.from(this.activeRequests.entries()).length,
    };
  }/
  /**
   * Gets system-wide statistics/
   */
  getSystemStats() {
    const aggregateStats = this.costGuardrails.getAggregateStats();
    const allProviders = this.providerManager.getAllProviders();
    const healthyProviders = this.providerManager;
      .getAllProviderHealth()
      .filter((h) => h.status === 'healthy').length;
    return {
      ...aggregateStats,
      providers: {
        total: allProviders.length,
        healthy: healthyProviders,
        degraded: this.providerManager.getAllProviderHealth().filter((h) => h.status === 'degraded')
          .length,
        down: this.providerManager.getAllProviderHealth().filter((h) => h.status === 'down').length,
      },
      activeRequests: this.activeRequests.size,
    };
  }/
  /**
   * Updates cost limits for an organization/
   */
  updateOrganizationLimits(orgId, limits) {
    const currentLimits = this.costGuardrails.getCostLimits(orgId);
    const newLimits = { ...currentLimits, ...limits };
    this.costGuardrails.setCostLimits(orgId, newLimits);
  }/
  // Private methods
  findSuitableProviders(request) {
    const requirements = {;
      capabilities: request.requiresCapabilities || [],
      languages: request.languages || ['en'],
      maxCost: request.maxCostEUR || this.config.defaultMaxCostEUR,/
      preferEdge: request.preferEdge !== false, // Default to preferring edge
    };/
    // Add implicit capabilities based on request
    if (request.tools_needed.includes('function_calling')) {
      requirements.capabilities.push('function_calling');
    }
    if (request.tools_needed.includes('vision')) {
      requirements.capabilities.push('vision');
    }
    if (request.tools_needed.includes('code_interpreter')) {
      requirements.capabilities.push('code_interpreter');
    }
    const providers = [];/;
    // Try to get best provider
    const bestProvider = this.providerManager.getBestProvider(requirements);
    if (bestProvider) {
      providers.push(bestProvider);
    }/
    // Add fallback providers
    const allSuitable = this.providerManager.getEnabledProviders().filter((provider) => {;
      if (provider.id === bestProvider?.id) return false;/
      // Basic capability check for fallbacks
      return requirements.capabilities.every((cap) =>
        provider.models.some((model) => model.capabilities.includes(cap)),
      );
    });
    providers.push(...allSuitable);
    return providers;
  }
  selectBestModel(provider, request) {
    let suitableModels = provider.models;/;
    // Filter by capabilities
    if (request.requiresCapabilities) {
      suitableModels = suitableModels.filter((model) =>
        request.requiresCapabilities.every((cap) => model.capabilities.includes(cap)),
      );
    }/
    // Filter by context window if needed
    const contextRequired = request.tokens_est || 1000;
    suitableModels = suitableModels.filter((model) => model.contextWindow >= contextRequired);
    if (suitableModels.length === 0) return null;/
    // Prefer requested model if specified and available
    if (request.model) {
      const requestedModel = suitableModels.find((m) => m.id === request.model);
      if (requestedModel) return requestedModel;
    }/
    // Sort by cost and capability
    return suitableModels.sort((a, b) => {/
      // Prefer models with more capabilities
      const capabilityDiff = b.capabilities.length - a.capabilities.length;
      if (capabilityDiff !== 0) return capabilityDiff;/
      // Then by cost (lower is better)
      return a.inputCostPer1KTokens - b.inputCostPer1KTokens;
    })[0];
  }
  buildRoutingDecision(provider, model, request, estimatedCost, rateLimitOk, fallbackProviders) {
    const shouldRedact =;
      provider.type === 'cloud' &&
      (request.sensitivity === 'pii' || request.sensitivity === 'confidential');
    let endpoint = provider.config.baseUrl;
    let headers = { ...provider.config.headers };/;
    // Build provider-specific endpoint
    switch (provider.id) {
      case 'openai-gpt4':
      case 'azure-openai':/
        endpoint += '/chat/completions';
        if (provider.config.apiKey) {
          headers['Authorization'] = `Bearer ${provider.config.apiKey}`;
        }
        break;
      case 'anthropic-claude':/
        endpoint += '/messages';
        if (provider.config.apiKey) {
          headers['x-api-key'] = provider.config.apiKey;
        }
        break;
      case 'google-gemini':/
        endpoint += `/models/${model.id}:generateContent`;
        if (provider.config.apiKey) {
          endpoint += `?key=${provider.config.apiKey}`;
        }
        break;
      case 'mistral-edge':/
        endpoint += '/v1/chat/completions';
        break;
    }/
    // Determine routing reason
    let routingReason = 'best_match';
    if (request.preferEdge && provider.type === 'edge') {
      routingReason = 'edge_preferred';
    } else if (shouldRedact) {
      routingReason = 'pii_cloud_routing';
    } else if (request.requiresCapabilities?.length) {
      routingReason = 'capability_requirement';
    }
    return {
      provider,
      model: model.id,
      endpoint,
      headers,
      shouldRedact,
      maxRetries: provider.config.retryAttempts,
      timeoutMs: provider.config.timeout,
      estimatedCost,
      rateLimitOk,
      fallbackProviders,
      routingReason,
    };
  }
  handleCostAlert(alert) {
    logger.warn('Cost alert received', {
      alert_type: alert.type,
      org_id: alert.orgId,
      current_cost: alert.currentCost,
      limit: alert.limit,
      period: alert.period,
      message: alert.message,
    });/
    // Send webhook notifications if configured
    if (this.config.alertWebhooks) {
      this.config.alertWebhooks.forEach((webhookUrl) => {
        this.sendWebhookAlert(webhookUrl, alert);
      });
    }/
    // Update metrics
    prometheus.aiCostAlerts
      .labels({
        org_id: alert.orgId,
        type: alert.type,
        period: alert.period,
      })
      .inc();
  }
  async sendWebhookAlert(webhookUrl, alert) {
    try {
      const response = await fetch(webhookUrl, {;
        method: 'POST',/
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_type: alert.type,
          organization_id: alert.orgId,
          current_cost_eur: alert.currentCost,
          limit_eur: alert.limit,
          period: alert.period,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error) {
      logger.error(
        'Failed to send webhook alert',
        error instanceof Error ? error : new Error(String(error)),
        {
          webhook_url: webhookUrl,
          alert_type: alert.type,
          org_id: alert.orgId,
        },
      );
    }
  }
  setupDefaultCostLimits() {/
    // Set up default limits for demo organization
    this.costGuardrails.setCostLimits('org-001', {
      dailyLimitEUR: 25.0,
      monthlyLimitEUR: 500.0,
      perRequestLimitEUR: 2.0,
      warningThresholds: {
        daily: 75,
        monthly: 80,
      },
      emergencyStop: {
        enabled: true,
        thresholdEUR: 750.0,
      },
    });
  }
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
}
/