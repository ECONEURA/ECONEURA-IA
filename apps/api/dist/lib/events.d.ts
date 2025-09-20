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
export declare class InMemoryEventStore implements EventStore {
    private events;
    private aggregateVersions;
    saveEvents(aggregateId: string, events: Event[], expectedVersion: number): Promise<void>;
    getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]>;
    getAllEvents(fromTimestamp?: Date): Promise<Event[]>;
    getEventsByType(eventType: string, fromTimestamp?: Date): Promise<Event[]>;
}
export declare class InMemoryEventBus implements EventBus {
    private handlers;
    publish(event: Event): Promise<void>;
    subscribe(eventType: string, handler: EventHandler): void;
    unsubscribe(eventType: string, handler: EventHandler): void;
}
export declare class InMemoryReadModelStore implements ReadModelStore {
    private readModels;
    save(readModel: ReadModel): Promise<void>;
    get(id: string, type: string): Promise<ReadModel | null>;
    query(type: string, filters: Record<string, any>): Promise<ReadModel[]>;
    delete(id: string, type: string): Promise<void>;
}
export declare class EventSourcingSystem {
    private eventStore;
    private eventBus;
    private readModelStore;
    private commandHandlers;
    private queryHandlers;
    constructor(eventStore: EventStore, eventBus: EventBus, readModelStore: ReadModelStore);
    registerCommandHandler(commandType: string, handler: CommandHandler): void;
    executeCommand(command: Command): Promise<void>;
    registerQueryHandler(queryType: string, handler: QueryHandler): void;
    executeQuery<T>(query: Query): Promise<T>;
    loadAggregate<T extends Aggregate>(aggregateId: string, aggregateClass: new (id: string) => T): Promise<T>;
    saveAggregate(aggregate: Aggregate): Promise<void>;
    updateReadModel(readModelId: string, readModelType: string, updateFn: (readModel: ReadModel | null) => ReadModel): Promise<void>;
    replayEvents(fromTimestamp?: Date): Promise<void>;
    getStatistics(): {
        commandHandlers: number;
        queryHandlers: number;
        totalEvents: number;
    };
}
export declare function createEvent(type: string, aggregateId: string, aggregateType: string, data: Record<string, any>, metadata: Omit<EventMetadata, 'source' | 'version'>): Event;
export declare function createCommand(type: string, aggregateId: string, data: Record<string, any>, metadata: Omit<CommandMetadata, 'timestamp'>): Command;
export declare function createQuery(type: string, data: Record<string, any>, metadata: Omit<QueryMetadata, 'timestamp'>): Query;
export declare const eventStore: InMemoryEventStore;
export declare const eventBus: InMemoryEventBus;
export declare const readModelStore: InMemoryReadModelStore;
export declare const eventSourcingSystem: EventSourcingSystem;
//# sourceMappingURL=events.d.ts.map