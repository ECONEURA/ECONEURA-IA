import { createEvent } from '../events.js';
export class UserAggregate {
    id;
    version = 0;
    state = null;
    uncommittedEvents = [];
    constructor(id) {
        this.id = id;
    }
    createUser(email, name, organizationId, userId) {
        if (this.state) {
            throw new Error('User already exists');
        }
        const event = createEvent('UserCreated', this.id, 'User', {
            email,
            name,
            organizationId,
        }, {
            userId,
            organizationId,
        });
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    updateUser(name, userId) {
        if (!this.state) {
            throw new Error('User does not exist');
        }
        if (this.state.name === name) {
            return;
        }
        const event = createEvent('UserUpdated', this.id, 'User', {
            name,
            previousName: this.state.name,
        }, {
            userId,
            organizationId: this.state.organizationId,
        });
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    suspendUser(reason, userId) {
        if (!this.state) {
            throw new Error('User does not exist');
        }
        if (this.state.status === 'suspended') {
            return;
        }
        const event = createEvent('UserSuspended', this.id, 'User', {
            reason,
            previousStatus: this.state.status,
        }, {
            userId,
            organizationId: this.state.organizationId,
        });
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    activateUser(userId) {
        if (!this.state) {
            throw new Error('User does not exist');
        }
        if (this.state.status === 'active') {
            return;
        }
        const event = createEvent('UserActivated', this.id, 'User', {
            previousStatus: this.state.status,
        }, {
            userId,
            organizationId: this.state.organizationId,
        });
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    apply(event) {
        this.version++;
        switch (event.type) {
            case 'UserCreated':
                this.state = {
                    id: this.id,
                    email: event.data.email,
                    name: event.data.name,
                    status: 'active',
                    organizationId: event.data.organizationId,
                    createdAt: event.timestamp,
                    updatedAt: event.timestamp,
                };
                break;
            case 'UserUpdated':
                if (this.state) {
                    this.state.name = event.data.name;
                    this.state.updatedAt = event.timestamp;
                }
                break;
            case 'UserSuspended':
                if (this.state) {
                    this.state.status = 'suspended';
                    this.state.updatedAt = event.timestamp;
                }
                break;
            case 'UserActivated':
                if (this.state) {
                    this.state.status = 'active';
                    this.state.updatedAt = event.timestamp;
                }
                break;
            default:
                break;
        }
    }
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
    getState() {
        return this.state ? { ...this.state } : null;
    }
    isActive() {
        return this.state?.status === 'active';
    }
    isSuspended() {
        return this.state?.status === 'suspended';
    }
    belongsToOrganization(organizationId) {
        return this.state?.organizationId === organizationId;
    }
}
//# sourceMappingURL=user.js.map