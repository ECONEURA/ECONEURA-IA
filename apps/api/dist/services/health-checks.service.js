import { structuredLogger } from '../lib/structured-logger.js';
export class HealthChecksService {
    async getHealthStatus() {
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
        }
        catch (error) {
            structuredLogger.error('Failed to get health status', error);
            throw error;
        }
    }
}
export const healthChecks = new HealthChecksService();
//# sourceMappingURL=health-checks.service.js.map