import { metrics } from './metrics';
import { logger } from './logger';
import { Request, Response, NextFunction } from 'express';

export class ObservabilityService {
  constructor() {}

  // Middleware para observabilidad de requests
  requestObservability() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      const orgId = req.headers['x-org-id'] as string;

      // Añadir ID de request a headers de respuesta
      (res as any).setHeader?.('x-request-id', requestId);

      // Crear logger con contexto (usar logger singleton o el logger de la request)
      const requestLogger = (req as any).logger || logger;

      // Registrar inicio de request (si existe logger)
      if ((req as any).logger && typeof (req as any).logger.info === 'function') {
        (req as any).logger.info('Request started');
      }

  // Interceptar finalización de request
  (res as any).on?.('finish', () => {
        const duration = Date.now() - startTime;

  // Registrar métricas (firma: route, method, statusCode, durationMs)
  metrics.recordHttpRequest((req as any).path || (req as any).url || '/', (req as any).method || 'GET', (res as any).statusCode || 0, duration);

        // Registrar métricas de IA si están disponibles
    if ((res as any).locals?.aiMetrics) {
          // Si existe un helper específico para IA, intentar usarlo; si no, no hacer nada
          try {
      (metrics as any).recordAIRequest((res as any).locals.aiMetrics);
          } catch (e) {
            // no-op
          }
        }

        // Log de finalización
        if ((requestLogger as any)?.info && typeof (requestLogger as any).info === 'function') {
          (requestLogger as any).info('Request completed', {
            statusCode: (res as any).statusCode,
            duration,
            contentLength: (res as any).getHeader?.('content-length'),
            aiMetrics: (res as any).locals?.aiMetrics
          });
        }
      });

  // Guardar logger en request para uso en rutas
  (req as any).logger = (req as any).logger || requestLogger;
      next();
    };
  }

  // Middleware para degradación del servicio
  degradationCheck() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const health = await this.checkSystemHealth();
        
        if (health.isDegraded) {
          (res as any).setHeader?.('x-system-degraded', 'true');
          (res as any).setHeader?.('x-degradation-reason', health.reason || 'unknown');
          
          logger.warn?.('System degraded', {
            ...health,
            reason: health.reason || undefined
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Verificar salud del sistema
  private async checkSystemHealth() {
    const checks = {
      memory: this.checkMemoryUsage(),
      cpu: this.checkCPUUsage(),
      errorRate: await this.checkErrorRate(),
      aiQuota: await this.checkAIQuota()
    };

    const isDegraded = Object.values(checks).some(check => !check.healthy);
    const reason = Object.entries(checks)
      .filter(([, check]) => !check.healthy)
      .map(([name]) => name)
      .join(', ');

    return {
      isDegraded,
      reason: isDegraded ? reason : null,
      checks
    };
  }

  private checkMemoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const limit = 512; // 512MB

    return {
      healthy: used < limit,
      value: Math.round(used),
      limit
    };
  }

  private checkCPUUsage() {
    const usage = process.cpuUsage();
    const total = usage.user + usage.system;
    const limit = 90; // 90% CPU

    return {
      healthy: total < limit,
      value: Math.round(total),
      limit
    };
  }

  private async checkErrorRate() {
  const errorRate = await (metrics as any).getErrorRate?.();
    const limit = 5; // 5% error rate

    return {
      healthy: errorRate < limit,
      value: errorRate,
      limit
    };
  }

  private async checkAIQuota() {
  const quota = await (metrics as any).getAIQuotaStatus?.();
    const limit = 90; // 90% uso de cuota

    return {
      healthy: quota.percentageUsed < limit,
      value: quota.percentageUsed,
      limit
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
