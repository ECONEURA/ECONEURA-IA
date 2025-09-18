import { EventEmitter } from 'events';
export interface ServiceInfo {
    id: string;
    name: string;
    type: 'api' | 'workers' | 'web' | 'db';
    host: string;
    port: number;
    version: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastHeartbeat: Date;
    metadata: Record<string, any>;
}
export interface ServiceEndpoint {
    serviceId: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    requiresAuth: boolean;
}
export declare class ServiceDiscovery extends EventEmitter {
    private services;
    private endpoints;
    private healthCheckInterval;
    private heartbeatInterval;
    constructor();
    registerService(serviceInfo: ServiceInfo): void;
    unregisterService(serviceId: string): void;
    updateHeartbeat(serviceId: string): void;
    getService(serviceId: string): ServiceInfo | undefined;
    getServicesByType(type: ServiceInfo['type']): ServiceInfo[];
    getHealthyServicesByType(type: ServiceInfo['type']): ServiceInfo[];
    registerEndpoints(serviceId: string, endpoints: ServiceEndpoint[]): void;
    getServiceEndpoints(serviceId: string): ServiceEndpoint[];
    findEndpointByDescription(description: string): ServiceEndpoint | undefined;
    getServiceUrl(serviceId: string, path?: string): string | null;
    private startHealthChecks;
    private startHeartbeat;
    private performHealthChecks;
    private checkServiceHealth;
    private emitHeartbeat;
    getStats(): {
        totalServices: number;
        healthyServices: number;
        unhealthyServices: number;
        servicesByType: Record<string, number>;
    };
    destroy(): void;
}
export declare const serviceDiscovery: ServiceDiscovery;
//# sourceMappingURL=service-discovery.d.ts.map