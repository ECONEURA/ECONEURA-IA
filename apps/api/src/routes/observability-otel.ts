/**
 * Observability OpenTelemetry Routes
 * PR-103: Observabilidad/OTel (api) - propagación y trazas
 * 
 * Rutas para gestión de observabilidad con OpenTelemetry
 */

import { Router, Request, Response } from 'express';
import { observabilityOTelService } from '../services/observability-otel.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// =============================================================================
// CONFIGURACIÓN DE OBSERVABILIDAD
// =============================================================================

// GET /v1/observability-otel/config
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = observabilityOTelService.getConfig();
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get observability configuration', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get observability configuration',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// MÉTRICAS DE SPANS
// =============================================================================

// GET /v1/observability-otel/spans/metrics
router.get('/spans/metrics', async (req: Request, res: Response) => {
  try {
    const spanMetrics = observabilityOTelService.getSpanMetrics();
    
    res.json({
      success: true,
      data: spanMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get span metrics', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get span metrics',
      message: (error as Error).message
    });
  }
});

// GET /v1/observability-otel/spans/active
router.get('/spans/active', async (req: Request, res: Response) => {
  try {
    const activeSpans = observabilityOTelService.getActiveSpans();
    const activeSpanCount = observabilityOTelService.getActiveSpanCount();
    
    res.json({
      success: true,
      data: {
        count: activeSpanCount,
        spans: activeSpans.map(span => ({
          spanId: span.spanContext().spanId,
          traceId: span.spanContext().traceId,
          name: span.name,
          attributes: span.attributes
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get active spans', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get active spans',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// MÉTRICAS DEL SERVICIO
// =============================================================================

// GET /v1/observability-otel/service/metrics
router.get('/service/metrics', async (req: Request, res: Response) => {
  try {
    const serviceMetrics = observabilityOTelService.getServiceMetrics();
    
    res.json({
      success: true,
      data: serviceMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get service metrics', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get service metrics',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// CONTEXTO DE TRAZAS
// =============================================================================

// GET /v1/observability-otel/trace/context
router.get('/trace/context', async (req: Request, res: Response) => {
  try {
    const traceContext = observabilityOTelService.getTraceContext();
    const currentSpan = observabilityOTelService.getCurrentSpan();
    
    res.json({
      success: true,
      data: {
        traceContext,
        currentSpan: currentSpan ? {
          spanId: currentSpan.spanContext().spanId,
          traceId: currentSpan.spanContext().traceId,
          name: currentSpan.name,
          attributes: currentSpan.attributes
        } : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get trace context', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get trace context',
      message: (error as Error).message
    });
  }
});

// GET /v1/observability-otel/trace/current
router.get('/trace/current', async (req: Request, res: Response) => {
  try {
    const currentSpan = observabilityOTelService.getCurrentSpan();
    const traceId = observabilityOTelService.getCurrentTraceId();
    const spanId = observabilityOTelService.getCurrentSpanId();
    
    res.json({
      success: true,
      data: {
        traceId,
        spanId,
        span: currentSpan ? {
          name: currentSpan.name,
          attributes: currentSpan.attributes
        } : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get current trace', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get current trace',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// CREACIÓN DE SPANS
// =============================================================================

// POST /v1/observability-otel/spans/create
router.post('/spans/create', async (req: Request, res: Response) => {
  try {
    const { name, kind, attributes } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid span name',
        message: 'Name must be a non-empty string'
      });
    }

    const span = observabilityOTelService.createSpan(name, {
      kind: kind || 'INTERNAL',
      attributes: attributes || {}
    });

    res.json({
      success: true,
      data: {
        spanId: span.spanContext().spanId,
        traceId: span.spanContext().traceId,
        name: span.name,
        attributes: span.attributes
      },
      message: 'Span created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create span', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create span',
      message: (error as Error).message
    });
  }
});

// POST /v1/observability-otel/spans/business
router.post('/spans/business', async (req: Request, res: Response) => {
  try {
    const { operation, organizationId, attributes } = req.body;
    
    if (!operation || !organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'operation and organizationId are required'
      });
    }

    const span = observabilityOTelService.createBusinessSpan(operation, organizationId, {
      attributes: attributes || {}
    });

    res.json({
      success: true,
      data: {
        spanId: span.spanContext().spanId,
        traceId: span.spanContext().traceId,
        name: span.name,
        attributes: span.attributes
      },
      message: 'Business span created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create business span', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create business span',
      message: (error as Error).message
    });
  }
});

// POST /v1/observability-otel/spans/database
router.post('/spans/database', async (req: Request, res: Response) => {
  try {
    const { operation, table, attributes } = req.body;
    
    if (!operation || !table) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'operation and table are required'
      });
    }

    const span = observabilityOTelService.createDatabaseSpan(operation, table, {
      attributes: attributes || {}
    });

    res.json({
      success: true,
      data: {
        spanId: span.spanContext().spanId,
        traceId: span.spanContext().traceId,
        name: span.name,
        attributes: span.attributes
      },
      message: 'Database span created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create database span', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create database span',
      message: (error as Error).message
    });
  }
});

// POST /v1/observability-otel/spans/external
router.post('/spans/external', async (req: Request, res: Response) => {
  try {
    const { service, endpoint, attributes } = req.body;
    
    if (!service || !endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'service and endpoint are required'
      });
    }

    const span = observabilityOTelService.createExternalApiSpan(service, endpoint, {
      attributes: attributes || {}
    });

    res.json({
      success: true,
      data: {
        spanId: span.spanContext().spanId,
        traceId: span.spanContext().traceId,
        name: span.name,
        attributes: span.attributes
      },
      message: 'External API span created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create external API span', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create external API span',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// EJECUCIÓN CON SPANS
// =============================================================================

// POST /v1/observability-otel/execute/span
router.post('/execute/span', async (req: Request, res: Response) => {
  try {
    const { name, operation, attributes } = req.body;
    
    if (!name || !operation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name and operation are required'
      });
    }

    // Simular operación (en un caso real, esto sería una función real)
    const mockOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simular trabajo
      return { result: 'Operation completed successfully' };
    };

    const result = await observabilityOTelService.executeWithSpan(name, mockOperation, {
      attributes: attributes || {}
    });

    res.json({
      success: true,
      data: result,
      message: 'Operation executed with span successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to execute operation with span', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to execute operation with span',
      message: (error as Error).message
    });
  }
});

// POST /v1/observability-otel/execute/http
router.post('/execute/http', async (req: Request, res: Response) => {
  try {
    const { operation, attributes } = req.body;
    
    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'operation is required'
      });
    }

    // Simular operación HTTP (en un caso real, esto sería una función real)
    const mockOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 150)); // Simular trabajo
      return { result: 'HTTP operation completed successfully' };
    };

    const result = await observabilityOTelService.executeWithHttpSpan(req, res, mockOperation, {
      attributes: attributes || {}
    });

    res.json({
      success: true,
      data: result,
      message: 'HTTP operation executed with span successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to execute HTTP operation with span', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to execute HTTP operation with span',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// TRACING DE ERRORES
// =============================================================================

// POST /v1/observability-otel/errors/trace
router.post('/errors/trace', async (req: Request, res: Response) => {
  try {
    const { error, context } = req.body;
    
    if (!error) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'error is required'
      });
    }

    // Crear error object
    const errorObj = new Error(error.message || 'Unknown error');
    errorObj.name = error.name || 'Error';
    errorObj.stack = error.stack || '';

    observabilityOTelService.traceError(errorObj, context || {});

    res.json({
      success: true,
      message: 'Error traced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to trace error', {
      error: (error as Error).message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to trace error',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// ESTADO DEL SERVICIO
// =============================================================================

// GET /v1/observability-otel/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const config = observabilityOTelService.getConfig();
    const spanMetrics = observabilityOTelService.getSpanMetrics();
    const serviceMetrics = observabilityOTelService.getServiceMetrics();
    const activeSpanCount = observabilityOTelService.getActiveSpanCount();
    
    res.json({
      success: true,
      data: {
        service: {
          name: config.service.name,
          version: config.service.version,
          environment: config.service.environment,
          instance: config.service.instance
        },
        tracing: {
          enabled: config.tracing.enabled,
          samplingRate: config.tracing.samplingRate,
          activeSpans: activeSpanCount
        },
        metrics: {
          enabled: config.metrics.enabled,
          collectionInterval: config.metrics.collectionInterval
        },
        logging: {
          enabled: config.logging.enabled,
          level: config.logging.level,
          structured: config.logging.structured
        },
        performance: {
          spanMetrics,
          serviceMetrics
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get observability status', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get observability status',
      message: (error as Error).message
    });
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

// GET /v1/observability-otel/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      service: 'Observability OpenTelemetry',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      features: [
        'OpenTelemetry tracing',
        'Span creation and management',
        'Context propagation',
        'Performance metrics',
        'Error tracing',
        'System metrics collection',
        'HTTP request tracing',
        'Database operation tracing',
        'External API tracing',
        'Business operation tracing'
      ],
      capabilities: {
        tracing: true,
        metrics: true,
        logging: true,
        contextPropagation: true,
        errorTracing: true,
        performanceMonitoring: true,
        systemMetrics: true,
        customSpans: true
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    structuredLogger.error('Observability health check failed', {
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
