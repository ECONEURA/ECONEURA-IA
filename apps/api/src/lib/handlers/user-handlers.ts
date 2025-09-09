import { Command, CommandHandler, Query, QueryHandler, ReadModel } from '../events.js';
import { UserAggregate, UserState } from '../aggregates/user.js';
import { eventSourcingSystem, readModelStore } from '../events.js';

// Command Handlers
export const createUserHandler: CommandHandler = async (command: Command): Promise<any[]> => {
  const { email, name, organizationId } = command.data;
  const userId = command.metadata.userId;

  const user = new UserAggregate(command.aggregateId);
  user.createUser(email, name, organizationId, userId);

  return user.getUncommittedEvents();
};

export const updateUserHandler: CommandHandler = async (command: Command): Promise<any[]> => {
  const { name } = command.data;
  const userId = command.metadata.userId;

  const user = await eventSourcingSystem.loadAggregate(command.aggregateId, UserAggregate);
  user.updateUser(name, userId);

  return user.getUncommittedEvents();
};

export const suspendUserHandler: CommandHandler = async (command: Command): Promise<any[]> => {
  const { reason } = command.data;
  const userId = command.metadata.userId;

  const user = await eventSourcingSystem.loadAggregate(command.aggregateId, UserAggregate);
  user.suspendUser(reason, userId);

  return user.getUncommittedEvents();
};

export const activateUserHandler: CommandHandler = async (command: Command): Promise<any[]> => {
  const userId = command.metadata.userId;

  const user = await eventSourcingSystem.loadAggregate(command.aggregateId, UserAggregate);
  user.activateUser(userId);

  return user.getUncommittedEvents();
};

// Query Handlers
export const getUserHandler: QueryHandler<UserState | null> = async (query: Query): Promise<UserState | null> => {
  const { userId } = query.data;

  const readModel = await readModelStore.get(userId, 'User');

  if (!readModel) {
    return null;
  }

  return readModel.data as UserState;
};

export const getUsersByOrganizationHandler: QueryHandler<UserState[]> = async (query: Query): Promise<UserState[]> => {
  const { organizationId } = query.data;

  const readModels = await readModelStore.query('User', { organizationId });

  return readModels.map(rm => rm.data as UserState);
};

export const getActiveUsersHandler: QueryHandler<UserState[]> = async (query: Query): Promise<UserState[]> => {
  const { organizationId } = query.data;

  const readModels = await readModelStore.query('User', { organizationId, status: 'active' });

  return readModels.map(rm => rm.data as UserState);
};

export const getSuspendedUsersHandler: QueryHandler<UserState[]> = async (query: Query): Promise<UserState[]> => {
  const { organizationId } = query.data;

  const readModels = await readModelStore.query('User', { organizationId, status: 'suspended' });

  return readModels.map(rm => rm.data as UserState);
};

// Event Handlers (Projections)
export const userCreatedHandler = async (event: any): Promise<void> => {
  const readModel: ReadModel = {
    id: event.aggregateId,
    type: 'User',
    data: {
      id: event.aggregateId,
      email: event.data.email,
      name: event.data.name,
      status: 'active',
      organizationId: event.data.organizationId,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    },
    version: event.version,
    lastUpdated: event.timestamp,
  };

  await readModelStore.save(readModel);
};

export const userUpdatedHandler = async (event: any): Promise<void> => {
  const existingReadModel = await readModelStore.get(event.aggregateId, 'User');

  if (existingReadModel) {
    const updatedReadModel: ReadModel = {
      ...existingReadModel,
      data: {
        ...existingReadModel.data,
        name: event.data.name,
        updatedAt: event.timestamp,
      },
      version: event.version,
      lastUpdated: event.timestamp,
    };

    await readModelStore.save(updatedReadModel);
  }
};

export const userSuspendedHandler = async (event: any): Promise<void> => {
  const existingReadModel = await readModelStore.get(event.aggregateId, 'User');

  if (existingReadModel) {
    const updatedReadModel: ReadModel = {
      ...existingReadModel,
      data: {
        ...existingReadModel.data,
        status: 'suspended',
        updatedAt: event.timestamp,
      },
      version: event.version,
      lastUpdated: event.timestamp,
    };

    await readModelStore.save(updatedReadModel);
  }
};

export const userActivatedHandler = async (event: any): Promise<void> => {
  const existingReadModel = await readModelStore.get(event.aggregateId, 'User');

  if (existingReadModel) {
    const updatedReadModel: ReadModel = {
      ...existingReadModel,
      data: {
        ...existingReadModel.data,
        status: 'active',
        updatedAt: event.timestamp,
      },
      version: event.version,
      lastUpdated: event.timestamp,
    };

    await readModelStore.save(updatedReadModel);
  }
};

// Registrar handlers
export function registerUserHandlers(): void {
  // Command handlers
  eventSourcingSystem.registerCommandHandler('CreateUser', createUserHandler);
  eventSourcingSystem.registerCommandHandler('UpdateUser', updateUserHandler);
  eventSourcingSystem.registerCommandHandler('SuspendUser', suspendUserHandler);
  eventSourcingSystem.registerCommandHandler('ActivateUser', activateUserHandler);

  // Query handlers
  eventSourcingSystem.registerQueryHandler('GetUser', getUserHandler);
  eventSourcingSystem.registerQueryHandler('GetUsersByOrganization', getUsersByOrganizationHandler);
  eventSourcingSystem.registerQueryHandler('GetActiveUsers', getActiveUsersHandler);
  eventSourcingSystem.registerQueryHandler('GetSuspendedUsers', getSuspendedUsersHandler);

  // Event handlers (projections)
  const { eventBus } = require('../events.js');
  eventBus.subscribe('UserCreated', userCreatedHandler);
  eventBus.subscribe('UserUpdated', userUpdatedHandler);
  eventBus.subscribe('UserSuspended', userSuspendedHandler);
  eventBus.subscribe('UserActivated', userActivatedHandler);
}
