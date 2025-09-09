/**
 * Service Client for ECONEURA
 *
 * Handles communication between services with automatic service discovery,
 * load balancing, retry logic, and circuit breakers
 */

import { serviceDiscovery, ServiceInfo } from '../services/service-discovery.js';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ServiceClientConfig {
  serviceType: 'api' | 'workers' | 'web' | 'db';
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  circuitBreakerThreshold?: number;
  loadBalancing?: 'round-robin' | 'random' | 'least-connections';
}

export interface ServiceRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  serviceId: string;
  responseTime: number;
  retries: number;
}

export class ServiceClient {
  private config: Required<ServiceClientConfig>;
  private axiosInstances: Map<string, AxiosInstance> = new Map();
  private roundRobinIndex: Map<string, number> = new Map();
  private connectionCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();

  constructor(config: ServiceClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      loadBalancing: 'round-robin',
      ...config
    };
  }

  /**
   * Make a request to a service
   */
  async request<T = any>(request: ServiceRequest): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.config.retries) {
      try {
        const service = this.selectService();
        if (!service) {
          throw new Error(`No healthy ${this.config.serviceType} services available`);
        }

        // Check circuit breaker
        if (this.isCircuitBreakerOpen(service.id)) {
          throw new Error(`Circuit breaker open for service ${service.id}`);
        }

        const response = await this.makeRequest(service, request);
        const responseTime = Date.now() - startTime;

        // Reset circuit breaker on success
        this.resetCircuitBreaker(service.id);

        return {
          success: true,
          data: response.data,
          serviceId: service.id,
          responseTime,
          retries
        };

      } catch (error) {
        lastError = error as Error;
        retries++;

        // Record failure for circuit breaker
        if (error instanceof Error && error.message.includes('Circuit breaker')) {
          // Don't retry circuit breaker failures
          break;
        }

        if (retries <= this.config.retries) {
          await this.delay(this.config.retryDelay * retries);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      serviceId: 'unknown',
      responseTime,
      retries
    };
  }

  /**
   * Select a service using load balancing strategy
   */
  private selectService(): ServiceInfo | null {
    const healthyServices = serviceDiscovery.getHealthyServicesByType(this.config.serviceType);

    if (healthyServices.length === 0) {
      return null;
    }

    switch (this.config.loadBalancing) {
      case 'round-robin':
        return this.selectRoundRobin(healthyServices);
      case 'random':
        return this.selectRandom(healthyServices);
      case 'least-connections':
        return this.selectLeastConnections(healthyServices);
      default:
        return healthyServices[0];
    }
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(services: ServiceInfo[]): ServiceInfo {
    const key = this.config.serviceType;
    const currentIndex = this.roundRobinIndex.get(key) || 0;
    const selectedService = services[currentIndex % services.length];
    this.roundRobinIndex.set(key, currentIndex + 1);
    return selectedService;
  }

  /**
   * Random selection
   */
  private selectRandom(services: ServiceInfo[]): ServiceInfo {
    const randomIndex = Math.floor(Math.random() * services.length);
    return services[randomIndex];
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(services: ServiceInfo[]): ServiceInfo {
    return services.reduce((least, current) => {
      const leastConnections = this.connectionCounts.get(least.id) || 0;
      const currentConnections = this.connectionCounts.get(current.id) || 0;
      return currentConnections < leastConnections ? current : least;
    });
  }

  /**
   * Make HTTP request to service
   */
  private async makeRequest(service: ServiceInfo, request: ServiceRequest): Promise<AxiosResponse> {
    const axiosInstance = this.getAxiosInstance(service);
    const url = serviceDiscovery.getServiceUrl(service.id, request.endpoint);

    if (!url) {
      throw new Error(`Cannot construct URL for service ${service.id}`);
    }

    // Increment connection count
    this.incrementConnectionCount(service.id);

    try {
      const config: AxiosRequestConfig = {
        method: request.method,
        url,
        data: request.data,
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Client': 'econeura-service-client',
          'X-Request-ID': this.generateRequestId(),
          ...request.headers
        },
        params: request.params,
        timeout: this.config.timeout
      };

      const response = await axiosInstance.request(config);
      return response;

    } finally {
      // Decrement connection count
      this.decrementConnectionCount(service.id);
    }
  }

  /**
   * Get or create axios instance for service
   */
  private getAxiosInstance(service: ServiceInfo): AxiosInstance {
    if (!this.axiosInstances.has(service.id)) {
      const instance = axios.create({
        baseURL: serviceDiscovery.getServiceUrl(service.id),
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'ECONEURA-ServiceClient/1.0.0'
        }
      });

      // Add request interceptor
      instance.interceptors.request.use(
        (config) => {
          config.metadata = { startTime: Date.now() };
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Add response interceptor
      instance.interceptors.response.use(
        (response) => {
          const responseTime = Date.now() - response.config.metadata?.startTime;
          response.metadata = { responseTime };
          return response;
        },
        (error) => {
          const responseTime = Date.now() - error.config?.metadata?.startTime;
          error.metadata = { responseTime };
          return Promise.reject(error);
        }
      );

      this.axiosInstances.set(service.id, instance);
    }

    return this.axiosInstances.get(service.id)!;
  }

  /**
   * Circuit breaker logic
   */
  private isCircuitBreakerOpen(serviceId: string): boolean {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return false;

    if (breaker.isOpen) {
      // Check if enough time has passed to try again
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
      if (timeSinceLastFailure > 60000) { // 1 minute
        breaker.isOpen = false;
        breaker.failures = 0;
      }
    }

    return breaker.isOpen;
  }

  /**
   * Record circuit breaker failure
   */
  private recordFailure(serviceId: string): void {
    const breaker = this.circuitBreakers.get(serviceId) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false
    };

    breaker.failures++;
    breaker.lastFailure = new Date();

    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.isOpen = true;
    }

    this.circuitBreakers.set(serviceId, breaker);
  }

  /**
   * Reset circuit breaker
   */
  private resetCircuitBreaker(serviceId: string): void {
    const breaker = this.circuitBreakers.get(serviceId);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  /**
   * Connection count management
   */
  private incrementConnectionCount(serviceId: string): void {
    const count = this.connectionCounts.get(serviceId) || 0;
    this.connectionCounts.set(serviceId, count + 1);
  }

  private decrementConnectionCount(serviceId: string): void {
    const count = this.connectionCounts.get(serviceId) || 0;
    this.connectionCounts.set(serviceId, Math.max(0, count - 1));
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service statistics
   */
  getStats(): {
    serviceType: string;
    availableServices: number;
    circuitBreakers: Record<string, any>;
    connectionCounts: Record<string, number>;
  } {
    const healthyServices = serviceDiscovery.getHealthyServicesByType(this.config.serviceType);

    return {
      serviceType: this.config.serviceType,
      availableServices: healthyServices.length,
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      connectionCounts: Object.fromEntries(this.connectionCounts)
    };
  }
}

// Factory function for creating service clients
export function createServiceClient(config: ServiceClientConfig): ServiceClient {
  return new ServiceClient(config);
}
