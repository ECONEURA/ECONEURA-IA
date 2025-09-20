import { z } from 'zod';
export class User {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new User({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    static fromPersistence(data) {
        return new User({
            id: data.id,
            organizationId: data.organizationId,
            email: data.email,
            passwordHash: data.passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            status: data.status,
            isEmailVerified: data.isEmailVerified,
            mfaEnabled: data.mfaEnabled,
            lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    get id() {
        return this.props.id;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get email() {
        return this.props.email;
    }
    get passwordHash() {
        return this.props.passwordHash;
    }
    get firstName() {
        return this.props.firstName;
    }
    get lastName() {
        return this.props.lastName;
    }
    get fullName() {
        return `${this.props.firstName} ${this.props.lastName}`;
    }
    get role() {
        return this.props.role;
    }
    get status() {
        return this.props.status;
    }
    get isEmailVerified() {
        return this.props.isEmailVerified;
    }
    get mfaEnabled() {
        return this.props.mfaEnabled;
    }
    get lastLoginAt() {
        return this.props.lastLoginAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateProfile(firstName, lastName) {
        this.props.firstName = firstName;
        this.props.lastName = lastName;
        this.props.updatedAt = new Date();
    }
    changePassword(newPasswordHash) {
        this.props.passwordHash = newPasswordHash;
        this.props.updatedAt = new Date();
    }
    updateRole(newRole) {
        this.props.role = newRole;
        this.props.updatedAt = new Date();
    }
    updateStatus(newStatus) {
        this.props.status = newStatus;
        this.props.updatedAt = new Date();
    }
    verifyEmail() {
        this.props.isEmailVerified = true;
        this.props.updatedAt = new Date();
    }
    enableMFA() {
        this.props.mfaEnabled = true;
        this.props.updatedAt = new Date();
    }
    disableMFA() {
        this.props.mfaEnabled = false;
        this.props.updatedAt = new Date();
    }
    recordLogin() {
        this.props.lastLoginAt = new Date();
        this.props.updatedAt = new Date();
    }
    isActive() {
        return this.props.status.value === 'active';
    }
    canAccessOrganization(organizationId) {
        return this.props.organizationId.value === organizationId.value;
    }
    hasRole(role) {
        return this.props.role.value === role;
    }
    hasAnyRole(roles) {
        return roles.includes(this.props.role.value);
    }
    isAdmin() {
        return this.props.role.value === 'admin';
    }
    isManager() {
        return this.props.role.value === 'manager';
    }
    isEditor() {
        return this.props.role.value === 'editor';
    }
    isViewer() {
        return this.props.role.value === 'viewer';
    }
    canManageUsers() {
        return ['admin', 'manager'].includes(this.props.role.value);
    }
    canEditData() {
        return ['admin', 'manager', 'editor'].includes(this.props.role.value);
    }
    canViewData() {
        return this.isActive();
    }
    static validateEmail(email) {
        const emailSchema = z.string().email();
        return emailSchema.safeParse(email).success;
    }
    static validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    toPersistence() {
        return {
            id: this.props.id.value,
            organizationId: this.props.organizationId.value,
            email: this.props.email.value,
            passwordHash: this.props.passwordHash.value,
            firstName: this.props.firstName,
            lastName: this.props.lastName,
            role: this.props.role.value,
            status: this.props.status.value,
            isEmailVerified: this.props.isEmailVerified,
            mfaEnabled: this.props.mfaEnabled,
            lastLoginAt: this.props.lastLoginAt,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }
    toDTO() {
        return {
            id: this.props.id.value,
            organizationId: this.props.organizationId.value,
            email: this.props.email.value,
            firstName: this.props.firstName,
            lastName: this.props.lastName,
            fullName: this.fullName,
            role: this.props.role.value,
            status: this.props.status.value,
            isEmailVerified: this.props.isEmailVerified,
            mfaEnabled: this.props.mfaEnabled,
            lastLoginAt: this.props.lastLoginAt,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }
    equals(other) {
        return this.props.id.value === other.props.id.value;
    }
    hashCode() {
        return this.props.id.value;
    }
}
//# sourceMappingURL=user.entity.js.map