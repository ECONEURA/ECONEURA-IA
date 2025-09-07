import { Router } from 'express';
import { z } from 'zod';
import { azureIntegration } from '../services/azure-integration.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limiter.js';

// ============================================================================
// AZURE INTEGRATION ROUTES - PR-17
// ============================================================================

const router = Router();

// Aplicar middleware de autenticación y rate limiting
router.use(authenticateToken);
router.use(rateLimiter);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(4000)
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
  maxTokens: z.number().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).max(4).optional()
});

const ImageRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
  n: z.number().min(1).max(4).optional()
});

const TTSRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().optional(),
  language: z.string().optional(),
  outputFormat: z.enum(['mp3', 'wav', 'ogg']).optional(),
  rate: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(0.5).max(2.0).optional()
});

// ============================================================================
// CHAT COMPLETION ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/azure-integration/chat/completions
 * @desc Generate chat completion using Azure OpenAI
 * @access Private
 */
router.post('/chat/completions', async (req, res) => {
  try {
    const validatedData = ChatRequestSchema.parse(req.body);
    
    structuredLogger.info('Chat completion request received', {
      userId: req.user?.id,
      messageCount: validatedData.messages.length,
      maxTokens: validatedData.maxTokens
    });

    const response = await azureIntegration.generateChatCompletion(validatedData);

    res.json({
      success: true,
      data: response,
      metadata: {
        service: 'azure-openai',
        mode: azureIntegration.isConfigured() ? 'production' : 'demo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Chat completion failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// IMAGE GENERATION ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/azure-integration/images/generations
 * @desc Generate images using Azure OpenAI DALL-E
 * @access Private
 */
router.post('/images/generations', async (req, res) => {
  try {
    const validatedData = ImageRequestSchema.parse(req.body);
    
    structuredLogger.info('Image generation request received', {
      userId: req.user?.id,
      prompt: validatedData.prompt.substring(0, 100) + '...',
      size: validatedData.size
    });

    const response = await azureIntegration.generateImage(validatedData);

    res.json({
      success: true,
      data: response,
      metadata: {
        service: 'azure-openai-dalle',
        mode: azureIntegration.isConfigured() ? 'production' : 'demo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Image generation failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// TEXT TO SPEECH ENDPOINTS
// ============================================================================

/**
 * @route POST /v1/azure-integration/speech/synthesis
 * @desc Generate speech from text using Azure Speech Services
 * @access Private
 */
router.post('/speech/synthesis', async (req, res) => {
  try {
    const validatedData = TTSRequestSchema.parse(req.body);
    
    structuredLogger.info('Speech synthesis request received', {
      userId: req.user?.id,
      textLength: validatedData.text.length,
      voice: validatedData.voice
    });

    const response = await azureIntegration.generateSpeech(validatedData);

    // Configurar headers para audio
    res.setHeader('Content-Type', response.contentType);
    res.setHeader('Content-Length', response.audioData.byteLength);
    res.setHeader('X-Audio-Duration', response.duration.toString());

    res.send(Buffer.from(response.audioData));

  } catch (error) {
    structuredLogger.error('Speech synthesis failed', error as Error, {
      userId: req.user?.id
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH AND STATUS ENDPOINTS
// ============================================================================

/**
 * @route GET /v1/azure-integration/health
 * @desc Check health status of Azure services
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await azureIntegration.checkServiceHealth();
    
    const services = Array.from(healthStatus.values());
    const overallStatus = services.every(s => s.status === 'healthy') 
      ? 'healthy' 
      : services.some(s => s.status === 'unhealthy') 
        ? 'unhealthy' 
        : 'degraded';

    res.json({
      success: true,
      data: {
        overall: overallStatus,
        services: Object.fromEntries(healthStatus),
        configuration: azureIntegration.getConfiguration(),
        availableServices: azureIntegration.getAvailableServices(),
        isConfigured: azureIntegration.isConfigured(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Health check failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/azure-integration/status
 * @desc Get service status and configuration
 * @access Private
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        service: 'Azure OpenAI Integration',
        version: '1.0.0',
        configuration: azureIntegration.getConfiguration(),
        availableServices: azureIntegration.getAvailableServices(),
        isConfigured: azureIntegration.isConfigured(),
        mode: azureIntegration.isConfigured() ? 'production' : 'demo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Status check failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CONFIGURATION ENDPOINTS
// ============================================================================

/**
 * @route GET /v1/azure-integration/config
 * @desc Get current configuration (without sensitive data)
 * @access Private
 */
router.get('/config', async (req, res) => {
  try {
    const config = azureIntegration.getConfiguration();
    
    res.json({
      success: true,
      data: {
        ...config,
        // No exponer claves API
        apiKey: config.endpoint ? 'configured' : 'not configured'
      }
    });

  } catch (error) {
    structuredLogger.error('Config retrieval failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Config retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DEMO ENDPOINTS
// ============================================================================

/**
 * @route GET /v1/azure-integration/demo/chat
 * @desc Get demo chat response
 * @access Private
 */
router.get('/demo/chat', async (req, res) => {
  try {
    const { message } = req.query;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message parameter is required'
      });
    }

    const demoRequest = {
      messages: [{ role: 'user' as const, content: message }],
      maxTokens: 100
    };

    const response = await azureIntegration.generateChatCompletion(demoRequest);

    res.json({
      success: true,
      data: response,
      metadata: {
        service: 'azure-openai-demo',
        mode: 'demo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Demo chat failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Demo chat failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /v1/azure-integration/demo/image
 * @desc Get demo image URL
 * @access Private
 */
router.get('/demo/image', async (req, res) => {
  try {
    const { prompt } = req.query;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt parameter is required'
      });
    }

    const demoRequest = {
      prompt,
      size: '1024x1024' as const
    };

    const response = await azureIntegration.generateImage(demoRequest);

    res.json({
      success: true,
      data: response,
      metadata: {
        service: 'azure-openai-dalle-demo',
        mode: 'demo',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    structuredLogger.error('Demo image failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Demo image failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as azureIntegrationRoutes };