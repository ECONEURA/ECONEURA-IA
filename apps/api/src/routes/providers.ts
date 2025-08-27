import { Router } from 'express';
import { asyncHandler, ApiError } from '../mw/problemJson.js';
import { AuthenticatedRequest } from '../mw/auth.js';
import { logger } from '@econeura/shared/logging';

export const providerRoutes = Router();

interface ProviderHealth {
  provider: string;
  status: 'available' | 'unavailable' | 'degraded';
  latency_ms: number;
  last_check: Date;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

async function checkMistralEdge(): Promise<ProviderHealth> {
  const startTime = Date.now();
  const mistralUrl = process.env.MISTRAL_BASE_URL || 'https://mistral-edge.internal:11434';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${mistralUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    return {
      provider: 'mistral_edge',
      status: response.ok ? 'available' : 'degraded',
      latency_ms: latency,
      last_check: new Date(),
      metadata: {
        status_code: response.status,
        endpoint: `${mistralUrl}/health`,
      },
    };
    
  } catch (error) {
    return {
      provider: 'mistral_edge',
      status: 'unavailable',
      latency_ms: Date.now() - startTime,
      last_check: new Date(),
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkOpenAICloud(): Promise<ProviderHealth> {
  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      provider: 'openai_cloud',
      status: 'unavailable',
      latency_ms: 0,
      last_check: new Date(),
      error_message: 'API key not configured',
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Test with a simple models list request
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    return {
      provider: 'openai_cloud',
      status: response.ok ? 'available' : 'degraded',
      latency_ms: latency,
      last_check: new Date(),
      metadata: {
        status_code: response.status,
        endpoint: 'https://api.openai.com/v1/models',
      },
    };
    
  } catch (error) {
    return {
      provider: 'openai_cloud',
      status: 'unavailable',
      latency_ms: Date.now() - startTime,
      last_check: new Date(),
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkMicrosoftGraph(): Promise<ProviderHealth> {
  const startTime = Date.now();
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  
  if (!tenantId || !clientId || !clientSecret) {
    return {
      provider: 'microsoft_graph',
      status: 'unavailable',
      latency_ms: 0,
      last_check: new Date(),
      error_message: 'Graph credentials not configured',
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Test token endpoint
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    return {
      provider: 'microsoft_graph',
      status: response.ok ? 'available' : 'degraded',
      latency_ms: latency,
      last_check: new Date(),
      metadata: {
        status_code: response.status,
        tenant_id: tenantId,
        endpoint: tokenUrl,
      },
    };
    
  } catch (error) {
    return {
      provider: 'microsoft_graph',
      status: 'unavailable',
      latency_ms: Date.now() - startTime,
      last_check: new Date(),
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkWhatsAppCloud(): Promise<ProviderHealth> {
  const startTime = Date.now();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    return {
      provider: 'whatsapp_cloud',
      status: 'unavailable',
      latency_ms: 0,
      last_check: new Date(),
      error_message: 'WhatsApp credentials not configured',
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Test by getting phone number info
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    return {
      provider: 'whatsapp_cloud',
      status: response.ok ? 'available' : 'degraded',
      latency_ms: latency,
      last_check: new Date(),
      metadata: {
        status_code: response.status,
        phone_number_id: phoneNumberId,
      },
    };
    
  } catch (error) {
    return {
      provider: 'whatsapp_cloud',
      status: 'unavailable',
      latency_ms: Date.now() - startTime,
      last_check: new Date(),
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// GET /api/providers/status - Get status of all providers
providerRoutes.get('/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const corrId = res.locals.corr_id;
  
  logger.info('Checking provider status', {
    corr_id: corrId,
    org_id: orgId,
  });
  
  try {
    // Check all providers in parallel
    const [mistralEdge, openaiCloud, microsoftGraph, whatsappCloud] = await Promise.allSettled([
      checkMistralEdge(),
      checkOpenAICloud(),
      checkMicrosoftGraph(),
      checkWhatsAppCloud(),
    ]);
    
    const providers: ProviderHealth[] = [
      mistralEdge.status === 'fulfilled' ? mistralEdge.value : {
        provider: 'mistral_edge',
        status: 'unavailable' as const,
        latency_ms: 0,
        last_check: new Date(),
        error_message: 'Health check failed',
      },
      openaiCloud.status === 'fulfilled' ? openaiCloud.value : {
        provider: 'openai_cloud',
        status: 'unavailable' as const,
        latency_ms: 0,
        last_check: new Date(),
        error_message: 'Health check failed',
      },
      microsoftGraph.status === 'fulfilled' ? microsoftGraph.value : {
        provider: 'microsoft_graph',
        status: 'unavailable' as const,
        latency_ms: 0,
        last_check: new Date(),
        error_message: 'Health check failed',
      },
      whatsappCloud.status === 'fulfilled' ? whatsappCloud.value : {
        provider: 'whatsapp_cloud',
        status: 'unavailable' as const,
        latency_ms: 0,
        last_check: new Date(),
        error_message: 'Health check failed',
      },
    ];
    
    // Determine overall status
    const availableCount = providers.filter(p => p.status === 'available').length;
    const totalCount = providers.length;
    
    let overallStatus: 'ok' | 'degraded' | 'error';
    if (availableCount === totalCount) {
      overallStatus = 'ok';
    } else if (availableCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'error';
    }
    
    logger.info('Provider status check completed', {
      corr_id: corrId,
      org_id: orgId,
      overall_status: overallStatus,
      available_providers: availableCount,
      total_providers: totalCount,
    });
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      providers,
      summary: {
        available: availableCount,
        total: totalCount,
        availability_percentage: Math.round((availableCount / totalCount) * 100),
      },
    });
    
  } catch (error) {
    logger.error('Provider status check failed', error as Error, {
      corr_id: corrId,
      org_id: orgId,
    });
    
    throw ApiError.internalServerError('Failed to check provider status');
  }
}));

// GET /api/providers/:provider/status - Get status of specific provider
providerRoutes.get('/:provider/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { provider } = req.params;
  const orgId = req.org!.org_id;
  const corrId = res.locals.corr_id;
  
  let providerHealth: ProviderHealth;
  
  switch (provider) {
    case 'mistral_edge':
    case 'mistral-edge':
      providerHealth = await checkMistralEdge();
      break;
      
    case 'openai_cloud':
    case 'openai-cloud':
      providerHealth = await checkOpenAICloud();
      break;
      
    case 'microsoft_graph':
    case 'graph':
      providerHealth = await checkMicrosoftGraph();
      break;
      
    case 'whatsapp_cloud':
    case 'whatsapp':
      providerHealth = await checkWhatsAppCloud();
      break;
      
    default:
      throw ApiError.notFound(`Provider '${provider}'`);
  }
  
  logger.info('Individual provider status checked', {
    corr_id: corrId,
    org_id: orgId,
    provider: providerHealth.provider,
    status: providerHealth.status,
    latency_ms: providerHealth.latency_ms,
  });
  
  res.json(providerHealth);
}));