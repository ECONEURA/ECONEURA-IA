import { Request, Response, NextFunction } from 'express';
import { httpMetrics } from './metrics';
import { tracingManager } from './tracing';
import { log } from './logger';

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
        attributes: {
          'http.status_code': statusCode,
          'http.response_content_length': responseLength,
        },
      });

      // Log request
      log.http(`${method} ${route} ${statusCode}`, {
        duration,
        requestSize: contentLength,
        responseSize: responseLength,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });

      return originalEnd.apply(this, args);
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
    tracingManager.endSpan('http_request', {
      error,
      attributes: {
        'http.status_code': '500',
        'error.type': error.name,
        'error.message': error.message,
      },
    });

    // Log error
    log.error(`${method} ${route} failed`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
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
      metrics.systemMetrics.memory.set({ type }, bytes);
    });

    metrics.systemMetrics.cpuUsage.set(
      (cpuUsage.user + cpuUsage.system) / 1000000
    );

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      memory: memoryUsage,
      cpu: cpuUsage,
    });
  };
}
