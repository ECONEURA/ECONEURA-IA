import { logger } from './logger.js';
import { serviceDiscovery } from './service-discovery.js';
export class ServiceMesh {
    config;
    circuitBreakers = new Map();
    requestStats = new Map();
    constructor(config) {
        this.config = config;
        logger.info('Service Mesh initialized', { config });
    }
    async request(request) {
        const startTime = Date.now();
        const serviceName = request.serviceName;
        try {
            if (this.isCircuitBreakerOpen(serviceName)) {
                throw new Error(`Circuit breaker is open for service: ${serviceName}`);
            }
            const serviceInstance = serviceDiscovery.getLoadBalancedInstance(serviceName, this.config.loadBalancingStrategy);
            if (!serviceInstance) {
                throw new Error(`No healthy instances available for service: ${serviceName}`);
            }
            const response = await this.executeRequest(serviceInstance, request);
            this.recordSuccess(serviceName, Date.now() - startTime);
            return response;
        }
        catch (error) {
            this.recordFailure(serviceName);
            if (this.shouldRetry(request)) {
                return this.retryRequest(request, startTime);
            }
            throw error;
        }
    }
    async executeRequest(serviceInstance, request) {
        const url = `${serviceInstance.url}${request.path}`;
        const timeout = request.timeout || this.config.timeout;
        const fetchOptions = {
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
        let parsedBody;
        try {
            parsedBody = JSON.parse(responseBody);
        }
        catch {
            parsedBody = responseBody;
        }
        const serviceResponse = {
            status: response.status,
            headers: {},
            body: parsedBody,
            duration,
        };
        if (this.config.enableTracing) {
            logger.info('Service mesh request completed', {
                serviceName: request.serviceName,
                serviceInstance: serviceInstance.id,
                method: request.method,
                path: request.path,
                status: response.status.toString(),
                duration,
                url: serviceInstance.url,
            });
        }
        return serviceResponse;
    }
    async retryRequest(request, originalStartTime) {
        const maxRetries = request.retries || this.config.retries;
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug('Retrying service request', {
                    serviceName: request.serviceName,
                    attempt,
                    maxRetries,
                });
                const serviceInstance = serviceDiscovery.getLoadBalancedInstance(request.serviceName, this.config.loadBalancingStrategy);
                if (!serviceInstance) {
                    throw new Error(`No healthy instances available for service: ${request.serviceName}`);
                }
                const response = await this.executeRequest(serviceInstance, request);
                this.recordSuccess(request.serviceName, Date.now() - originalStartTime);
                return response;
            }
            catch (error) {
                lastError = error;
                this.recordFailure(request.serviceName);
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    isCircuitBreakerOpen(serviceName) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (!circuitBreaker) {
            return false;
        }
        if (circuitBreaker.state === 'open') {
            const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime.getTime();
            if (timeSinceLastFailure > circuitBreaker.timeout) {
                circuitBreaker.state = 'half-open';
                logger.info('Circuit breaker changed to half-open', { serviceName });
                return false;
            }
            return true;
        }
        return false;
    }
    recordSuccess(serviceName, responseTime) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (circuitBreaker && circuitBreaker.state === 'half-open') {
            circuitBreaker.state = 'closed';
            circuitBreaker.failureCount = 0;
            logger.info('Circuit breaker closed', { serviceName });
        }
        const stats = this.requestStats.get(serviceName) || { total: 0, success: 0, failed: 0, responseTimes: [] };
        stats.total++;
        stats.success++;
        stats.responseTimes.push(responseTime);
        if (stats.responseTimes.length > 100) {
            stats.responseTimes.shift();
        }
        this.requestStats.set(serviceName, stats);
    }
    recordFailure(serviceName) {
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
        }
        else if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
            circuitBreaker.state = 'open';
            logger.warn('Circuit breaker opened (threshold reached)', {
                serviceName,
                failureCount: circuitBreaker.failureCount,
                threshold: circuitBreaker.threshold
            });
        }
        const stats = this.requestStats.get(serviceName) || { total: 0, success: 0, failed: 0, responseTimes: [] };
        stats.total++;
        stats.failed++;
        this.requestStats.set(serviceName, stats);
    }
    shouldRetry(request) {
        const maxRetries = request.retries || this.config.retries;
        return maxRetries > 0;
    }
    getStats() {
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
    getServiceStats(serviceName) {
        return this.requestStats.get(serviceName);
    }
    getCircuitBreaker(serviceName) {
        return this.circuitBreakers.get(serviceName);
    }
    resetCircuitBreaker(serviceName) {
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
const defaultServiceMeshConfig = {
    timeout: 30000,
    retries: 3,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60000,
    loadBalancingStrategy: 'round-robin',
    enableTracing: true,
    enableMetrics: true,
};
export const serviceMesh = new ServiceMesh(defaultServiceMeshConfig);
//# sourceMappingURL=service-mesh.js.map