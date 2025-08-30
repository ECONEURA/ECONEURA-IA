import { logger } from './logger.js';

export interface Event {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: Record<string, any>;
  metadata: EventMetadata;
}

export interface EventMetadata {
  userId?: string;
  organizationId?: string;
  correlationId?: string;
  causationId?: string;
  source: string;
  version: string;
}

export interface EventStore {
  saveEvents(aggregateId: string, events: Event[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]>;
  getAllEvents(fromTimestamp?: Date): Promise<Event[]>;
  getEventsByType(eventType: string, fromTimestamp?: Date): Promise<Event[]>;
}

export interface EventBus {
  publish(event: Event): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}

export interface EventHandler {
  (event: Event): Promise<void>;
}

export interface Aggregate {
  id: string;
  version: number;
  apply(event: Event): void;
  getUncommittedEvents(): Event[];
  markEventsAsCommitted(): void;
}

export interface Command {
  id: string;
  type: string;
  aggregateId: string;
  data: Record<string, any>;
  metadata: CommandMetadata;
}

export interface CommandMetadata {
  userId?: string;
  organizationId?: string;
  correlationId?: string;
  causationId?: string;
  timestamp: Date;
}

export interface CommandHandler {
  (command: Command): Promise<Event[]>;
}

export interface Query {
  id: string;
  type: string;
  data: Record<string, any>;
  metadata: QueryMetadata;
}

export interface QueryMetadata {
  userId?: string;
  organizationId?: string;
  correlationId?: string;
  timestamp: Date;
}

export interface QueryHandler<T = any> {
  (query: Query): Promise<T>;
}

export interface ReadModel {
  id: string;
  type: string;
  data: Record<string, any>;
  version: number;
  lastUpdated: Date;
}

export interface ReadModelStore {
  save(readModel: ReadModel): Promise<void>;
  get(id: string, type: string): Promise<ReadModel | null>;
  query(type: string, filters: Record<string, any>): Promise<ReadModel[]>;
  delete(id: string, type: string): Promise<void>;
}

export class InMemoryEventStore implements EventStore {
  private events: Event[] = [];
  private aggregateVersions: Map<string, number> = new Map();

  async saveEvents(aggregateId: string, events: Event[], expectedVersion: number): Promise<void> {
    const currentVersion = this.aggregateVersions.get(aggregateId) || 0;
    
    if (currentVersion !== expectedVersion) {
      throw new Error(`Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`);
    }

    // Validar que los eventos son secuenciales
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.version !== expectedVersion + i + 1) {
        throw new Error(`Invalid event version: expected ${expectedVersion + i + 1}, got ${event.version}`);
      }
    }

    // Guardar eventos
    this.events.push(...events);
    
    // Actualizar versión del aggregate
    this.aggregateVersions.set(aggregateId, expectedVersion + events.length);

    logger.info('Events saved to event store', {
      aggregateId,
      eventCount: events.length,
      fromVersion: expectedVersion + 1,
      toVersion: expectedVersion + events.length,
    });
  }

  async getEvents(aggregateId: string, fromVersion: number = 0): Promise<Event[]> {
    const events = this.events
      .filter(event => event.aggregateId === aggregateId && event.version > fromVersion)
      .sort((a, b) => a.version - b.version);

    logger.debug('Events retrieved from event store', {
      aggregateId,
      fromVersion,
      eventCount: events.length,
    });

    return events;
  }

  async getAllEvents(fromTimestamp?: Date): Promise<Event[]> {
    let events = this.events;
    
    if (fromTimestamp) {
      events = events.filter(event => event.timestamp >= fromTimestamp);
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getEventsByType(eventType: string, fromTimestamp?: Date): Promise<Event[]> {
    let events = this.events.filter(event => event.type === eventType);
    
    if (fromTimestamp) {
      events = events.filter(event => event.timestamp >= fromTimestamp);
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    logger.info('Publishing event', {
      eventId: event.id,
      eventType: event.type,
      aggregateId: event.aggregateId,
      handlerCount: handlers.length,
    });

    // Ejecutar handlers de forma asíncrona
    const promises = handlers.map(handler => 
      handler(event).catch(error => {
        logger.error('Event handler failed', {
          eventId: event.id,
          eventType: event.type,
          error: error.message,
        });
      })
    );

    await Promise.all(promises);
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    logger.info('Event handler subscribed', {
      eventType,
      handlerCount: this.handlers.get(eventType)!.length,
    });
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        logger.info('Event handler unsubscribed', {
          eventType,
          handlerCount: handlers.length,
        });
      }
    }
  }
}

