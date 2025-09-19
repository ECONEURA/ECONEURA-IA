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
export declare class InMemoryServiceRegistry implements ServiceRegistry {
    private services;
    private serviceIndex;
    private heartbeatTimeouts;
    private readonly HEARTBEAT_TIMEOUT;
    register(service: Omit<ServiceInstance, 'id' | 'lastHeartbeat' | 'createdAt' | 'updatedAt'>): string;
    deregister(serviceId: string): boolean;
    getService(serviceId: string): ServiceInstance | undefined;
    getServicesByName(name: string): ServiceInstance[];
    getAllServices(): ServiceInstance[];
    updateHealth(serviceId: string, health: ServiceInstance['health']): boolean;
    updateStatus(serviceId: string, status: ServiceInstance['status']): boolean;
    heartbeat(serviceId: string): boolean;
    cleanup(): void;
    private setupHeartbeatTimeout;
}
export declare class ServiceDiscoveryImpl implements ServiceDiscovery {
    private registry;
    private loadBalancerIndex;
    constructor(registry: ServiceRegistry);
    discover(serviceName: string, filters?: ServiceFilters): ServiceInstance[];
    discoverAll(filters?: ServiceFilters): ServiceInstance[];
    getHealthyInstances(serviceName: string): ServiceInstance[];
    getLoadBalancedInstance(serviceName: string, strategy?: LoadBalancingStrategy): ServiceInstance | null;
    private applyFilters;
    private roundRobinSelection;
    private leastConnectionsSelection;
    private weightedSelection;
    private ipHashSelection;
    private randomSelection;
}
export declare const serviceRegistry: InMemoryServiceRegistry;
export declare const serviceDiscovery: ServiceDiscoveryImpl;
//# sourceMappingURL=service-discovery.d.ts.map