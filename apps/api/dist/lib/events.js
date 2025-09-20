import { logger } from './logger.js';
export class InMemoryEventStore {
    events = [];
    aggregateVersions = new Map();
    async saveEvents(aggregateId, events, expectedVersion) {
        const currentVersion = this.aggregateVersions.get(aggregateId) || 0;
        if (currentVersion !== expectedVersion) {
            throw new Error(`Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`);
        }
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (event.version !== expectedVersion + i + 1) {
                throw new Error(`Invalid event version: expected ${expectedVersion + i + 1}, got ${event.version}`);
            }
        }
        this.events.push(...events);
        this.aggregateVersions.set(aggregateId, expectedVersion + events.length);
        logger.info('Events saved to event store', {
            aggregateId,
            eventCount: events.length,
            fromVersion: expectedVersion + 1,
            toVersion: expectedVersion + events.length,
        });
    }
    async getEvents(aggregateId, fromVersion = 0) {
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
    async getAllEvents(fromTimestamp) {
        let events = this.events;
        if (fromTimestamp) {
            events = events.filter(event => event.timestamp >= fromTimestamp);
        }
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    async getEventsByType(eventType, fromTimestamp) {
        let events = this.events.filter(event => event.type === eventType);
        if (fromTimestamp) {
            events = events.filter(event => event.timestamp >= fromTimestamp);
        }
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
}
export class InMemoryEventBus {
    handlers = new Map();
    async publish(event) {
        const handlers = this.handlers.get(event.type) || [];
        logger.info('Publishing event', {
            eventId: event.id,
            eventType: event.type,
            aggregateId: event.aggregateId,
            handlerCount: handlers.length,
        });
        const promises = handlers.map(handler => handler(event).catch(error => {
            logger.error('Event handler failed', {
                eventId: event.id,
                eventType: event.type,
                error: error.message,
            });
        }));
        await Promise.all(promises);
    }
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
        logger.info('Event handler subscribed', {
            eventType,
            handlerCount: this.handlers.get(eventType).length,
        });
    }
    unsubscribe(eventType, handler) {
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
export class InMemoryReadModelStore {
    readModels = new Map();
    async save(readModel) {
        const key = `${readModel.type}:${readModel.id}`;
        this.readModels.set(key, readModel);
        logger.debug('Read model saved', {
            readModelId: readModel.id,
            readModelType: readModel.type,
            version: readModel.version.toString(),
        });
    }
    async get(id, type) {
        const key = `${type}:${id}`;
        return this.readModels.get(key) || null;
    }
    async query(type, filters) {
        const readModels = Array.from(this.readModels.values())
            .filter(rm => rm.type === type);
        return readModels.filter(rm => {
            return Object.entries(filters).every(([key, value]) => {
                return rm.data[key] === value;
            });
        });
    }
    async delete(id, type) {
        const key = `${type}:${id}`;
        this.readModels.delete(key);
        logger.debug('Read model deleted', {
            readModelId: id,
            readModelType: type,
        });
    }
}
export class EventSourcingSystem {
    eventStore;
    eventBus;
    readModelStore;
    commandHandlers = new Map();
    queryHandlers = new Map();
    constructor(eventStore, eventBus, readModelStore) {
        this.eventStore = eventStore;
        this.eventBus = eventBus;
        this.readModelStore = readModelStore;
    }
    registerCommandHandler(commandType, handler) {
        this.commandHandlers.set(commandType, handler);
        logger.info('Command handler registered', {
            commandType,
            handlerCount: this.commandHandlers.size,
        });
    }
    async executeCommand(command) {
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
                const existingEvents = await this.eventStore.getEvents(command.aggregateId);
                const currentVersion = existingEvents.length;
                await this.eventStore.saveEvents(command.aggregateId, events, currentVersion);
                for (const event of events) {
                    await this.eventBus.publish(event);
                }
            }
            logger.info('Command executed successfully', {
                commandId: command.id,
                eventCount: events.length,
            });
        }
        catch (error) {
            logger.error('Command execution failed', {
                commandId: command.id,
                commandType: command.type,
                error: error.message,
            });
            throw error;
        }
    }
    registerQueryHandler(queryType, handler) {
        this.queryHandlers.set(queryType, handler);
        logger.info('Query handler registered', {
            queryType,
            handlerCount: this.queryHandlers.size,
        });
    }
    async executeQuery(query) {
        const handler = this.queryHandlers.get(query.type);
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
        }
        catch (error) {
            logger.error('Query execution failed', {
                queryId: query.id,
                queryType: query.type,
                error: error.message,
            });
            throw error;
        }
    }
    async loadAggregate(aggregateId, aggregateClass) {
        const events = await this.eventStore.getEvents(aggregateId);
        const aggregate = new aggregateClass(aggregateId);
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
    async saveAggregate(aggregate) {
        const uncommittedEvents = aggregate.getUncommittedEvents();
        if (uncommittedEvents.length > 0) {
            await this.eventStore.saveEvents(aggregate.id, uncommittedEvents, aggregate.version);
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
    async updateReadModel(readModelId, readModelType, updateFn) {
        const existingReadModel = await this.readModelStore.get(readModelId, readModelType);
        const updatedReadModel = updateFn(existingReadModel);
        await this.readModelStore.save(updatedReadModel);
        logger.debug('Read model updated', {
            readModelId,
            readModelType,
            version: updatedReadModel.version.toString(),
        });
    }
    async replayEvents(fromTimestamp) {
        logger.info('Starting event replay', { fromTimestamp: fromTimestamp?.toISOString() });
        const events = await this.eventStore.getAllEvents(fromTimestamp);
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        logger.info('Event replay completed', {
            eventCount: events.length,
        });
    }
    getStatistics() {
        return {
            commandHandlers: this.commandHandlers.size,
            queryHandlers: this.queryHandlers.size,
            totalEvents: 0,
        };
    }
}
export function createEvent(type, aggregateId, aggregateType, data, metadata) {
    return {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        aggregateId,
        aggregateType,
        version: 0,
        timestamp: new Date(),
        data,
        metadata: {
            ...metadata,
            source: 'api',
            version: '1.0.0',
        },
    };
}
export function createCommand(type, aggregateId, data, metadata) {
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
export function createQuery(type, data, metadata) {
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
export const eventStore = new InMemoryEventStore();
export const eventBus = new InMemoryEventBus();
export const readModelStore = new InMemoryReadModelStore();
export const eventSourcingSystem = new EventSourcingSystem(eventStore, eventBus, readModelStore);
//# sourceMappingURL=events.js.map