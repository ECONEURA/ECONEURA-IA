import { EventEmitter } from 'events';


export interface Resource {
  id: string;
  type: 'connection' | 'file' | 'memory' | 'cpu';
  allocated: number;
  maxAllocated: number;
  metadata: Record<string, any>;
}

export class ResourceManagementService extends EventEmitter {
  private resources: Map<string, Resource> = new Map();
  private limits: Map<string, number> = new Map();

  setLimit(type: string, limit: number): void {
    this.limits.set(type, limit);
  }

  allocateResource(id: string, type: string, amount: number, metadata: Record<string, any> = {}): boolean {
    const limit = this.limits.get(type);
    if (limit && amount > limit) {
      return false;
    }

    const resource: Resource = {
      id,
      type: type as any,
      allocated: amount,
      maxAllocated: limit || amount,
      metadata
    };

    this.resources.set(id, resource);
    this.emit('resource_allocated', resource);
    
    return true;
  }

  deallocateResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      this.resources.delete(id);
      this.emit('resource_deallocated', resource);
    }
  }

  getResourceUsage(type?: string): any {
    const resources = type ? 
      Array.from(this.resources.values()).filter(r => r.type === type) :
      Array.from(this.resources.values());

    return {
      total: resources.length,
      allocated: resources.reduce((sum, r) => sum + r.allocated, 0),
      maxAllocated: resources.reduce((sum, r) => sum + r.maxAllocated, 0),
      resources: resources.map(r => ({
        id: r.id,
        type: r.type,
        allocated: r.allocated,
        maxAllocated: r.maxAllocated
      }))
    };
  }

  cleanup(): void {
    for (const [id, resource] of this.resources) {
      this.deallocateResource(id);
    }
  }
}

export const resourceManagementService = new ResourceManagementService();
