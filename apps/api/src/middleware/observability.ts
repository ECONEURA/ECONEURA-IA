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
  const path = (req as Request & { path?: string }).path || req.url || '/';
  const traceContext = tracing.startSpan(`HTTP ${req.method} ${path}`);
  (req as Request & { traceContext?: unknown }).traceContext = traceContext;

  // Registrar tiempo de inicio
  req.startTime = Date.now();

  // Agregar headers de trace
  res.setHeader('X-Request-ID', req.requestId || 'unknown');
  res.setHeader('X-Trace-ID', traceContext.traceId);
  res.setHeader('X-Span-ID', traceContext.spanId);

  // Log del request entrante
  logger.info(`Request started: ${req.method} ${path}`, {
    requestId: req.requestId,
    traceId: traceContext.traceId,
    spanId: traceContext.spanId,
    method: req.method,
    path,
    userAgent: typeof req.get === 'function' ? req.get('User-Agent') : undefined,
    ip: req.ip,
    query: req.query as Record<string, unknown>,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Agregar tags al trace
  tracing.addTag(traceContext.spanId, 'http.method', req.method);
  tracing.addTag(traceContext.spanId, 'http.path', path);
  tracing.addTag(traceContext.spanId, 'http.user_agent', typeof req.get === 'function' ? (req.get('User-Agent') || 'unknown') : 'unknown');
  if (req.ip) tracing.addTag(traceContext.spanId, 'http.ip', req.ip);

  // Interceptar el final de la respuesta
  const originalSend = res.send.bind(res);
  res.send = function (data?: unknown): Response {
      try {
        const duration = Date.now() - (req.startTime || 0);
        const statusCode = res.statusCode || 200;

        // Registrar métricas (mejor definida)
        try {
          const m = metrics as unknown as { recordHttpRequest?: (method: string, route: string, status: number, duration: number) => void };
          m.recordHttpRequest?.(req.method, path, statusCode, duration);
        } catch {}

        // Registrar log del request completado
        try {
          const rl = logger as unknown as { request?: (method: string, path: string, status: number, duration: number, meta?: Record<string, unknown>) => void };
          const tc = traceContext as unknown as Record<string, unknown> | null;
          const traceId = tc && typeof tc['traceId'] === 'string' ? String(tc['traceId']) : undefined;
          const spanId = tc && typeof tc['spanId'] === 'string' ? String(tc['spanId']) : undefined;
          rl.request?.(req.method, path, statusCode, duration, {
            requestId: req.requestId,
            traceId,
            spanId,
            userAgent: typeof req.get === 'function' ? req.get('User-Agent') : undefined,
            ip: req.ip
          });
        } catch {}

        // Finalizar trace (best-effort)
        try {
          const tc2 = traceContext as unknown as Record<string, unknown> | null;
          const spanId2 = tc2 && typeof tc2['spanId'] === 'string' ? String(tc2['spanId']) : undefined;
          if (spanId2) tracing.endSpan?.(spanId2, { 'http.status_code': statusCode, 'duration_ms': duration, 'error': statusCode >= 400 });
        } catch {}

        // Agregar headers de observabilidad
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Request-Duration', String(duration));
      } catch (e) {
        // best-effort only
      }
  // Ensure send receives string | Buffer | undefined
  const safeData = (typeof data === 'string' || Buffer.isBuffer(data) || data === undefined) ? data : JSON.stringify(data);
  return originalSend(safeData as unknown as string | Buffer | undefined);
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
    const originalSendHC = res.send.bind(res);
    res.send = function (data?: any): Response {
      try {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode || 200;
        try {
          const m = metrics as unknown as {
            recordHealthCheck?: (path: string, status: string, duration: number) => void;
            recordHealthCheckDuration?: (path: string, duration: number) => void;
            incrementHealthCheck?: (path: string) => void;
          };
          if (typeof m.recordHealthCheck === 'function') {
            m.recordHealthCheck(req.path, statusCode < 400 ? 'ok' : 'error', duration);
          } else if (typeof m.recordHealthCheckDuration === 'function') {
            m.recordHealthCheckDuration(req.path, duration);
          } else if (typeof m.incrementHealthCheck === 'function') {
            m.incrementHealthCheck(req.path);
          }
        } catch {}

        try { logger.healthCheck(req.path, statusCode < 400 ? 'ok' : 'error', duration, { traceId: traceContext.traceId, spanId: traceContext.spanId }); } catch {}
        try { tracing.endSpan(traceContext.spanId, { 'health.status': statusCode < 400 ? 'ok' : 'error', 'duration_ms': duration }); } catch {}
      } catch {}
  return originalSendHC(data as unknown as string | Buffer);
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
