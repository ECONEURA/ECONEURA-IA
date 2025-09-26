import { Request, Response, NextFunction } from 'express';

import { metrics } from './metrics.js';
import { logger } from './logger.js';

export class ObservabilityService {
  constructor() {}

  // Middleware para observabilidad de requests
  requestObservability() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = (req.headers['x-request-id'] as string) || this.generateRequestId();
      const orgId = req.headers['x-org-id'] as string | undefined;

  // Añadir ID de request a headers de respuesta
  try { res.setHeader('x-request-id', requestId); } catch {}

  // Crear logger con contexto (usar logger singleton o el logger de la request)
  const requestLogger = (req as Request & { logger?: typeof logger }).logger || logger;

  // Registrar inicio de request (si existe logger)
  try { if (requestLogger && typeof requestLogger.info === 'function') requestLogger.info('Request started'); } catch {}

  // Interceptar finalización de request
      res.on?.('finish', () => {
        const duration = Date.now() - startTime;

        // Registrar métricas (firma: route, method, statusCode, durationMs) - best-effort
          try {
            const m = metrics as unknown as { recordHttpRequest?: (route: string, method: string, status: number, duration: number) => void; recordAIRequest?: (m: any) => void };
            m.recordHttpRequest?.(req.path || req.url || '/', req.method || 'GET', res.statusCode || 0, duration);
          } catch {}

        // Registrar métricas de IA si están disponibles
        if (res.locals?.aiMetrics) {
          try {
            const m = metrics as unknown as { recordAIRequest?: (m: unknown) => void };
            m.recordAIRequest?.(res.locals.aiMetrics);
          } catch {}
        }

        // Log de finalización
        try {
          if (requestLogger && typeof requestLogger.info === 'function') {
            requestLogger.info('Request completed', {
              statusCode: res.statusCode,
              duration,
              contentLength: res.getHeader?.('content-length'),
              aiMetrics: res.locals?.aiMetrics
            });
          }
        } catch {}
      });

  // Guardar logger en request para uso en rutas
  (req as Request & { logger?: typeof logger }).logger = (req as Request & { logger?: typeof logger }).logger || requestLogger;
      next();
    };
  }

  // Middleware para degradación del servicio
  degradationCheck() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const health = await this.checkSystemHealth();

        if (health.isDegraded) {
          try { res.setHeader('x-system-degraded', 'true'); } catch {}
          try { res.setHeader('x-degradation-reason', health.reason || 'unknown'); } catch {}

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
  const getErrorRate = (metrics as unknown as { getErrorRate?: () => Promise<number> }).getErrorRate;
  const errorRate = typeof getErrorRate === 'function' ? await getErrorRate() : 0;
    const limit = 5; // 5% error rate

    return {
      healthy: errorRate < limit,
      value: errorRate,
      limit
    };
  }

  private async checkAIQuota() {
  const getAIQuotaStatus = (metrics as unknown as { getAIQuotaStatus?: () => Promise<{ percentageUsed: number }> }).getAIQuotaStatus;
  const quota = typeof getAIQuotaStatus === 'function' ? await getAIQuotaStatus() : { percentageUsed: 0 };
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
