import { logger } from './logger.js';
import { serviceDiscovery, ServiceInstance, LoadBalancingStrategy } from './service-discovery.js';

export interface ServiceMeshConfig {
  timeout: number;
  retries: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  loadBalancingStrategy: LoadBalancingStrategy;
  enableTracing: boolean;
  enableMetrics: boolean;
}

export interface ServiceRequest {
  serviceName: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface ServiceResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
}

export interface CircuitBreaker {
  serviceName: string;
  failureCount: number;
  lastFailureTime: Date;
  state: 'closed' | 'open' | 'half-open';
  threshold: number;
  timeout: number;
}

export interface ServiceMeshStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  circuitBreakers: CircuitBreaker[];
}

export class ServiceMesh {
  private config: ServiceMeshConfig;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private requestStats: Map<string, { total: number; success: number; failed: number; responseTimes: number[] }> = new Map();

  constructor(config: ServiceMeshConfig) {
    this.config = config;
    logger.info('Service Mesh initialized', { config });
  }

  async request(request: ServiceRequest): Promise<ServiceResponse> {
    const startTime = Date.now();
    const serviceName = request.serviceName;

    try {
      // Verificar circuit breaker
      if (this.isCircuitBreakerOpen(serviceName)) {
        throw new Error(`Circuit breaker is open for service: ${serviceName}`);
      }

      // Descubrir servicio
      const serviceInstance = serviceDiscovery.getLoadBalancedInstance(
        serviceName,
        this.config.loadBalancingStrategy
      );

      if (!serviceInstance) {
        throw new Error(`No healthy instances available for service: ${serviceName}`);
      }

      // Realizar request
      const response = await this.executeRequest(serviceInstance, request);
      
      // Registrar éxito
      this.recordSuccess(serviceName, Date.now() - startTime);
      
      return response;
    } catch (error) {
      // Registrar fallo
      this.recordFailure(serviceName);
      
      // Intentar retry si es posible
      if (this.shouldRetry(request)) {
        return this.retryRequest(request, startTime);
      }
      
      throw error;
    }
  }

  private async executeRequest(serviceInstance: ServiceInstance, request: ServiceRequest): Promise<ServiceResponse> {
    const url = `${serviceInstance.url}${request.path}`;
    const timeout = request.timeout || this.config.timeout;

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ServiceMesh/1.0',
        'X-Service-Mesh': 'true',
        'X-Source-Service': 'api',
        ...request.headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (request.body) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    const responseBody = await response.text();
    let parsedBody: any;
    
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }

    const serviceResponse: ServiceResponse = {
      status: response.status.toString(),
      headers: Object.fromEntries(Array.from(response.headers.entries())),
      body: parsedBody,
      duration,
    };

    // Logging con tracing si está habilitado
    if (this.config.enableTracing) {
      logger.info('Service mesh request completed', {
        serviceName: request.serviceName,
        serviceInstance: serviceInstance.id,
        method: request.method,
        path: request.path,
        status: response.status,
        duration,
        url: serviceInstance.url,
      });
    }

    return serviceResponse;
  }

  private async retryRequest(request: ServiceRequest, originalStartTime: number): Promise<ServiceResponse> {
    const maxRetries = request.retries || this.config.retries;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug('Retrying service request', {
          serviceName: request.serviceName,
          attempt,
          maxRetries,
        });

        const serviceInstance = serviceDiscovery.getLoadBalancedInstance(
          request.serviceName,
          this.config.loadBalancingStrategy
        );

        if (!serviceInstance) {
          throw new Error(`No healthy instances available for service: ${request.serviceName}`);
        }

        const response = await this.executeRequest(serviceInstance, request);
        this.recordSuccess(request.serviceName, Date.now() - originalStartTime);
        
        return response;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(request.serviceName);
        
        // Esperar antes del siguiente intento (backoff exponencial)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private isCircuitBreakerOpen(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!circuitBreaker) {
      return false;
    }

    if (circuitBreaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime.getTime();
      
      if (timeSinceLastFailure > circuitBreaker.timeout) {
        // Cambiar a half-open
        circuitBreaker.state = 'half-open';
        logger.info('Circuit breaker changed to half-open', { serviceName });
        return false;
      }
      
      return true;
    }

    return false;
  }

  private recordSuccess(serviceName: string, responseTime: number): void {
    // Actualizar circuit breaker
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker && circuitBreaker.state === 'half-open') {
      circuitBreaker.state = 'closed';
      circuitBreaker.failureCount = 0;
      logger.info('Circuit breaker closed', { serviceName });
    }

    // Actualizar estadísticas
    const stats = this.requestStats.get(serviceName) || { total: 0, success: 0, failed: 0, responseTimes: [] };
    stats.total++;
    stats.success++;
    stats.responseTimes.push(responseTime);
    
    // Mantener solo los últimos 100 tiempos de respuesta
    if (stats.responseTimes.length > 100) {
      stats.responseTimes.shift();
    }
    
    this.requestStats.set(serviceName, stats);
  }

  private recordFailure(serviceName: string): void {
    // Actualizar circuit breaker
    let circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!circuitBreaker) {
      circuitBreaker = {
        serviceName,
        failureCount: 0,
        lastFailureTime: new Date(),
        state: 'closed',
        threshold: this.config.circuitBreakerThreshold,
        timeout: this.config.circuitBreakerTimeout,
      };
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = new Date();

    if (circuitBreaker.state === 'half-open') {
      circuitBreaker.state = 'open';
      logger.warn('Circuit breaker opened (half-open failure)', { serviceName });
    } else if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
      circuitBreaker.state = 'open';
      logger.warn('Circuit breaker opened (threshold reached)', { 
        serviceName, 
        failureCount: circuitBreaker.failureCount,
        threshold: circuitBreaker.threshold 
      });
    }

    // Actualizar estadísticas
    const stats = this.requestStats.get(serviceName) || { total: 0, success: 0, failed: 0, responseTimes: [] };
    stats.total++;
    stats.failed++;
    this.requestStats.set(serviceName, stats);
  }

  private shouldRetry(request: ServiceRequest): boolean {
    const maxRetries = request.retries || this.config.retries;
    return maxRetries > 0;
  }

  getStats(): ServiceMeshStats {
    const allStats = Array.from(this.requestStats.values());
    const totalRequests = allStats.reduce((sum, stats) => sum + stats.total, 0);
    const successfulRequests = allStats.reduce((sum, stats) => sum + stats.success, 0);
    const failedRequests = allStats.reduce((sum, stats) => sum + stats.failed, 0);
    
    const allResponseTimes = allStats.flatMap(stats => stats.responseTimes);
    const averageResponseTime = allResponseTimes.length > 0 
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length 
      : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      circuitBreakers: Array.from(this.circuitBreakers.values()),
    };
  }

  getServiceStats(serviceName: string) {
    return this.requestStats.get(serviceName);
  }

  getCircuitBreaker(serviceName: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(serviceName);
  }

  resetCircuitBreaker(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.state = 'closed';
      circuitBreaker.failureCount = 0;
      logger.info('Circuit breaker manually reset', { serviceName });
      return true;
    }
    return false;
  }
}

// Configuración por defecto del Service Mesh
const defaultServiceMeshConfig: ServiceMeshConfig = {
  timeout: 30000, // 30 segundos
  retries: 3,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minuto
  loadBalancingStrategy: 'round-robin',
  enableTracing: true,
  enableMetrics: true,
};

export const serviceMesh = new ServiceMesh(defaultServiceMeshConfig);
