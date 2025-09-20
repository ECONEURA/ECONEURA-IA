export interface UserId {
    value: string;
}
export interface OrganizationId {
    value: string;
}
export interface Email {
    value: string;
}
export interface PasswordHash {
    value: string;
}
export interface UserRole {
    value: 'admin' | 'manager' | 'editor' | 'viewer';
}
export interface UserStatus {
    value: 'active' | 'inactive' | 'suspended' | 'pending';
}
export interface UserProps {
    id: UserId;
    organizationId: OrganizationId;
    email: Email;
    passwordHash: PasswordHash;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    mfaEnabled: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class User {
    private props;
    private constructor();
    static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User;
    static fromPersistence(data: any): User;
    get id(): UserId;
    get organizationId(): OrganizationId;
    get email(): Email;
    get passwordHash(): PasswordHash;
    get firstName(): string;
    get lastName(): string;
    get fullName(): string;
    get role(): UserRole;
    get status(): UserStatus;
    get isEmailVerified(): boolean;
    get mfaEnabled(): boolean;
    get lastLoginAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateProfile(firstName: string, lastName: string): void;
    changePassword(newPasswordHash: PasswordHash): void;
    updateRole(newRole: UserRole): void;
    updateStatus(newStatus: UserStatus): void;
    verifyEmail(): void;
    enableMFA(): void;
    disableMFA(): void;
    recordLogin(): void;
    isActive(): boolean;
    canAccessOrganization(organizationId: OrganizationId): boolean;
    hasRole(role: UserRole['value']): boolean;
    hasAnyRole(roles: UserRole['value'][]): boolean;
    isAdmin(): boolean;
    isManager(): boolean;
    isEditor(): boolean;
    isViewer(): boolean;
    canManageUsers(): boolean;
    canEditData(): boolean;
    canViewData(): boolean;
    static validateEmail(email: string): boolean;
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    toPersistence(): any;
    toDTO(): any;
    equals(other: User): boolean;
    hashCode(): string;
}
//# sourceMappingURL=user.entity.d.ts.map