import { Aggregate, Event, createEvent } from '../events.js';

export interface UserState {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserAggregate implements Aggregate {
  public id: string;
  public version: number = 0;
  private state: UserState | null = null;
  private uncommittedEvents: Event[] = [];

  constructor(id: string) {
    this.id = id;
  }

  // Command methods
  createUser(email: string, name: string, organizationId: string, userId?: string): void {
    if (this.state) {
      throw new Error('User already exists');
    }

    const event = createEvent(
      'UserCreated',
      this.id,
      'User',
      {
        email,
        name,
        organizationId,
      },
      {
        userId,
        organizationId,
      }
    );

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  updateUser(name: string, userId?: string): void {
    if (!this.state) {
      throw new Error('User does not exist');
    }

    if (this.state.name === name) {
      return; // No change needed
    }

    const event = createEvent(
      'UserUpdated',
      this.id,
      'User',
      {
        name,
        previousName: this.state.name,
      },
      {
        userId,
        organizationId: this.state.organizationId,
      }
    );

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  suspendUser(reason: string, userId?: string): void {
    if (!this.state) {
      throw new Error('User does not exist');
    }

    if (this.state.status === 'suspended') {
      return; // Already suspended
    }

    const event = createEvent(
      'UserSuspended',
      this.id,
      'User',
      {
        reason,
        previousStatus: this.state.status,
      },
      {
        userId,
        organizationId: this.state.organizationId,
      }
    );

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  activateUser(userId?: string): void {
    if (!this.state) {
      throw new Error('User does not exist');
    }

    if (this.state.status === 'active') {
      return; // Already active
    }

    const event = createEvent(
      'UserActivated',
      this.id,
      'User',
      {
        previousStatus: this.state.status,
      },
      {
        userId,
        organizationId: this.state.organizationId,
      }
    );

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  // Event application
  apply(event: Event): void {
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
        // Ignore unknown events
        break;
    }
  }

  // Aggregate interface implementation
  getUncommittedEvents(): Event[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  // Query methods
  getState(): UserState | null {
    return this.state ? { ...this.state } : null;
  }

  isActive(): boolean {
    return this.state?.status === 'active';
  }

  isSuspended(): boolean {
    return this.state?.status === 'suspended';
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.state?.organizationId === organizationId;
  }
}
