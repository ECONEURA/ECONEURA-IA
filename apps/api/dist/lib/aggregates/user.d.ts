import { Aggregate, Event } from '../events.js';
export interface UserState {
    id: string;
    email: string;
    name: string;
    status: 'active' | 'inactive' | 'suspended';
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserAggregate implements Aggregate {
    id: string;
    version: number;
    private state;
    private uncommittedEvents;
    constructor(id: string);
    createUser(email: string, name: string, organizationId: string, userId?: string): void;
    updateUser(name: string, userId?: string): void;
    suspendUser(reason: string, userId?: string): void;
    activateUser(userId?: string): void;
    apply(event: Event): void;
    getUncommittedEvents(): Event[];
    markEventsAsCommitted(): void;
    getState(): UserState | null;
    isActive(): boolean;
    isSuspended(): boolean;
    belongsToOrganization(organizationId: string): boolean;
}
//# sourceMappingURL=user.d.ts.map