export class InMemoryReadModelStore implements ReadModelStore {
  private readModels: Map<string, ReadModel> = new Map();

  async save(readModel: ReadModel): Promise<void> {
    const key = `${readModel.type}:${readModel.id}`;
    this.readModels.set(key, readModel);
    
    logger.debug('Read model saved', {
      readModelId: readModel.id,
      readModelType: readModel.type,
      version: readModel.version,
    });
  }

  async get(id: string, type: string): Promise<ReadModel | null> {
    const key = `${type}:${id}`;
    return this.readModels.get(key) || null;
  }

  async query(type: string, filters: Record<string, any>): Promise<ReadModel[]> {
    const readModels = Array.from(this.readModels.values())
      .filter(rm => rm.type === type);

    // Aplicar filtros
    return readModels.filter(rm => {
      return Object.entries(filters).every(([key, value]) => {
        return rm.data[key] === value;
      });
    });
  }

  async delete(id: string, type: string): Promise<void> {
    const key = `${type}:${id}`;
    this.readModels.delete(key);
    
    logger.debug('Read model deleted', {
      readModelId: id,
      readModelType: type,
    });
  }
}

export class EventSourcingSystem {
  private eventStore: EventStore;
  private eventBus: EventBus;
  private readModelStore: ReadModelStore;
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private queryHandlers: Map<string, QueryHandler> = new Map();

