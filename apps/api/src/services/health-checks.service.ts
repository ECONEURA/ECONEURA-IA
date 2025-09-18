import { structuredLogger } from '../lib/structured-logger.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, string>;
  timestamp: Date;
}

export class HealthChecksService {
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      return {
        status: 'healthy',
        services: {
          database: 'healthy',
          redis: 'healthy',
          api: 'healthy'
        },
        timestamp: new Date()
      };
    } catch (error) {
      structuredLogger.error('Failed to get health status', error as Error);
      throw error;
    }
  }
}

export const healthChecks = new HealthChecksService();
