import { Request, Response, NextFunction } from 'express';
import { httpMetrics, systemMetrics } from './metrics';
import { tracingManager } from './tracing';
import { logger } from '../logging/index';

/**
 * HTTP request monitoring middleware
 */
export function monitorRequest() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const originalEnd = res.end;
    const route = req.route?.path || 'unknown';
    const method = req.method;

    // Start tracing span
    const span = tracingManager.startSpan('http_request', {
      attributes: {
        'http.method': method,
        'http.route': route,
        'http.url': req.url,
        'http.user_agent': req.get('user-agent') || 'unknown',
      },
    });

    // Record request size
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    httpMetrics.requestSizeBytes.observe({ method, route }, contentLength);

    // Override response end to capture metrics
    res.end = function(...args: any[]): Response {
      // Calculate duration
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = res.statusCode.toString();

      // Record metrics
  httpMetrics.requestDuration.observe({ method, route, status_code: statusCode }, duration);
  httpMetrics.requestsTotal.inc({ method, route, status_code: statusCode });

      // Record response size
      const responseLength = parseInt(res.get('content-length') || '0', 10);
      httpMetrics.responseSizeBytes.observe({ method, route }, responseLength);

      // End tracing span
      tracingManager.endSpan('http_request', {
        status: undefined,
        error: undefined,
      });

      // Log request
      logger.logAPIRequest(`${method} ${route} ${statusCode}`, {
        method,
        path: route,
        status_code: Number(statusCode),
        latency_ms: Math.round(duration * 1000),
        org_id: (req as any).org_id,
      });

  return originalEnd.apply(this, args as any);
    };

    next();
  };
}

/**
 * Error monitoring middleware
 */
export function monitorErrors() {
  return (error: Error, req: Request, res: Response, next: NextFunction): void => {
    const route = req.route?.path || 'unknown';
    const method = req.method;

    // Record error metrics
    httpMetrics.requestsTotal.inc({
      method,
      route,
      status_code: '500',
    });

    // End tracing span with error
    tracingManager.endSpan('http_request', { error });

    // Log error
    logger.error(`${method} ${route} failed`, error, {
      request: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
      },
    });

    next(error);
  };
}

/**
 * Health check middleware
 */
export function healthCheck() {
  return (req: Request, res: Response): void => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Update system metrics
    Object.entries(memoryUsage).forEach(([type, bytes]) => {
      systemMetrics.memory.set({ type }, bytes as number);
    });

    systemMetrics.cpuUsage.set((cpuUsage.user + cpuUsage.system) / 1000000);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      memory: memoryUsage,
      cpu: cpuUsage,
    });
  };
}
