import { MetricsCollector } from './metrics';
import { Logger } from './logger';
import { Request, Response, NextFunction } from 'express';

export class ObservabilityService {
  private metrics: MetricsCollector;
  private logger: Logger;

  constructor() {
    this.metrics = new MetricsCollector();
    this.logger = new Logger('observability');
  }

  // Middleware para observabilidad de requests
  requestObservability() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      const orgId = req.headers['x-org-id'] as string;

      // Añadir ID de request a headers de respuesta
      res.setHeader('x-request-id', requestId);

      // Crear logger con contexto
      const requestLogger = this.logger.child({
        requestId,
        orgId,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent']
      });

      // Registrar inicio de request
      requestLogger.info('Request started');

      // Interceptar finalización de request
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Registrar métricas
        this.metrics.recordHttpRequest({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        });

        // Registrar métricas de IA si están disponibles
        if (res.locals.aiMetrics) {
          this.metrics.recordAIRequest(res.locals.aiMetrics);
        }

        // Log de finalización
        requestLogger.info('Request completed', {
          statusCode: res.statusCode,
          duration,
          contentLength: res.getHeader('content-length'),
          aiMetrics: res.locals.aiMetrics
        });
      });

      // Guardar logger en request para uso en rutas
      req.logger = requestLogger;
      next();
    };
  }

  // Middleware para degradación del servicio
  degradationCheck() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const health = await this.checkSystemHealth();
        
        if (health.isDegraded) {
          res.setHeader('x-system-degraded', 'true');
          res.setHeader('x-degradation-reason', health.reason || 'unknown');
          
          this.logger.warn('System degraded', health);
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
    const errorRate = await this.metrics.getErrorRate();
    const limit = 5; // 5% error rate

    return {
      healthy: errorRate < limit,
      value: errorRate,
      limit
    };
  }

  private async checkAIQuota() {
    const quota = await this.metrics.getAIQuotaStatus();
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
