import { EventEmitter } from 'events';
export class ResourceManagementService extends EventEmitter {
    resources = new Map();
    limits = new Map();
    setLimit(type, limit) {
        this.limits.set(type, limit);
    }
    allocateResource(id, type, amount, metadata = {}) {
        const limit = this.limits.get(type);
        if (limit && amount > limit) {
            return false;
        }
        const resource = {
            id,
            type: type,
            allocated: amount,
            maxAllocated: limit || amount,
            metadata
        };
        this.resources.set(id, resource);
        this.emit('resource_allocated', resource);
        return true;
    }
    deallocateResource(id) {
        const resource = this.resources.get(id);
        if (resource) {
            this.resources.delete(id);
            this.emit('resource_deallocated', resource);
        }
    }
    getResourceUsage(type) {
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
    cleanup() {
        for (const [id, resource] of this.resources) {
            this.deallocateResource(id);
        }
    }
}
export const resourceManagementService = new ResourceManagementService();
//# sourceMappingURL=resource-management.service.js.map