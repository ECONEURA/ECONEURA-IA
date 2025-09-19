import { logger } from './logger.js';
export class APIGateway {
    services = new Map();
    routes = new Map();
    loadBalancerConfig;
    currentIndex = 0;
    requestCounts = new Map();
    responseTimes = new Map();
    errorCounts = new Map();
    constructor(config) {
        this.loadBalancerConfig = config;
        logger.info('API Gateway initialized', { config });
        this.initializeDefaultServices();
        this.initializeDefaultRoutes();
        this.startHealthChecks();
    }
    addService(service) {
        const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const serviceEndpoint = {
            ...service,
            id,
            lastHealthCheck: new Date(),
            currentConnections: 0,
            responseTime: 0,
            errorRate: 0,
        };
        this.services.set(id, serviceEndpoint);
        this.requestCounts.set(id, 0);
        this.responseTimes.set(id, []);
        this.errorCounts.set(id, 0);
        logger.info('Service added to gateway', {
            serviceId: id,
            name: service.name,
            url: service.url,
        });
        return id;
    }
    removeService(serviceId) {
        const deleted = this.services.delete(serviceId);
        if (deleted) {
            this.requestCounts.delete(serviceId);
            this.responseTimes.delete(serviceId);
            this.errorCounts.delete(serviceId);
            logger.info('Service removed from gateway', { serviceId });
        }
        return deleted;
    }
    getService(serviceId) {
        return this.services.get(serviceId);
    }
    getAllServices() {
        return Array.from(this.services.values());
    }
    addRoute(routeData) {
        const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const route = {
            ...routeData,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.routes.set(id, route);
        logger.info('Route added to gateway', {
            routeId: id,
            name: route.name,
            path: route.path,
            method: route.method,
            serviceId: route.serviceId,
        });
        return id;
    }
    removeRoute(routeId) {
        const deleted = this.routes.delete(routeId);
        if (deleted) {
            logger.info('Route removed from gateway', { routeId });
        }
        return deleted;
    }
    getRoute(routeId) {
        return this.routes.get(routeId);
    }
    getAllRoutes() {
        return Array.from(this.routes.values());
    }
    findRoute(path, method, headers = {}, query = {}) {
        const matchingRoutes = [];
        for (const route of this.routes.values()) {
            if (!route.isActive)
                continue;
            if (this.matchesPath(route.path, path) && route.method.toUpperCase() === method.toUpperCase()) {
                if (this.matchesConditions(route.conditions, headers, query)) {
                    matchingRoutes.push(route);
                }
            }
        }
        if (matchingRoutes.length === 0) {
            return null;
        }
        matchingRoutes.sort((a, b) => b.priority - a.priority);
        return matchingRoutes[0];
    }
    selectService(serviceIds, clientIp) {
        const availableServices = serviceIds
            .map(id => this.services.get(id))
            .filter(service => service && service.isActive && service.health === 'healthy');
        if (availableServices.length === 0) {
            return null;
        }
        switch (this.loadBalancerConfig.strategy) {
            case 'round-robin':
                return this.roundRobinSelection(availableServices.filter(Boolean));
            case 'least-connections':
                return this.leastConnectionsSelection(availableServices.filter(Boolean));
            case 'weighted':
                return this.weightedSelection(availableServices.filter(Boolean));
            case 'ip-hash':
                return this.ipHashSelection(availableServices.filter(Boolean), clientIp);
            case 'response-time':
                return this.responseTimeSelection(availableServices.filter(Boolean));
            default:
                return availableServices[0] || null;
        }
    }
    roundRobinSelection(services) {
        const service = services[this.currentIndex % services.length];
        this.currentIndex = (this.currentIndex + 1) % services.length;
        return service;
    }
    leastConnectionsSelection(services) {
        return services.reduce((min, service) => service.currentConnections < min.currentConnections ? service : min);
    }
    weightedSelection(services) {
        const totalWeight = services.reduce((sum, service) => sum + service.weight, 0);
        let random = Math.random() * totalWeight;
        for (const service of services) {
            random -= service.weight;
            if (random <= 0) {
                return service;
            }
        }
        return services[0];
    }
    ipHashSelection(services, clientIp) {
        if (!clientIp) {
            return services[0];
        }
        const hash = clientIp.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);
        return services[hash % services.length];
    }
    responseTimeSelection(services) {
        return services.reduce((min, service) => service.responseTime < min.responseTime ? service : min);
    }
    async startHealthChecks() {
        setInterval(async () => {
            for (const service of this.services.values()) {
                await this.checkServiceHealth(service);
            }
        }, this.loadBalancerConfig.healthCheckInterval);
    }
    async checkServiceHealth(service) {
        try {
            const startTime = Date.now();
            const response = await fetch(`${service.url}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.loadBalancerConfig.healthCheckTimeout),
            });
            const responseTime = Date.now() - startTime;
            const isHealthy = response.ok;
            service.health = isHealthy ? 'healthy' : 'unhealthy';
            service.responseTime = responseTime;
            service.lastHealthCheck = new Date();
            if (!isHealthy) {
                service.errorRate = Math.min(service.errorRate + 0.1, 1.0);
            }
            else {
                service.errorRate = Math.max(service.errorRate - 0.05, 0.0);
            }
            logger.debug('Service health check completed', {
                serviceId: service.id,
                name: service.name,
                health: service.health,
                responseTime,
                errorRate: service.errorRate,
            });
        }
        catch (error) {
            service.health = 'unhealthy';
            service.errorRate = Math.min(service.errorRate + 0.2, 1.0);
            service.lastHealthCheck = new Date();
            logger.warn('Service health check failed', {
                serviceId: service.id,
                name: service.name,
                error: error.message,
            });
        }
    }
    matchesPath(routePath, requestPath) {
        if (routePath === requestPath) {
            return true;
        }
        const routeSegments = routePath.split('/');
        const requestSegments = requestPath.split('/');
        if (routeSegments.length !== requestSegments.length) {
            return false;
        }
        for (let i = 0; i < routeSegments.length; i++) {
            if (routeSegments[i].startsWith(':')) {
                continue;
            }
            if (routeSegments[i] !== requestSegments[i]) {
                return false;
            }
        }
        return true;
    }
    matchesConditions(conditions, headers, query) {
        if (conditions.length === 0) {
            return true;
        }
        return conditions.every(condition => {
            let value;
            switch (condition.type) {
                case 'header':
                    value = headers[condition.field.toLowerCase()];
                    break;
                case 'query':
                    value = query[condition.field];
                    break;
                default:
                    return true;
            }
            if (!value) {
                return false;
            }
            switch (condition.operator) {
                case 'equals':
                    return value === condition.value;
                case 'contains':
                    return value.includes(condition.value);
                case 'starts_with':
                    return value.startsWith(condition.value);
                case 'ends_with':
                    return value.endsWith(condition.value);
                case 'regex':
                    try {
                        const regex = new RegExp(condition.value);
                        return regex.test(value);
                    }
                    catch {
                        return false;
                    }
                default:
                    return false;
            }
        });
    }
    recordRequest(serviceId, responseTime, success) {
        const currentCount = this.requestCounts.get(serviceId) || 0;
        this.requestCounts.set(serviceId, currentCount + 1);
        const responseTimes = this.responseTimes.get(serviceId) || [];
        responseTimes.push(responseTime);
        if (responseTimes.length > 100) {
            responseTimes.shift();
        }
        this.responseTimes.set(serviceId, responseTimes);
        if (!success) {
            const errorCount = this.errorCounts.get(serviceId) || 0;
            this.errorCounts.set(serviceId, errorCount + 1);
        }
    }
    getStats() {
        const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0);
        const activeConnections = Array.from(this.services.values()).reduce((sum, service) => sum + service.currentConnections, 0);
        const allResponseTimes = Array.from(this.responseTimes.values()).flat();
        const averageResponseTime = allResponseTimes.length > 0
            ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
            : 0;
        const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
        const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
        return {
            totalRequests,
            activeConnections,
            averageResponseTime,
            errorRate,
            servicesCount: this.services.size,
            routesCount: this.routes.size,
        };
    }
    initializeDefaultServices() {
        const isCI = process.env.CI === 'true' || process.env.DEPLOY_ENABLED === 'false';
        const defaultServices = [];
        defaultServices.push({
            name: 'API Express',
            url: 'http://localhost:3001',
            health: 'healthy',
            weight: 1,
            maxConnections: 1000,
            isActive: true,
        });
        if (!isCI) {
            defaultServices.push({
                name: 'Web BFF',
                url: 'http://localhost:3000',
                health: 'healthy',
                weight: 1,
                maxConnections: 500,
                isActive: true,
            });
        }
        for (const serviceData of defaultServices) {
            this.addService(serviceData);
        }
    }
    initializeDefaultRoutes() {
        const services = Array.from(this.services.values());
        const apiExpressService = services.find(s => s.name === 'API Express');
        const webBffService = services.find(s => s.name === 'Web BFF');
        if (!apiExpressService) {
            logger.error('API Express service not found during route initialization');
            return;
        }
        const defaultRoutes = [
            {
                name: 'API AI Chat',
                path: '/v1/ai/chat',
                method: 'POST',
                serviceId: apiExpressService.id,
                priority: 90,
                conditions: [],
                isActive: true,
            },
        ];
        if (webBffService) {
            defaultRoutes.push({
                name: 'Web Dashboard',
                path: '/dashboard',
                method: 'GET',
                serviceId: webBffService.id,
                priority: 80,
                conditions: [],
                isActive: true,
            });
        }
        for (const routeData of defaultRoutes) {
            this.addRoute(routeData);
        }
    }
}
const defaultLoadBalancerConfig = {
    strategy: 'round-robin',
    healthCheckInterval: 30000,
    healthCheckTimeout: 5000,
    maxRetries: 3,
    circuitBreakerThreshold: 0.5,
};
export const apiGateway = new APIGateway(defaultLoadBalancerConfig);
//# sourceMappingURL=gateway.js.map