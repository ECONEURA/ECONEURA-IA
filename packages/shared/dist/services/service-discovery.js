import { EventEmitter } from 'events';
export class ServiceDiscovery extends EventEmitter {
    services = new Map();
    endpoints = new Map();
    healthCheckInterval = null;
    heartbeatInterval = null;
    constructor() {
        super();
        this.startHealthChecks();
        this.startHeartbeat();
    }
    registerService(serviceInfo) {
        this.services.set(serviceInfo.id, {
            ...serviceInfo,
            lastHeartbeat: new Date()
        });
        this.emit('serviceRegistered', serviceInfo);
    }
    unregisterService(serviceId) {
        const service = this.services.get(serviceId);
        if (service) {
            this.services.delete(serviceId);
            this.endpoints.delete(serviceId);
            this.emit('serviceUnregistered', service);
        }
    }
    updateHeartbeat(serviceId) {
        const service = this.services.get(serviceId);
        if (service) {
            service.lastHeartbeat = new Date();
            service.status = 'healthy';
        }
    }
    getService(serviceId) {
        return this.services.get(serviceId);
    }
    getServicesByType(type) {
        return Array.from(this.services.values()).filter(service => service.type === type);
    }
    getHealthyServicesByType(type) {
        return this.getServicesByType(type).filter(service => service.status === 'healthy');
    }
    registerEndpoints(serviceId, endpoints) {
        this.endpoints.set(serviceId, endpoints);
        this.emit('endpointsRegistered', { serviceId, endpoints });
    }
    getServiceEndpoints(serviceId) {
        return this.endpoints.get(serviceId) || [];
    }
    findEndpointByDescription(description) {
        for (const endpoints of this.endpoints.values()) {
            const endpoint = endpoints.find(ep => ep.description === description);
            if (endpoint)
                return endpoint;
        }
        return undefined;
    }
    getServiceUrl(serviceId, path = '') {
        const service = this.services.get(serviceId);
        if (!service || service.status !== 'healthy') {
            return null;
        }
        const protocol = service.port === 443 ? 'https' : 'http';
        return `${protocol}://${service.host}:${service.port}${path}`;
    }
    startHealthChecks() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, 30000);
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.emitHeartbeat();
        }, 10000);
    }
    async performHealthChecks() {
        const services = Array.from(this.services.values());
        for (const service of services) {
            try {
                const isHealthy = await this.checkServiceHealth(service);
                const previousStatus = service.status;
                service.status = isHealthy ? 'healthy' : 'unhealthy';
                if (previousStatus !== service.status) {
                    this.emit('serviceStatusChanged', {
                        service,
                        previousStatus,
                        newStatus: service.status
                    });
                }
            }
            catch (error) {
                console.error(`Health check failed for ${service.name}:`, error);
                service.status = 'unhealthy';
            }
        }
    }
    async checkServiceHealth(service) {
        try {
            const url = this.getServiceUrl(service.id, '/health');
            if (!url)
                return false;
            const response = await fetch(url, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    emitHeartbeat() {
        this.emit('heartbeat', {
            timestamp: new Date(),
            servicesCount: this.services.size,
            healthyServices: Array.from(this.services.values()).filter(s => s.status === 'healthy').length
        });
    }
    getStats() {
        const services = Array.from(this.services.values());
        const healthyServices = services.filter(s => s.status === 'healthy').length;
        const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
        const servicesByType = services.reduce((acc, service) => {
            acc[service.type] = (acc[service.type] || 0) + 1;
            return acc;
        }, {});
        return {
            totalServices: services.length,
            healthyServices,
            unhealthyServices,
            servicesByType
        };
    }
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.removeAllListeners();
    }
}
export const serviceDiscovery = new ServiceDiscovery();
//# sourceMappingURL=service-discovery.js.map