import { logger } from './logger.js';
export class InMemoryServiceRegistry {
    services = new Map();
    serviceIndex = new Map();
    heartbeatTimeouts = new Map();
    HEARTBEAT_TIMEOUT = 30000;
    register(service) {
        const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const serviceInstance = {
            ...service,
            id,
            lastHeartbeat: now,
            createdAt: now,
            updatedAt: now,
        };
        this.services.set(id, serviceInstance);
        if (!this.serviceIndex.has(service.name)) {
            this.serviceIndex.set(service.name, new Set());
        }
        this.serviceIndex.get(service.name).add(id);
        this.setupHeartbeatTimeout(id);
        logger.info('Service registered', {
            serviceId: id,
            serviceName: service.name,
            serviceUrl: service.url,
            version: service.version,
        });
        return id;
    }
    deregister(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            return false;
        }
        const nameIndex = this.serviceIndex.get(service.name);
        if (nameIndex) {
            nameIndex.delete(serviceId);
            if (nameIndex.size === 0) {
                this.serviceIndex.delete(service.name);
            }
        }
        const timeout = this.heartbeatTimeouts.get(serviceId);
        if (timeout) {
            clearTimeout(timeout);
            this.heartbeatTimeouts.delete(serviceId);
        }
        this.services.delete(serviceId);
        logger.info('Service deregistered', {
            serviceId,
            serviceName: service.name,
        });
        return true;
    }
    getService(serviceId) {
        return this.services.get(serviceId);
    }
    getServicesByName(name) {
        const serviceIds = this.serviceIndex.get(name);
        if (!serviceIds) {
            return [];
        }
        return Array.from(serviceIds)
            .map(id => this.services.get(id))
            .filter((service) => service !== undefined);
    }
    getAllServices() {
        return Array.from(this.services.values());
    }
    updateHealth(serviceId, health) {
        const service = this.services.get(serviceId);
        if (!service) {
            return false;
        }
        service.health = health;
        service.updatedAt = new Date();
        logger.debug('Service health updated', {
            serviceId,
            serviceName: service.name,
            health,
        });
        return true;
    }
    updateStatus(serviceId, status) {
        const service = this.services.get(serviceId);
        if (!service) {
            return false;
        }
        service.status = status;
        service.updatedAt = new Date();
        logger.debug('Service status updated', {
            serviceId,
            serviceName: service.name,
            status,
        });
        return true;
    }
    heartbeat(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            return false;
        }
        service.lastHeartbeat = new Date();
        service.updatedAt = new Date();
        this.setupHeartbeatTimeout(serviceId);
        logger.debug('Service heartbeat received', {
            serviceId,
            serviceName: service.name,
        });
        return true;
    }
    cleanup() {
        const now = new Date();
        const staleServices = [];
        for (const [serviceId, service] of this.services.entries()) {
            const timeSinceHeartbeat = now.getTime() - service.lastHeartbeat.getTime();
            if (timeSinceHeartbeat > this.HEARTBEAT_TIMEOUT * 2) {
                staleServices.push(serviceId);
            }
        }
        for (const serviceId of staleServices) {
            this.deregister(serviceId);
            logger.warn('Stale service removed during cleanup', { serviceId });
        }
    }
    setupHeartbeatTimeout(serviceId) {
        const existingTimeout = this.heartbeatTimeouts.get(serviceId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
            const service = this.services.get(serviceId);
            if (service) {
                this.updateHealth(serviceId, 'unhealthy');
                logger.warn('Service heartbeat timeout', {
                    serviceId,
                    serviceName: service.name,
                });
            }
        }, this.HEARTBEAT_TIMEOUT);
        this.heartbeatTimeouts.set(serviceId, timeout);
    }
}
export class ServiceDiscoveryImpl {
    registry;
    loadBalancerIndex = new Map();
    constructor(registry) {
        this.registry = registry;
    }
    discover(serviceName, filters) {
        let services = this.registry.getServicesByName(serviceName);
        if (filters) {
            services = this.applyFilters(services, filters);
        }
        return services;
    }
    discoverAll(filters) {
        let services = this.registry.getAllServices();
        if (filters) {
            services = this.applyFilters(services, filters);
        }
        return services;
    }
    getHealthyInstances(serviceName) {
        return this.discover(serviceName, { health: 'healthy', status: 'online' });
    }
    getLoadBalancedInstance(serviceName, strategy = 'round-robin') {
        const healthyInstances = this.getHealthyInstances(serviceName);
        if (healthyInstances.length === 0) {
            return null;
        }
        switch (strategy) {
            case 'round-robin':
                return this.roundRobinSelection(serviceName, healthyInstances);
            case 'least-connections':
                return this.leastConnectionsSelection(healthyInstances);
            case 'weighted':
                return this.weightedSelection(healthyInstances);
            case 'ip-hash':
                return this.ipHashSelection(healthyInstances);
            case 'random':
                return this.randomSelection(healthyInstances);
            default:
                return healthyInstances[0];
        }
    }
    applyFilters(services, filters) {
        return services.filter(service => {
            if (filters.version && service.version !== filters.version) {
                return false;
            }
            if (filters.environment && service.metadata.environment !== filters.environment) {
                return false;
            }
            if (filters.region && service.metadata.region !== filters.region) {
                return false;
            }
            if (filters.zone && service.metadata.zone !== filters.zone) {
                return false;
            }
            if (filters.health && service.health !== filters.health) {
                return false;
            }
            if (filters.status && service.status !== filters.status) {
                return false;
            }
            if (filters.tags && filters.tags.length > 0) {
                const hasAllTags = filters.tags.every(tag => service.metadata.tags.includes(tag));
                if (!hasAllTags) {
                    return false;
                }
            }
            if (filters.capabilities && filters.capabilities.length > 0) {
                const hasAllCapabilities = filters.capabilities.every(cap => service.metadata.capabilities.includes(cap));
                if (!hasAllCapabilities) {
                    return false;
                }
            }
            return true;
        });
    }
    roundRobinSelection(serviceName, instances) {
        const currentIndex = this.loadBalancerIndex.get(serviceName) || 0;
        const selectedInstance = instances[currentIndex % instances.length];
        this.loadBalancerIndex.set(serviceName, (currentIndex + 1) % instances.length);
        return selectedInstance;
    }
    leastConnectionsSelection(instances) {
        return instances.reduce((min, instance) => instance.metadata.load < min.metadata.load ? instance : min);
    }
    weightedSelection(instances) {
        const totalWeight = instances.reduce((sum, instance) => sum + (100 - instance.metadata.cpu), 0);
        let random = Math.random() * totalWeight;
        for (const instance of instances) {
            random -= (100 - instance.metadata.cpu);
            if (random <= 0) {
                return instance;
            }
        }
        return instances[0];
    }
    ipHashSelection(instances) {
        const clientIp = '127.0.0.1';
        const hash = clientIp.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);
        return instances[hash % instances.length];
    }
    randomSelection(instances) {
        const randomIndex = Math.floor(Math.random() * instances.length);
        return instances[randomIndex];
    }
}
export const serviceRegistry = new InMemoryServiceRegistry();
export const serviceDiscovery = new ServiceDiscoveryImpl(serviceRegistry);
setInterval(() => {
    serviceRegistry.cleanup();
}, 60000);
//# sourceMappingURL=service-discovery.js.map