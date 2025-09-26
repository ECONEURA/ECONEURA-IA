// ============================================================================
// METRICS MIDDLEWARE - EXPRESS INTEGRATION
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { 
  initializeMetrics, 
  PredefinedMetrics,
  counter,
  gauge,
  histogram
} from '@econeura/shared/metrics';

import { structuredLogger } from '../lib/structured-logger.js';

// ============================================================================
// METRICS INITIALIZATION
// ============================================================================

// Initialize metrics service
const metricsService = initializeMetrics({
  enabled: process.env.METRICS_ENABLED !== 'false',
  endpoint: process.env.METRICS_ENDPOINT,
  apiKey: process.env.METRICS_API_KEY,
  debugMode: process.env.NODE_ENV === 'development'
});

// ============================================================================
// METRICS MIDDLEWARE
// ============================================================================

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  // Increment request counter
  counter(PredefinedMetrics.API_REQUESTS_TOTAL, 1, {
    method: req.method,
    path: req.path,
    status: 'pending'
  });

  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    const status = res.statusCode.toString();

    // Update request counter with final status
    counter(PredefinedMetrics.API_REQUESTS_TOTAL, 1, {
      method: req.method,
      path: req.path,
      status
    });

    // Record request duration
    histogram(PredefinedMetrics.API_REQUEST_DURATION, duration / 1000, {
      method: req.method,
      path: req.path,
      status
    });

    // Record error if status >= 400
    if (res.statusCode >= 400) {
      counter(PredefinedMetrics.API_ERRORS_TOTAL, 1, {
        method: req.method,
        path: req.path,
        status,
        error_type: res.statusCode >= 500 ? 'server_error' : 'client_error'
      });
    }

    // Log request completion
    structuredLogger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// ============================================================================
// AUTHENTICATION METRICS
// ============================================================================

export function trackAuthMetrics(req: Request, res: Response, next: NextFunction): void {
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    if (req.path === '/auth/login') {
      if (res.statusCode === 200) {
        counter(PredefinedMetrics.AUTH_LOGINS_TOTAL, 1, {
          status: 'success',
          method: 'password'
        });
      } else if (res.statusCode === 401) {
        counter(PredefinedMetrics.AUTH_LOGINS_TOTAL, 1, {
          status: 'failure',
          method: 'password',
          reason: 'invalid_credentials'
        });
      }
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// ============================================================================
// DATABASE METRICS
// ============================================================================

export function trackDatabaseMetrics(query: string, duration: number, success: boolean): void {
  counter(PredefinedMetrics.DB_QUERIES_TOTAL, 1, {
    success: success.toString(),
    query_type: getQueryType(query)
  });

  if (!success) {
    counter(PredefinedMetrics.DB_ERRORS_TOTAL, 1, {
      query_type: getQueryType(query)
    });
  }
}

function getQueryType(query: string): string {
  const upperQuery = query.toUpperCase();
  if (upperQuery.startsWith('SELECT')) return 'select';
  if (upperQuery.startsWith('INSERT')) return 'insert';
  if (upperQuery.startsWith('UPDATE')) return 'update';
  if (upperQuery.startsWith('DELETE')) return 'delete';
  return 'other';
}

// ============================================================================
// BUSINESS METRICS
// ============================================================================

export function trackUserMetrics(action: string, organizationId?: string): void {
  counter(PredefinedMetrics.USERS_TOTAL, 1, {
    action,
    organization_id: organizationId || 'unknown'
  });
}

export function trackContactMetrics(action: string, organizationId?: string): void {
  counter(PredefinedMetrics.CONTACTS_TOTAL, 1, {
    action,
    organization_id: organizationId || 'unknown'
  });
}

export function trackDealMetrics(action: string, organizationId?: string): void {
  counter(PredefinedMetrics.DEALS_TOTAL, 1, {
    action,
    organization_id: organizationId || 'unknown'
  });
}

export function trackOrderMetrics(action: string, organizationId?: string): void {
  counter(PredefinedMetrics.ORDERS_TOTAL, 1, {
    action,
    organization_id: organizationId || 'unknown'
  });
}

export function trackAIMetrics(action: string, tokens?: number, cost?: number): void {
  counter(PredefinedMetrics.AI_REQUESTS_TOTAL, 1, {
    action
  });

  if (tokens) {
    counter(PredefinedMetrics.AI_TOKENS_USED, tokens, {
      action
    });
  }
}

// ============================================================================
// SYSTEM METRICS
// ============================================================================

export function trackSystemMetrics(): void {
  const memUsage = process.memoryUsage();
  
  gauge('memory_usage_bytes', memUsage.heapUsed, {
    type: 'heap_used'
  });

  gauge('memory_usage_bytes', memUsage.heapTotal, {
    type: 'heap_total'
  });

  gauge('memory_usage_bytes', memUsage.rss, {
    type: 'rss'
  });

  gauge('uptime_seconds', process.uptime());
}

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

export async function getMetricsData(req: Request, res: Response): Promise<void> {
  try {
    const metrics = await metricsService.getMetrics();
    const stats = metricsService.getStats();

    res.json({
      success: true,
      data: {
        metrics,
        stats,
        timestamp: new Date().toISOString()
      },
      requestId: req.headers['x-request-id'] as string || `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get metrics data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get metrics data',
      requestId: req.headers['x-request-id'] as string || `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

export async function clearMetrics(req: Request, res: Response): Promise<void> {
  try {
    await metricsService.clearMetrics();

    structuredLogger.info('Metrics cleared', {
      clearedBy: req.user?.id || 'admin'
    });

    res.json({
      success: true,
      message: 'Metrics cleared successfully',
      requestId: req.headers['x-request-id'] as string || `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to clear metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to clear metrics',
      requestId: req.headers['x-request-id'] as string || `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// SYSTEM METRICS COLLECTOR
// ============================================================================

let systemMetricsInterval: NodeJS.Timeout | null = null;

export function startSystemMetricsCollection(intervalMs: number = 30000): void {
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
  }

  systemMetricsInterval = setInterval(() => {
    trackSystemMetrics();
  }, intervalMs);

  structuredLogger.info('System metrics collection started', {
    interval: intervalMs
  });
}

export function stopSystemMetricsCollection(): void {
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
    systemMetricsInterval = null;
  }

  structuredLogger.info('System metrics collection stopped');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  metricsService,
  PredefinedMetrics
};

export default {
  metricsMiddleware,
  trackAuthMetrics,
  trackDatabaseMetrics,
  trackUserMetrics,
  trackContactMetrics,
  trackDealMetrics,
  trackOrderMetrics,
  trackAIMetrics,
  trackSystemMetrics,
  getMetricsData,
  clearMetrics,
  startSystemMetricsCollection,
  stopSystemMetricsCollection
};
