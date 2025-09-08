import { z } from 'zod';

// ============================================================================
// HEALTH CHECK SCHEMAS
// ============================================================================

export const ServiceHealthSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  responseTime: z.number(),
  lastCheck: z.string().datetime(),
  error: z.string().optional(),
});

export const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number(),
  services: z.record(z.string(), ServiceHealthSchema),
  metrics: z.object({
    memory: z.object({
      used: z.number(),
      total: z.number(),
      percentage: z.number(),
    }),
    cpu: z.object({
      usage: z.number(),
    }),
    requests: z.object({
      total: z.number(),
      errors: z.number(),
      errorRate: z.number(),
      responseTime: z.number().optional(),
    }),
  }),
});

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  timestamp: z.string().datetime(),
  checks: z.array(z.object({
    name: z.string(),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    message: z.string().optional(),
    duration: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
  })),
});

// ============================================================================
// TYPES
// ============================================================================

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// ============================================================================
// HEALTH CHECK UTILITIES
// ============================================================================

export class HealthChecker {
  private services: Map<string, () => Promise<ServiceHealth>> = new Map();

  registerService(name: string, checkFn: () => Promise<ServiceHealth>): void {
    this.services.set(name, checkFn);
  }

  async checkService(name: string): Promise<ServiceHealth> {
    const checkFn = this.services.get(name);
    if (!checkFn) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: `Service ${name} not registered`,
      };
    }

    const startTime = Date.now();
    try {
      const result = await checkFn();
      return {
        ...result,
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkAllServices(): Promise<Record<string, ServiceHealth>> {
    const results: Record<string, ServiceHealth> = {};
    
    for (const [name] of this.services) {
      results[name] = await this.checkService(name);
    }
    
    return results;
  }

  getOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map(s => s.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

// ============================================================================
// COMMON HEALTH CHECKS
// ============================================================================

export async function checkDatabase(): Promise<ServiceHealth> {
  try {
    // This would be implemented with actual database connection
    // For now, return a mock healthy status
    return {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

export async function checkRedis(): Promise<ServiceHealth> {
  try {
    // This would be implemented with actual Redis connection
    // For now, return a mock healthy status
    return {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

export async function checkAzureOpenAI(): Promise<ServiceHealth> {
  try {
    // This would be implemented with actual Azure OpenAI connection
    // For now, return a mock healthy status
    return {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Azure OpenAI connection failed',
    };
  }
}

// ============================================================================
// SYSTEM METRICS
// ============================================================================

export function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal + memUsage.external;
  const usedMem = memUsage.heapUsed;
  
  return {
    memory: {
      used: usedMem,
      total: totalMem,
      percentage: Math.round((usedMem / totalMem) * 100),
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000, // Convert to seconds
    },
    requests: {
      total: 0, // This would be tracked by the application
      errors: 0, // This would be tracked by the application
      errorRate: 0, // This would be calculated
    },
  };
}

// ============================================================================
// HEALTH CHECK RESPONSE BUILDER
// ============================================================================

export function buildHealthResponse(
  services: Record<string, ServiceHealth>,
  overallStatus: 'healthy' | 'unhealthy' | 'degraded',
  version: string = '1.0.0'
): HealthStatus {
  const metrics = getSystemMetrics();
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version,
    uptime: process.uptime(),
    services,
    metrics,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  HealthChecker,
  checkDatabase,
  checkRedis,
  checkAzureOpenAI,
  getSystemMetrics,
  buildHealthResponse,
  ServiceHealthSchema,
  HealthStatusSchema,
  HealthCheckResponseSchema,
};
