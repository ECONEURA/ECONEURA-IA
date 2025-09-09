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

export interface ReadModel {
  id: string;
  type: string;
  data: Record<string, any>;
  version: number;
  lastUpdated: Date;
}

export class WebEventSourcingSystem {
  private commandHandlers: Map<string, any> = new Map();
  private queryHandlers: Map<string, any> = new Map();

  constructor() {
    console.log('Web Event Sourcing System initialized');
  }

  // Command handling
  registerCommandHandler(commandType: string, handler: any): void {
    this.commandHandlers.set(commandType, handler);
    console.log('Command handler registered', { commandType });
  }

  async executeCommand(command: Command): Promise<void> {
    const handler = this.commandHandlers.get(command.type);

    if (!handler) {
      throw new Error(`No handler registered for command type: ${command.type}`);
    }

    console.log('Executing command', {
      commandId: command.id,
      commandType: command.type,
      aggregateId: command.aggregateId,
    });

    try {
      await handler(command);
      console.log('Command executed successfully', { commandId: command.id });
    } catch (error) {
      console.error('Command execution failed', {
        commandId: command.id,
        commandType: command.type,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Query handling
  registerQueryHandler(queryType: string, handler: any): void {
    this.queryHandlers.set(queryType, handler);
    console.log('Query handler registered', { queryType });
  }

  async executeQuery<T>(query: Query): Promise<T> {
    const handler = this.queryHandlers.get(query.type);

    if (!handler) {
      throw new Error(`No handler registered for query type: ${query.type}`);
    }

    console.log('Executing query', {
      queryId: query.id,
      queryType: query.type,
    });

    try {
      const result = await handler(query);
      console.log('Query executed successfully', { queryId: query.id });
      return result;
    } catch (error) {
      console.error('Query execution failed', {
        queryId: query.id,
        queryType: query.type,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Statistics
  getStatistics(): {
    commandHandlers: number;
    queryHandlers: number;
  } {
    return {
      commandHandlers: this.commandHandlers.size,
      queryHandlers: this.queryHandlers.size,
    };
  }
}

// Factories para crear comandos y queries
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

// Instancia global
export const webEventSourcingSystem = new WebEventSourcingSystem();
