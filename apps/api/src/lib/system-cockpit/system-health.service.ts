// ============================================================================
// SYSTEM HEALTH SERVICE - Servicio de monitoreo de salud del sistema
// ============================================================================

import { structuredLogger } from '../structured-logger.js';
import { getDatabaseService } from '../database.service.js';
import { getRedisService } from '../redis.service.js';
import { monitoringService } from '../monitoring.service.js';

// ========================================================================
// INTERFACES
// ========================================================================

export interface SystemHealthData {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  services: ServiceStatus[];
  metrics: SystemMetrics;
  alerts: Alert[];
  lastUpdate: Date;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  errorRate: number;
  throughput: number;
  details?: any;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    operations: number;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  service: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// ========================================================================
// SYSTEM HEALTH SERVICE
// ========================================================================

export class SystemHealthService {
  private healthData: SystemHealthData | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.startHealthMonitoring();
  }

  // ========================================================================
  // MÉTODOS PRINCIPALES
  // ========================================================================

  async getOverallHealth(): Promise<SystemHealthData> {
    try {
      const services = await this.checkAllServices();
      const metrics = await this.collectSystemMetrics();
      const alerts = await this.getActiveAlerts();
      const uptime = process.uptime();

      const overallStatus = this.calculateOverallStatus(services, alerts);

      this.healthData = {
        overallStatus,
        timestamp: new Date(),
        uptime,
        services,
        metrics,
        alerts,
        lastUpdate: new Date()
      };

      return this.healthData;
    } catch (error) {
      structuredLogger.error('Error getting overall health', error as Error);
      throw error;
    }
  }

  async checkServiceHealth(serviceName: string): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      let status: 'up' | 'down' | 'degraded' = 'up';
      let errorRate = 0;
      let throughput = 0;
      let details: any = {};

      switch (serviceName) {
        case 'database':
          const dbStatus = await this.checkDatabaseHealth();
          status = dbStatus.status;
          details = dbStatus.details;
          break;

        case 'redis':
          const redisStatus = await this.checkRedisHealth();
          status = redisStatus.status;
          details = redisStatus.details;
          break;

        case 'api':
          const apiStatus = await this.checkAPIHealth();
          status = apiStatus.status;
          details = apiStatus.details;
          break;

        case 'monitoring':
          const monitoringStatus = await this.checkMonitoringHealth();
          status = monitoringStatus.status;
          details = monitoringStatus.details;
          break;

        default:
          status = 'down';
          details = { error: 'Unknown service' };
      }

      const responseTime = Date.now() - startTime;