  constructor(
    eventStore: EventStore,
    eventBus: EventBus,
    readModelStore: ReadModelStore
  ) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
    this.readModelStore = readModelStore;
  }

  // Command handling
  registerCommandHandler(commandType: string, handler: CommandHandler): void {
    this.commandHandlers.set(commandType, handler);
    
    logger.info('Command handler registered', {
      commandType,
      handlerCount: this.commandHandlers.size,
    });
  }

  async executeCommand(command: Command): Promise<void> {
    const handler = this.commandHandlers.get(command.type);
    
    if (!handler) {
      throw new Error(`No handler registered for command type: ${command.type}`);
    }

    logger.info('Executing command', {
      commandId: command.id,
      commandType: command.type,
      aggregateId: command.aggregateId,
    });

    try {
      const events = await handler(command);
      
      if (events.length > 0) {
        // Obtener versión actual del aggregate
        const existingEvents = await this.eventStore.getEvents(command.aggregateId);
        const currentVersion = existingEvents.length;

        // Guardar eventos en el event store
        await this.eventStore.saveEvents(command.aggregateId, events, currentVersion);

        // Publicar eventos en el event bus
        for (const event of events) {
          await this.eventBus.publish(event);
        }
      }

      logger.info('Command executed successfully', {
        commandId: command.id,
        eventCount: events.length,
      });
    } catch (error) {
      logger.error('Command execution failed', {
        commandId: command.id,
        commandType: command.type,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Query handling
  registerQueryHandler(queryType: string, handler: QueryHandler): void {
    this.queryHandlers.set(queryType, handler);
    
    logger.info('Query handler registered', {
      queryType,
      handlerCount: this.queryHandlers.size,
    });
  }

  async executeQuery<T>(query: Query): Promise<T> {
    const handler = this.queryHandlers.get(query.type) as QueryHandler<T>;
    
    if (!handler) {
      throw new Error(`No handler registered for query type: ${query.type}`);
    }

    logger.debug('Executing query', {
      queryId: query.id,
      queryType: query.type,
    });

    try {
      const result = await handler(query);
      
      logger.debug('Query executed successfully', {
        queryId: query.id,
        queryType: query.type,
      });

      return result;
    } catch (error) {
      logger.error('Query execution failed', {
        queryId: query.id,
        queryType: query.type,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Event sourcing utilities
  async loadAggregate<T extends Aggregate>(
    aggregateId: string,
    aggregateClass: new (id: string) => T
  ): Promise<T> {
    const events = await this.eventStore.getEvents(aggregateId);
    const aggregate = new aggregateClass(aggregateId);
    
    // Aplicar eventos para reconstruir el estado
    for (const event of events) {
      aggregate.apply(event);
    }
    
    aggregate.markEventsAsCommitted();
    
    logger.debug('Aggregate loaded from events', {
      aggregateId,
      eventCount: events.length,
      finalVersion: aggregate.version,
    });

    return aggregate;
  }

  async saveAggregate(aggregate: Aggregate): Promise<void> {
    const uncommittedEvents = aggregate.getUncommittedEvents();
    
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(aggregate.id, uncommittedEvents, aggregate.version);
      
      // Publicar eventos
      for (const event of uncommittedEvents) {
        await this.eventBus.publish(event);
      }
      
      aggregate.markEventsAsCommitted();
      
      logger.info('Aggregate saved with events', {
        aggregateId: aggregate.id,
        eventCount: uncommittedEvents.length,
        finalVersion: aggregate.version,
      });
    }
  }

  // Read model utilities
  async updateReadModel(
    readModelId: string,
    readModelType: string,
    updateFn: (readModel: ReadModel | null) => ReadModel
  ): Promise<void> {
    const existingReadModel = await this.readModelStore.get(readModelId, readModelType);
    const updatedReadModel = updateFn(existingReadModel);
    
    await this.readModelStore.save(updatedReadModel);
    
    logger.debug('Read model updated', {
      readModelId,
      readModelType,
      version: updatedReadModel.version,
    });
  }

  // Event replay
  async replayEvents(fromTimestamp?: Date): Promise<void> {
    logger.info('Starting event replay', { fromTimestamp });
    
    const events = await this.eventStore.getAllEvents(fromTimestamp);
    
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    
    logger.info('Event replay completed', {
      eventCount: events.length,
    });
  }

  // Statistics
  getStatistics(): {
    commandHandlers: number;
    queryHandlers: number;
    totalEvents: number;
  } {
    return {
      commandHandlers: this.commandHandlers.size,
      queryHandlers: this.queryHandlers.size,
      totalEvents: 0, // Esto requeriría acceso al event store
    };
  }
}

// Factories para crear eventos y comandos
export function createEvent(
  type: string,
  aggregateId: string,
  aggregateType: string,
  data: Record<string, any>,
  metadata: Omit<EventMetadata, 'source' | 'version'>
): Event {
  return {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    aggregateId,
    aggregateType,
    version: 0, // Se establecerá al guardar
    timestamp: new Date(),
    data,
    metadata: {
      ...metadata,
      source: 'api',
      version: '1.0.0',
    },
  };
}

export function createCommand(
  type: string,
  aggregateId: string,
  data: Record<string, any>,
  metadata: Omit<CommandMetadata, 'timestamp'>
): Command {
  return {
    id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    aggregateId,
    data,
    metadata: {
      ...metadata,
      timestamp: new Date(),
    },
  };
}

export function createQuery(
  type: string,
  data: Record<string, any>,
  metadata: Omit<QueryMetadata, 'timestamp'>
): Query {
  return {
    id: `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    metadata: {
      ...metadata,
      timestamp: new Date(),
    },
  };
}

// Instancias globales
export const eventStore = new InMemoryEventStore();
export const eventBus = new InMemoryEventBus();
export const readModelStore = new InMemoryReadModelStore();
export const eventSourcingSystem = new EventSourcingSystem(eventStore, eventBus, readModelStore);
