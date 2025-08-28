/**
 * Sistema de eventos y monitoreo para el SDK
 */

export type EventType = 
  | 'request.start'
  | 'request.end'
  | 'request.error'
  | 'cache.hit'
  | 'cache.miss'
  | 'retry.attempt'
  | 'ratelimit.exceeded'
  | 'error.network'
  | 'error.validation'
  | 'error.auth';

export interface SDKEvent {
  type: EventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface EventSubscriber {
  onEvent(event: SDKEvent): void | Promise<void>;
}

export interface MonitoringConfig {
  enabled?: boolean;
  subscribers?: EventSubscriber[];
  sampleRate?: number;
}

export class EventEmitter {
  private subscribers: EventSubscriber[] = [];
  private config: Required<MonitoringConfig>;

  constructor(config: MonitoringConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      subscribers: config.subscribers || [],
      sampleRate: config.sampleRate || 1.0
    };

    this.subscribers = this.config.subscribers;
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  async emit(type: EventType, data: Record<string, unknown> = {}): Promise<void> {
    if (!this.config.enabled || !this.shouldSample()) {
      return;
    }

    const event: SDKEvent = {
      type,
      timestamp: Date.now(),
      data
    };

    await Promise.all(
      this.subscribers.map(subscriber => 
        Promise.resolve(subscriber.onEvent(event))
      )
    );
  }

  subscribe(subscriber: EventSubscriber): void {
    this.subscribers.push(subscriber);
  }

  unsubscribe(subscriber: EventSubscriber): void {
    const index = this.subscribers.indexOf(subscriber);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }
}

// Subscriber que guarda eventos en memoria
export class MemoryEventStore implements EventSubscriber {
  private events: SDKEvent[] = [];
  private maxEvents: number;

  constructor(maxEvents: number = 1000) {
    this.maxEvents = maxEvents;
  }

  onEvent(event: SDKEvent): void {
    this.events.push(event);
    
    // Mantener el tamaño máximo
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getEvents(
    filter?: {
      type?: EventType;
      startTime?: number;
      endTime?: number;
    }
  ): SDKEvent[] {
    let filteredEvents = this.events;

    if (filter?.type) {
      filteredEvents = filteredEvents.filter(e => e.type === filter.type);
    }

    if (filter?.startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filter.startTime!);
    }

    if (filter?.endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filter.endTime!);
    }

    return filteredEvents;
  }

  clear(): void {
    this.events = [];
  }
}

// Subscriber que envía eventos a un endpoint
export class HTTPEventSubscriber implements EventSubscriber {
  constructor(
    private endpoint: string,
    private headers?: Record<string, string>
  ) {}

  async onEvent(event: SDKEvent): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Silently fail - no queremos que los errores de monitoreo afecten la operación
      console.warn('Failed to send event:', error);
    }
  }
}

// Subscriber que imprime eventos en consola
export class ConsoleEventSubscriber implements EventSubscriber {
  onEvent(event: SDKEvent): void {
    const { type, timestamp, data } = event;
    const time = new Date(timestamp).toISOString();
    console.log(`[${time}] ${type}:`, data);
  }
}
