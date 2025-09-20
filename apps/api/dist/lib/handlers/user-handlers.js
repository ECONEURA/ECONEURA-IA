import { UserAggregate } from '../aggregates/user.js';
import { eventSourcingSystem, readModelStore, eventBus } from '../events.js';
export const createUserHandler = async (command) => {
    const { email, name, organizationId } = command.data;
    const userId = command.metadata.userId;
    const user = new UserAggregate(command.aggregateId);
    user.createUser(email, name, organizationId, userId);
    return user.getUncommittedEvents();
};
export const updateUserHandler = async (command) => {
    const { name } = command.data;
    const userId = command.metadata.userId;
    const user = await eventSourcingSystem.loadAggregate(command.aggregateId, UserAggregate);
    user.updateUser(name, userId);
    return user.getUncommittedEvents();
};
export const suspendUserHandler = async (command) => {
    const { reason } = command.data;
    const userId = command.metadata.userId;
    const user = await eventSourcingSystem.loadAggregate(command.aggregateId, UserAggregate);
    user.suspendUser(reason, userId);
    return user.getUncommittedEvents();
};
export const activateUserHandler = async (command) => {
    const userId = command.metadata.userId;
    const user = await eventSourcingSystem.loadAggregate(command.aggregateId, UserAggregate);
    user.activateUser(userId);
    return user.getUncommittedEvents();
};
export const getUserHandler = async (query) => {
    const { userId } = query.data;
    const readModel = await readModelStore.get(userId, 'User');
    if (!readModel) {
        return null;
    }
    return readModel.data;
};
export const getUsersByOrganizationHandler = async (query) => {
    const { organizationId } = query.data;
    const readModels = await readModelStore.query('User', { organizationId });
    return readModels.map(rm => rm.data);
};
export const getActiveUsersHandler = async (query) => {
    const { organizationId } = query.data;
    const readModels = await readModelStore.query('User', { organizationId, status: 'active' });
    return readModels.map(rm => rm.data);
};
export const getSuspendedUsersHandler = async (query) => {
    const { organizationId } = query.data;
    const readModels = await readModelStore.query('User', { organizationId, status: 'suspended' });
    return readModels.map(rm => rm.data);
};
export const userCreatedHandler = async (event) => {
    const readModel = {
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
export const userUpdatedHandler = async (event) => {
    const existingReadModel = await readModelStore.get(event.aggregateId, 'User');
    if (existingReadModel) {
        const updatedReadModel = {
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
export const userSuspendedHandler = async (event) => {
    const existingReadModel = await readModelStore.get(event.aggregateId, 'User');
    if (existingReadModel) {
        const updatedReadModel = {
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
export const userActivatedHandler = async (event) => {
    const existingReadModel = await readModelStore.get(event.aggregateId, 'User');
    if (existingReadModel) {
        const updatedReadModel = {
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
export function registerUserHandlers() {
    eventSourcingSystem.registerCommandHandler('CreateUser', createUserHandler);
    eventSourcingSystem.registerCommandHandler('UpdateUser', updateUserHandler);
    eventSourcingSystem.registerCommandHandler('SuspendUser', suspendUserHandler);
    eventSourcingSystem.registerCommandHandler('ActivateUser', activateUserHandler);
    eventSourcingSystem.registerQueryHandler('GetUser', getUserHandler);
    eventSourcingSystem.registerQueryHandler('GetUsersByOrganization', getUsersByOrganizationHandler);
    eventSourcingSystem.registerQueryHandler('GetActiveUsers', getActiveUsersHandler);
    eventSourcingSystem.registerQueryHandler('GetSuspendedUsers', getSuspendedUsersHandler);
    eventBus.subscribe('UserCreated', userCreatedHandler);
    eventBus.subscribe('UserUpdated', userUpdatedHandler);
    eventBus.subscribe('UserSuspended', userSuspendedHandler);
    eventBus.subscribe('UserActivated', userActivatedHandler);
}
//# sourceMappingURL=user-handlers.js.map