import { EventEmitter } from 'events';
export interface Resource {
    id: string;
    type: 'connection' | 'file' | 'memory' | 'cpu';
    allocated: number;
    maxAllocated: number;
    metadata: Record<string, any>;
}
export declare class ResourceManagementService extends EventEmitter {
    private resources;
    private limits;
    setLimit(type: string, limit: number): void;
    allocateResource(id: string, type: string, amount: number, metadata?: Record<string, any>): boolean;
    deallocateResource(id: string): void;
    getResourceUsage(type?: string): any;
    cleanup(): void;
}
export declare const resourceManagementService: ResourceManagementService;
//# sourceMappingURL=resource-management.service.d.ts.map