      return {
        name: serviceName,
        status,
        responseTime,
        lastCheck: new Date(),
        errorRate,
        throughput,
        details
      };
    } catch (error) {
      structuredLogger.error(`Error checking service health: ${serviceName}`, error as Error);
      return {
        name: serviceName,
        status: 'down',
        responseTime: 0,
        lastCheck: new Date(),
        errorRate: 100,
        throughput: 0,
        details: { error: (error as Error).message }
      };
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      // Obtener métricas de base de datos
      const dbMetrics = await this.getDatabaseMetrics();

      // Obtener métricas de caché
      const cacheMetrics = await this.getCacheMetrics();

      return {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpu: {
          usage: this.calculateCPUUsage(cpuUsage),
          loadAverage: this.getLoadAverage()
        },
        disk: {
          used: 0, // Implementar si es necesario
          total: 0,
          percentage: 0
        },
        network: {
          bytesIn: 0, // Implementar si es necesario
          bytesOut: 0
        },
        database: dbMetrics,
        cache: cacheMetrics
      };
    } catch (error) {
      structuredLogger.error('Error getting system metrics', error as Error);
      throw error;
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    try {
      // Obtener alertas del servicio de monitoreo
      const monitoringAlerts = monitoringService.getAlerts(50);

      // Convertir a formato de alertas del sistema
      return monitoringAlerts.map(alert => ({
        id: alert.id,
        type: 'error' as const,
        severity: alert.severity,
        message: alert.message,
        service: 'system',
        timestamp: alert.timestamp,
        resolved: alert.resolved,
        resolvedAt: alert.resolvedAt
      }));
    } catch (error) {
      structuredLogger.error('Error getting active alerts', error as Error);
      return [];
    }
  }

  // ========================================================================
  // MÉTODOS DE MONITOREO
  // ========================================================================

  private async checkAllServices(): Promise<ServiceStatus[]> {
    const services = ['database', 'redis', 'api', 'monitoring'];
    const results = await Promise.allSettled(
      services.map(service => this.checkServiceHealth(service))
    );

    return results;
      .filter((result): result is PromiseFulfilledResult<ServiceStatus> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  private async checkDatabaseHealth(): Promise<{ status: 'up' | 'down' | 'degraded'; details: any }> {
    try {
      const db = getDatabaseService();
      const startTime = Date.now();

      // Realizar una consulta simple
      await db.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'up' : 'degraded',
        details: {
          responseTime,
          connectionPool: 'active',
          lastQuery: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkRedisHealth(): Promise<{ status: 'up' | 'down' | 'degraded'; details: any }> {
    try {
      const redis = getRedisService();
      const startTime = Date.now();

      await redis.ping();

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? 'up' : 'degraded',
        details: {
          responseTime,
          connection: 'active',
          lastPing: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkAPIHealth(): Promise<{ status: 'up' | 'down' | 'degraded'; details: any }> {
    try {
      // Verificar que el servidor esté respondiendo
      const response = await fetch('http://localhost:3000/v1/health', {
        method: 'GET',
        timeout: 5000
      });

      return {
        status: response.ok ? 'up' : 'degraded',
        details: {
          statusCode: response.status,
          responseTime: Date.now(),
          lastCheck: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkMonitoringHealth(): Promise<{ status: 'up' | 'down' | 'degraded'; details: any }> {
    try {
      const healthStatus = monitoringService.getHealthStatus();

      return {
        status: healthStatus.status === 'healthy' ? 'up' :
                healthStatus.status === 'degraded' ? 'degraded' : 'down',
        details: {
          status: healthStatus.status,
          services: healthStatus.services.length,
          lastCheck: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        details: { error: (error as Error).message }
      };
    }
  }

  // ========================================================================
  // MÉTODOS DE MÉTRICAS
  // ========================================================================

  private async getDatabaseMetrics(): Promise<{ connections: number; maxConnections: number; queryTime: number }> {
    try {
      const db = getDatabaseService();
      const startTime = Date.now();

      await db.query('SELECT 1');

      return {
        connections: 10, // Implementar conteo real
        maxConnections: 100,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        connections: 0,
        maxConnections: 100,
        queryTime: 0
      };
    }
  }

  private async getCacheMetrics(): Promise<{ hitRate: number; memoryUsage: number; operations: number }> {
    try {
      const cacheStats = monitoringService.getStats();

      return {
        hitRate: cacheStats.hitRate * 100,
        memoryUsage: 0, // Implementar si es necesario
        operations: cacheStats.hits + cacheStats.misses
      };
    } catch (error) {
      return {
        hitRate: 0,
        memoryUsage: 0,
        operations: 0
      };
    }
  }

  private calculateCPUUsage(cpuUsage: NodeJS.CpuUsage): number {
    // Implementación simplificada
    return (cpuUsage.user + cpuUsage.system) / 1000000;
  }

  private getLoadAverage(): number[] {
    // En Node.js, no tenemos acceso directo al load average
    return [0.5, 0.3, 0.2];
  }

  private calculateOverallStatus(services: ServiceStatus[], alerts: Alert[]): 'healthy' | 'degraded' | 'unhealthy' {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
    const downServices = services.filter(service => service.status === 'down');
    const degradedServices = services.filter(service => service.status === 'degraded');

    if (criticalAlerts.length > 0 || downServices.length > 0) {
      return 'unhealthy';
    }

    if (degradedServices.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  // ========================================================================
  // MÉTODOS DE MONITOREO CONTINUO
  // ========================================================================

  private startHealthMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Actualizar datos de salud cada 30 segundos
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getOverallHealth();
        structuredLogger.debug('System health data updated');
      } catch (error) {
        structuredLogger.error('Error updating system health', error as Error);
      }
    }, 30000);

    structuredLogger.info('System health monitoring started');
  }

  stopHealthMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    structuredLogger.info('System health monitoring stopped');
  }

  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================

  getCurrentHealthData(): SystemHealthData | null {
    return this.healthData;
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await monitoringService.resolveAlert(alertId);
      structuredLogger.info(`Alert resolved: ${alertId}`);
    } catch (error) {
      structuredLogger.error(`Error resolving alert: ${alertId}`, error as Error);
      throw error;
    }
  }
}

// ========================================================================
// INSTANCIA SINGLETON
// ========================================================================

export const systemHealthService = new SystemHealthService();

