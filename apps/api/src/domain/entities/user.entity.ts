import { z } from 'zod';

// ============================================================================
// USER ENTITY
// ============================================================================

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

export class User {
  private constructor(private props: UserProps) {}

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now
    });
  }

  static fromPersistence(data: any): User {
    return new User({
      id: { value: data.id },
      organizationId: { value: data.organizationId },
      email: { value: data.email },
      passwordHash: { value: data.passwordHash },
      firstName: data.firstName,
      lastName: data.lastName,
      role: { value: data.role },
      status: { value: data.status },
      isEmailVerified: data.isEmailVerified,
      mfaEnabled: data.mfaEnabled,
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): UserId {
    return this.props.id;
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get mfaEnabled(): boolean {
    return this.props.mfaEnabled;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateProfile(firstName: string, lastName: string): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    this.props.updatedAt = new Date();
  }

  changePassword(newPasswordHash: PasswordHash): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
  }

  updateRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  updateStatus(newStatus: UserStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.props.updatedAt = new Date();
  }

  enableMFA(): void {
    this.props.mfaEnabled = true;
    this.props.updatedAt = new Date();
  }

  disableMFA(): void {
    this.props.mfaEnabled = false;
    this.props.updatedAt = new Date();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // BUSINESS RULES
  // ========================================================================

  isActive(): boolean {
    return this.props.status.value === 'active';
  }

  canAccessOrganization(organizationId: OrganizationId): boolean {
    return this.props.organizationId.value === organizationId.value;
  }

  hasRole(role: UserRole['value']): boolean {
    return this.props.role.value === role;
  }

  hasAnyRole(roles: UserRole['value'][]): boolean {
    return roles.includes(this.props.role.value);
  }

  isAdmin(): boolean {
    return this.props.role.value === 'admin';
  }

  isManager(): boolean {
    return this.props.role.value === 'manager';
  }

  isEditor(): boolean {
    return this.props.role.value === 'editor';
  }

  isViewer(): boolean {
    return this.props.role.value === 'viewer';
  }

  canManageUsers(): boolean {
    return ['admin', 'manager'].includes(this.props.role.value);
  }

  canEditData(): boolean {
    return ['admin', 'manager', 'editor'].includes(this.props.role.value);
  }

  canViewData(): boolean {
    return this.isActive();
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  toPersistence(): any {
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

  toDTO(): any {
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

  // ========================================================================
  // EQUALITY
  // ========================================================================

  equals(other: User): boolean {
    return this.props.id.value === other.props.id.value;
  }

  hashCode(): string {
    return this.props.id.value;
  }
}
