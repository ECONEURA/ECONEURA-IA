export interface BaseEntityId {
    value: string;
}
export interface BaseEntityProps {
    id: BaseEntityId;
    organizationId: BaseEntityId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare abstract class BaseEntity {
    protected props: BaseEntityProps;
    protected constructor(props: BaseEntityProps);
    get id(): BaseEntityId;
    get organizationId(): BaseEntityId;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    activate(): void;
    deactivate(): void;
    protected updateTimestamp(): void;
    protected validateBase(): boolean;
    toJSON(): BaseEntityProps;
    protected static generateId(): BaseEntityId;
    protected static getCurrentTimestamp(): Date;
}
//# sourceMappingURL=base.entity.d.ts.map