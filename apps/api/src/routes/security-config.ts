/**
 * Security Configuration Routes
 * PR-102: Security & CORS (api) - helmet y cors
 * 
 * Rutas para gestión de configuración de seguridad
 */

import { Router, Request, Response } from 'express';
import { securityConfigService } from '../services/security-config.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// =============================================================================
// CONFIGURACIÓN DE SEGURIDAD
// =============================================================================

// GET /v1/security-config
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = securityConfigService.getConfig();
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get security configuration', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get security configuration',
      message: (error as Error).message
    });
  }
});

// GET /v1/security-config/cors
router.get('/cors', async (req: Request, res: Response) => {
  try {
    const corsConfig = securityConfigService.getCorsConfig();
    
    res.json({
      success: true,
      data: corsConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get CORS configuration', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get CORS configuration',
      message: (error as Error).message
    });
  }
});

// PUT /v1/security-config/cors/origins
router.put('/cors/origins', async (req: Request, res: Response) => {
  try {
    const { origins } = req.body;
    
    if (!Array.isArray(origins)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid origins format',
        message: 'Origins must be an array of strings'
      });
    }

    securityConfigService.updateCorsOrigins(origins);
    
    res.json({
      success: true,
      message: 'CORS origins updated successfully',
      data: { origins },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update CORS origins', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update CORS origins',
      message: (error as Error).message
    });
  }
});

// POST /v1/security-config/cors/origins
router.post('/cors/origins', async (req: Request, res: Response) => {
  try {
    const { origin } = req.body;
    
    if (!origin || typeof origin !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid origin format',
        message: 'Origin must be a string'
      });
    }

    securityConfigService.addCorsOrigin(origin);
    
    res.json({
      success: true,
      message: 'CORS origin added successfully',
      data: { origin },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to add CORS origin', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to add CORS origin',
      message: (error as Error).message
    });
  }
});

// DELETE /v1/security-config/cors/origins/:origin
router.delete('/cors/origins/:origin', async (req: Request, res: Response) => {
  try {
    const { origin } = req.params;
    
    if (!origin) {
      return res.status(400).json({
        success: false,
        error: 'Origin parameter is required'
      });
    }

    securityConfigService.removeCorsOrigin(origin);
    
    res.json({
      success: true,
      message: 'CORS origin removed successfully',
      data: { origin },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to remove CORS origin', {
      error: (error as Error).message,
      origin: req.params.origin
    });

    res.status(500).json({
      success: false,
      error: 'Failed to remove CORS origin',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// CONFIGURACIÓN DE RATE LIMITING
// =============================================================================

// GET /v1/security-config/rate-limit
router.get('/rate-limit', async (req: Request, res: Response) => {
  try {
    const rateLimitConfig = securityConfigService.getRateLimitConfig();
    
    res.json({
      success: true,
      data: rateLimitConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get rate limit configuration', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get rate limit configuration',
      message: (error as Error).message
    });
  }
});

// PUT /v1/security-config/rate-limit
router.put('/rate-limit', async (req: Request, res: Response) => {
  try {
    const { maxRequests, windowMs } = req.body;
    
    if (typeof maxRequests !== 'number' || typeof windowMs !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid rate limit parameters',
        message: 'maxRequests and windowMs must be numbers'
      });
    }

    securityConfigService.updateRateLimit(maxRequests, windowMs);
    
    res.json({
      success: true,
      message: 'Rate limit configuration updated successfully',
      data: { maxRequests, windowMs },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update rate limit configuration', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update rate limit configuration',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// CONFIGURACIÓN DE VALIDACIÓN
// =============================================================================

// GET /v1/security-config/validation
router.get('/validation', async (req: Request, res: Response) => {
  try {
    const validationConfig = securityConfigService.getValidationConfig();
    
    res.json({
      success: true,
      data: validationConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get validation configuration', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get validation configuration',
      message: (error as Error).message
    });
  }
});

// PUT /v1/security-config/validation/max-request-size
router.put('/validation/max-request-size', async (req: Request, res: Response) => {
  try {
    const { size } = req.body;
    
    if (typeof size !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid size parameter',
        message: 'Size must be a number'
      });
    }

    securityConfigService.updateMaxRequestSize(size);
    
    res.json({
      success: true,
      message: 'Max request size updated successfully',
      data: { size },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update max request size', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update max request size',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// MÉTRICAS DE SEGURIDAD
// =============================================================================

// GET /v1/security-config/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = securityConfigService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get security metrics', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get security metrics',
      message: (error as Error).message
    });
  }
});

// POST /v1/security-config/metrics/reset
router.post('/metrics/reset', async (req: Request, res: Response) => {
  try {
    securityConfigService.resetMetrics();
    
    res.json({
      success: true,
      message: 'Security metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to reset security metrics', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reset security metrics',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// VALIDACIÓN DE CONFIGURACIÓN
// =============================================================================

// POST /v1/security-config/validate
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { origin, method, header, contentType, requestSize } = req.body;
    
    const validationResults = {
      origin: origin ? securityConfigService.isOriginAllowed(origin) : null,
      method: method ? securityConfigService.isMethodAllowed(method) : null,
      header: header ? securityConfigService.isHeaderAllowed(header) : null,
      contentType: contentType ? securityConfigService.isContentTypeAllowed(contentType) : null,
      requestSize: requestSize ? securityConfigService.isRequestSizeValid(requestSize) : null
    };
    
    res.json({
      success: true,
      data: validationResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to validate security configuration', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate security configuration',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// HEADERS DE SEGURIDAD
// =============================================================================

// GET /v1/security-config/headers
router.get('/headers', async (req: Request, res: Response) => {
  try {
    const securityHeaders = securityConfigService.getSecurityHeaders();
    const apiHeaders = securityConfigService.getApiHeaders();
    
    res.json({
      success: true,
      data: {
        security: securityHeaders,
        api: apiHeaders
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get security headers', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get security headers',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// CONFIGURACIÓN DE MIDDLEWARE
// =============================================================================

// GET /v1/security-config/middleware
router.get('/middleware', async (req: Request, res: Response) => {
  try {
    const middlewareConfig = securityConfigService.getMiddlewareConfig();
    
    res.json({
      success: true,
      data: middlewareConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get middleware configuration', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get middleware configuration',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// ESTADO DEL SERVICIO
// =============================================================================

// GET /v1/security-config/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isReady = securityConfigService.isReady();
    const config = securityConfigService.getConfig();
    const metrics = securityConfigService.getMetrics();
    
    res.json({
      success: true,
      data: {
        ready: isReady,
        initialized: isReady,
        config: {
          corsOrigins: config.cors.allowedOrigins.length,
          rateLimitEnabled: true,
          monitoringEnabled: config.monitoring.enableLogging
        },
        metrics: {
          totalRequests: metrics.totalRequests,
          blockedRequests: metrics.blockedRequests,
          suspiciousRequests: metrics.suspiciousRequests,
          corsRequests: metrics.corsRequests,
          rateLimitedRequests: metrics.rateLimitedRequests
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get security configuration status', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get security configuration status',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

// GET /v1/security-config/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      service: 'Security Configuration',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      features: [
        'CORS configuration management',
        'Helmet security headers',
        'Rate limiting configuration',
        'Request validation',
        'Security metrics tracking',
        'Configuration validation'
      ],
      capabilities: {
        corsManagement: true,
        helmetConfiguration: true,
        rateLimitConfiguration: true,
        requestValidation: true,
        metricsTracking: true,
        configurationValidation: true
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    structuredLogger.error('Security configuration health check failed', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: (error as Error).message
    });
  }
});

export default router;
