import { serviceDiscovery } from '../services/service-discovery.js';
import axios from 'axios';
export class ServiceClient {
    config;
    axiosInstances = new Map();
    roundRobinIndex = new Map();
    connectionCounts = new Map();
    circuitBreakers = new Map();
    constructor(config) {
        this.config = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            circuitBreakerThreshold: 5,
            loadBalancing: 'round-robin',
            ...config
        };
    }
    async request(request) {
        const startTime = Date.now();
        let retries = 0;
        let lastError = null;
        while (retries <= this.config.retries) {
            try {
                const service = this.selectService();
                if (!service) {
                    throw new Error(`No healthy ${this.config.serviceType} services available`);
                }
                if (this.isCircuitBreakerOpen(service.id)) {
                    throw new Error(`Circuit breaker open for service ${service.id}`);
                }
                const response = await this.makeRequest(service, request);
                const responseTime = Date.now() - startTime;
                this.resetCircuitBreaker(service.id);
                return {
                    success: true,
                    data: response.data,
                    serviceId: service.id,
                    responseTime,
                    retries
                };
            }
            catch (error) {
                lastError = error;
                retries++;
                if (error instanceof Error && error.message.includes('Circuit breaker')) {
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
    selectService() {
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
    selectRoundRobin(services) {
        const key = this.config.serviceType;
        const currentIndex = this.roundRobinIndex.get(key) || 0;
        const selectedService = services[currentIndex % services.length];
        this.roundRobinIndex.set(key, currentIndex + 1);
        return selectedService;
    }
    selectRandom(services) {
        const randomIndex = Math.floor(Math.random() * services.length);
        return services[randomIndex];
    }
    selectLeastConnections(services) {
        return services.reduce((least, current) => {
            const leastConnections = this.connectionCounts.get(least.id) || 0;
            const currentConnections = this.connectionCounts.get(current.id) || 0;
            return currentConnections < leastConnections ? current : least;
        });
    }
    async makeRequest(service, request) {
        const axiosInstance = this.getAxiosInstance(service);
        const url = serviceDiscovery.getServiceUrl(service.id, request.endpoint);
        if (!url) {
            throw new Error(`Cannot construct URL for service ${service.id}`);
        }
        this.incrementConnectionCount(service.id);
        try {
            const config = {
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
        }
        finally {
            this.decrementConnectionCount(service.id);
        }
    }
    getAxiosInstance(service) {
        if (!this.axiosInstances.has(service.id)) {
            const instance = axios.create({
                baseURL: serviceDiscovery.getServiceUrl(service.id),
                timeout: this.config.timeout,
                headers: {
                    'User-Agent': 'ECONEURA-ServiceClient/1.0.0'
                }
            });
            instance.interceptors.request.use((config) => {
                config.metadata = { startTime: Date.now() };
                return config;
            }, (error) => Promise.reject(error));
            instance.interceptors.response.use((response) => {
                const responseTime = Date.now() - response.config.metadata?.startTime;
                response.metadata = { responseTime };
                return response;
            }, (error) => {
                const responseTime = Date.now() - error.config?.metadata?.startTime;
                error.metadata = { responseTime };
                return Promise.reject(error);
            });
            this.axiosInstances.set(service.id, instance);
        }
        return this.axiosInstances.get(service.id);
    }
    isCircuitBreakerOpen(serviceId) {
        const breaker = this.circuitBreakers.get(serviceId);
        if (!breaker)
            return false;
        if (breaker.isOpen) {
            const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
            if (timeSinceLastFailure > 60000) {
                breaker.isOpen = false;
                breaker.failures = 0;
            }
        }
        return breaker.isOpen;
    }
    recordFailure(serviceId) {
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
    resetCircuitBreaker(serviceId) {
        const breaker = this.circuitBreakers.get(serviceId);
        if (breaker) {
            breaker.failures = 0;
            breaker.isOpen = false;
        }
    }
    incrementConnectionCount(serviceId) {
        const count = this.connectionCounts.get(serviceId) || 0;
        this.connectionCounts.set(serviceId, count + 1);
    }
    decrementConnectionCount(serviceId) {
        const count = this.connectionCounts.get(serviceId) || 0;
        this.connectionCounts.set(serviceId, Math.max(0, count - 1));
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getStats() {
        const healthyServices = serviceDiscovery.getHealthyServicesByType(this.config.serviceType);
        return {
            serviceType: this.config.serviceType,
            availableServices: healthyServices.length,
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            connectionCounts: Object.fromEntries(this.connectionCounts)
        };
    }
}
export function createServiceClient(config) {
    return new ServiceClient(config);
}
//# sourceMappingURL=service-client.js.map