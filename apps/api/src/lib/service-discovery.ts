import { logger } from './logger.js';

export interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  url: string;
  health: 'healthy' | 'unhealthy' | 'degraded';
  status: 'online' | 'offline' | 'maintenance';
  metadata: ServiceMetadata;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceMetadata {
  environment: string;
  region: string;
  zone: string;
  tags: string[];
  capabilities: string[];
  load: number;
  memory: number;
  cpu: number;
  endpoints: ServiceEndpoint[];
}

export interface ServiceEndpoint {
  path: string;
  method: string;
  description: string;
  version: string;
  deprecated: boolean;
}

export interface ServiceRegistry {
  register(service: Omit<ServiceInstance, 'id' | 'lastHeartbeat' | 'createdAt' | 'updatedAt'>): string;
  deregister(serviceId: string): boolean;
  getService(serviceId: string): ServiceInstance | undefined;
  getServicesByName(name: string): ServiceInstance[];
  getAllServices(): ServiceInstance[];
  updateHealth(serviceId: string, health: ServiceInstance['health']): boolean;
  updateStatus(serviceId: string, status: ServiceInstance['status']): boolean;
  heartbeat(serviceId: string): boolean;
  cleanup(): void;
}

export interface ServiceDiscovery {
  discover(serviceName: string, filters?: ServiceFilters): ServiceInstance[];
  discoverAll(filters?: ServiceFilters): ServiceInstance[];
  getHealthyInstances(serviceName: string): ServiceInstance[];
  getLoadBalancedInstance(serviceName: string, strategy?: LoadBalancingStrategy): ServiceInstance | null;
}

export interface ServiceFilters {
  version?: string;
  environment?: string;
  region?: string;
  zone?: string;
  tags?: string[];
  capabilities?: string[];
  health?: ServiceInstance['health'];
  status?: ServiceInstance['status'];
}

export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';

export class InMemoryServiceRegistry implements ServiceRegistry {
  private services: Map<string, ServiceInstance> = new Map();
  private serviceIndex: Map<string, Set<string>> = new Map();
  private heartbeatTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly HEARTBEAT_TIMEOUT = 30000; // 30 segundos

  register(service: Omit<ServiceInstance, 'id' | 'lastHeartbeat' | 'createdAt' | 'updatedAt'>): string {
    const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const serviceInstance: ServiceInstance = {
      ...service,
      id,
      lastHeartbeat: now,
      createdAt: now,
      updatedAt: now,
    };

    this.services.set(id, serviceInstance);
    
    // Indexar por nombre
    if (!this.serviceIndex.has(service.name)) {
      this.serviceIndex.set(service.name, new Set());
    }
    this.serviceIndex.get(service.name)!.add(id);

    // Configurar heartbeat timeout
    this.setupHeartbeatTimeout(id);

    logger.info('Service registered', {
      serviceId: id,
      serviceName: service.name,
      serviceUrl: service.url,
      version: service.version,
    });

    return id;
  }

  deregister(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) {
      return false;
    }

    // Remover del índice
    const nameIndex = this.serviceIndex.get(service.name);
    if (nameIndex) {
      nameIndex.delete(serviceId);
      if (nameIndex.size === 0) {
        this.serviceIndex.delete(service.name);
      }
    }

    // Limpiar heartbeat timeout
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

  getService(serviceId: string): ServiceInstance | undefined {
    return this.services.get(serviceId);
  }

  getServicesByName(name: string): ServiceInstance[] {
    const serviceIds = this.serviceIndex.get(name);
    if (!serviceIds) {
      return [];
    }

    return Array.from(serviceIds)
      .map(id => this.services.get(id))
      .filter((service): service is ServiceInstance => service !== undefined);
  }

  getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values());
  }

  updateHealth(serviceId: string, health: ServiceInstance['health']): boolean {
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

  updateStatus(serviceId: string, status: ServiceInstance['status']): boolean {
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

  heartbeat(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    if (!service) {
      return false;
    }

    service.lastHeartbeat = new Date();
    service.updatedAt = new Date();

    // Reiniciar heartbeat timeout
    this.setupHeartbeatTimeout(serviceId);

    logger.debug('Service heartbeat received', {
      serviceId,
      serviceName: service.name,
    });

    return true;
  }

  cleanup(): void {
    const now = new Date();
    const staleServices: string[] = [];

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

  private setupHeartbeatTimeout(serviceId: string): void {
    // Limpiar timeout existente
    const existingTimeout = this.heartbeatTimeouts.get(serviceId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Configurar nuevo timeout
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

export class ServiceDiscoveryImpl implements ServiceDiscovery {
  private registry: ServiceRegistry;
  private loadBalancerIndex: Map<string, number> = new Map();

  constructor(registry: ServiceRegistry) {
    this.registry = registry;
  }

  discover(serviceName: string, filters?: ServiceFilters): ServiceInstance[] {
    let services = this.registry.getServicesByName(serviceName);

    if (filters) {
      services = this.applyFilters(services, filters);
    }

    return services;
  }

  discoverAll(filters?: ServiceFilters): ServiceInstance[] {
    let services = this.registry.getAllServices();

    if (filters) {
      services = this.applyFilters(services, filters);
    }

    return services;
  }

  getHealthyInstances(serviceName: string): ServiceInstance[] {
    return this.discover(serviceName, { health: 'healthy', status: 'online' });
  }

  getLoadBalancedInstance(serviceName: string, strategy: LoadBalancingStrategy = 'round-robin'): ServiceInstance | null {
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

  private applyFilters(services: ServiceInstance[], filters: ServiceFilters): ServiceInstance[] {
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

  private roundRobinSelection(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const currentIndex = this.loadBalancerIndex.get(serviceName) || 0;
    const selectedInstance = instances[currentIndex % instances.length];
    
    this.loadBalancerIndex.set(serviceName, (currentIndex + 1) % instances.length);
    
    return selectedInstance;
  }

  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, instance) => 
      instance.metadata.load < min.metadata.load ? instance : min
    );
  }

  private weightedSelection(instances: ServiceInstance[]): ServiceInstance {
    // Usar CPU como peso (menor CPU = mayor peso)
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

  private ipHashSelection(instances: ServiceInstance[]): ServiceInstance {
    // Simular IP del cliente (en implementación real vendría del request)
    const clientIp = '127.0.0.1';
    const hash = clientIp.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);
    return instances[hash % instances.length];
  }

  private randomSelection(instances: ServiceInstance[]): ServiceInstance {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }
}

// Instancias globales
export const serviceRegistry = new InMemoryServiceRegistry();
export const serviceDiscovery = new ServiceDiscoveryImpl(serviceRegistry);

// Configurar cleanup automático
setInterval(() => {
  serviceRegistry.cleanup();
}, 60000); // Cada minuto
