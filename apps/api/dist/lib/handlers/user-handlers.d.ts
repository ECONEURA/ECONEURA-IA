import { CommandHandler, QueryHandler } from '../events.js';
import { UserState } from '../aggregates/user.js';
export declare const createUserHandler: CommandHandler;
export declare const updateUserHandler: CommandHandler;
export declare const suspendUserHandler: CommandHandler;
export declare const activateUserHandler: CommandHandler;
export declare const getUserHandler: QueryHandler<UserState | null>;
export declare const getUsersByOrganizationHandler: QueryHandler<UserState[]>;
export declare const getActiveUsersHandler: QueryHandler<UserState[]>;
export declare const getSuspendedUsersHandler: QueryHandler<UserState[]>;
export declare const userCreatedHandler: (event: any) => Promise<void>;
export declare const userUpdatedHandler: (event: any) => Promise<void>;
export declare const userSuspendedHandler: (event: any) => Promise<void>;
export declare const userActivatedHandler: (event: any) => Promise<void>;
export declare function registerUserHandlers(): void;
//# sourceMappingURL=user-handlers.d.ts.map