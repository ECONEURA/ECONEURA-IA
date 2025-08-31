import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { metrics } from '../lib/metrics.js';
import { tracing } from '../lib/tracing.js';

interface ExtendedRequest extends Request {
  requestId?: string;
  traceContext?: {
    traceId: string;
    spanId: string;
    parentId?: string;
  };
  startTime?: number;
}

export function observabilityMiddleware(req: ExtendedRequest, res: Response, next: NextFunction): void {
  // Generar request ID único
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Iniciar trace
  const traceContext = tracing.startSpan(`HTTP ${req.method} ${req.path}`);
  req.traceContext = traceContext;
  
  // Registrar tiempo de inicio
  req.startTime = Date.now();
  
  // Agregar headers de trace
  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Trace-ID', traceContext.traceId);
  res.setHeader('X-Span-ID', traceContext.spanId);
  
  // Log del request entrante
  logger.info(`Request started: ${req.method} ${req.path}`, {
    requestId: req.requestId,
    traceId: traceContext.traceId,
    spanId: traceContext.spanId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    query: JSON.stringify(req.query),
    body: req.method !== 'GET' ? req.body : undefined
  });
  
  // Agregar tags al trace
  tracing.addTag(traceContext.spanId, 'http.method', req.method);
  tracing.addTag(traceContext.spanId, 'http.path', req.path);
  tracing.addTag(traceContext.spanId, 'http.user_agent', req.get('User-Agent') || 'unknown');
  if (req.ip) {
    tracing.addTag(traceContext.spanId, 'http.ip', req.ip);
  }
  
  // Interceptar el final de la respuesta
  const originalSend = res.send;
  res.send = function(data: any): Response {
    const duration = Date.now() - (req.startTime || 0);
    const statusCode = res.statusCode;
    
    // Registrar métricas
    metrics.recordHttpRequest(req.method, req.path, statusCode, duration);
    
    // Registrar log del request completado
    logger.request(req.method, req.path, statusCode, duration, {
      requestId: req.requestId,
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Finalizar trace
    tracing.endSpan(traceContext.spanId, {
      'http.status_code': statusCode,
      'duration_ms': duration,
      'error': statusCode >= 400
    });
    
    // Agregar headers de observabilidad
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-Duration', duration.toString());
    
    return originalSend.call(this, data);
  };
  
  next();
}

// Middleware para manejo de errores con observabilidad
export function errorObservabilityMiddleware(error: any, req: ExtendedRequest, res: Response, next: NextFunction): void {
  const duration = Date.now() - (req.startTime || 0);
  const statusCode = error.status || 500;
  
  // Registrar error en logs
  logger.error(`Request failed: ${req.method} ${req.path}`, {
    requestId: req.requestId,
    traceId: req.traceContext?.traceId,
    spanId: req.traceContext?.spanId,
    method: req.method,
    path: req.path,
    statusCode,
    duration,
    error: error.message,
    stack: error.stack,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Registrar métricas de error
  metrics.recordHttpRequest(req.method, req.path, statusCode, duration);
  metrics.increment('errors_total', 1, { 
    type: 'http_error', 
    status: statusCode.toString(),
    path: req.path 
  });
  
  // Finalizar trace con error
  if (req.traceContext) {
    tracing.endSpan(req.traceContext.spanId, {
      'http.status_code': statusCode,
      'duration_ms': duration,
      'error': true,
      'error.message': error.message
    });
  }
  
  // Agregar headers de observabilidad
  res.setHeader('X-Request-ID', req.requestId || 'unknown');
  res.setHeader('X-Response-Time', `${duration}ms`);
  res.setHeader('X-Request-Duration', duration.toString());
  
  next(error);
}

// Middleware para health checks con observabilidad
export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path.startsWith('/health')) {
    const startTime = Date.now();
    const traceContext = tracing.startSpan(`Health Check ${req.path}`);
    
    // Interceptar respuesta
    const originalSend = res.send;
    res.send = function(data: any): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Registrar métricas de health check
      metrics.recordHealthCheck(req.path, statusCode < 400 ? 'ok' : 'error', duration);
      
      // Registrar log
      logger.healthCheck(req.path, statusCode < 400 ? 'ok' : 'error', duration, {
        traceId: traceContext.traceId,
        spanId: traceContext.spanId
      });
      
      // Finalizar trace
      tracing.endSpan(traceContext.spanId, {
        'health.status': statusCode < 400 ? 'ok' : 'error',
        'duration_ms': duration
      });
      
      return originalSend.call(this, data);
    };
  }
  
  next();
}

// Función para limpiar datos antiguos periódicamente
export function startCleanupScheduler(): void {
  setInterval(() => {
    try {
      metrics.cleanup();
      tracing.cleanup();
      logger.info('Observability cleanup completed');
    } catch (error) {
      logger.error('Observability cleanup failed', { error: (error as Error).message });
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
}

// Función para registrar métricas del sistema periódicamente
export function startSystemMetricsScheduler(): void {
  setInterval(() => {
    try {
      metrics.recordSystemMetrics();
    } catch (error) {
      logger.error('System metrics recording failed', { error: (error as Error).message });
    }
  }, 30 * 1000); // Cada 30 segundos
}
