/**
 * Sistema de métricas para el SDK
 */

export interface MetricsCollector {
  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void;
  recordError(type: string, message: string): void;
  recordRetry(operation: string, attempt: number): void;
  recordRateLimit(endpoint: string, retryAfter: number): void;
  getMetrics(): ClientMetrics;
}

export interface ClientMetrics {
  requests: {
    total: number;
    success: number;
    failed: number;
    avgDurationMs: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
  retries: {
    total: number;
    byOperation: Record<string, number>;
  };
  rateLimits: {
    total: number;
    byEndpoint: Record<string, number>;
  };
}

export class DefaultMetricsCollector implements MetricsCollector {
  private requests: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
  }[] = [];

  private errors: {
    type: string;
    message: string;
    timestamp: number;
  }[] = [];

  private retries: {
    operation: string;
    attempt: number;
    timestamp: number;
  }[] = [];

  private rateLimits: {
    endpoint: string;
    retryAfter: number;
    timestamp: number;
  }[] = [];

  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.requests.push({ method, path, statusCode, durationMs });
  }

  recordError(type: string, message: string): void {
    this.errors.push({ type, message, timestamp: Date.now() });
  }

  recordRetry(operation: string, attempt: number): void {
    this.retries.push({ operation, attempt, timestamp: Date.now() });
  }

  recordRateLimit(endpoint: string, retryAfter: number): void {
    this.rateLimits.push({ endpoint, retryAfter, timestamp: Date.now() });
  }

  getMetrics(): ClientMetrics {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutos
    const windowStart = now - windowMs;

    // Filtrar por ventana de tiempo
    const recentRequests = this.requests.filter(r => r.durationMs > windowStart);
    const recentErrors = this.errors.filter(e => e.timestamp > windowStart);
    const recentRetries = this.retries.filter(r => r.timestamp > windowStart);
    const recentRateLimits = this.rateLimits.filter(r => r.timestamp > windowStart);

    // Calcular métricas de requests
    const successRequests = recentRequests.filter(r => r.statusCode < 400);
    const failedRequests = recentRequests.filter(r => r.statusCode >= 400);
    const totalDuration = recentRequests.reduce((sum, r) => sum + r.durationMs, 0);

    // Agrupar errores por tipo
    const errorsByType = recentErrors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar retries por operación
    const retriesByOperation = recentRetries.reduce((acc, retry) => {
      acc[retry.operation] = (acc[retry.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar rate limits por endpoint
    const rateLimitsByEndpoint = recentRateLimits.reduce((acc, limit) => {
      acc[limit.endpoint] = (acc[limit.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      requests: {
        total: recentRequests.length,
        success: successRequests.length,
        failed: failedRequests.length,
        avgDurationMs: recentRequests.length > 0 
          ? totalDuration / recentRequests.length 
          : 0,
      },
      errors: {
        total: recentErrors.length,
        byType: errorsByType,
      },
      retries: {
        total: recentRetries.length,
        byOperation: retriesByOperation,
      },
      rateLimits: {
        total: recentRateLimits.length,
        byEndpoint: rateLimitsByEndpoint,
      }
    };
  }
}
