import { z } from 'zod';

// ============================================================================
// ORGANIZATION ENTITY
// ============================================================================

export interface OrganizationId {
  value: string;
}

export interface OrganizationSlug {
  value: string;
}

export interface SubscriptionTier {
  value: 'free' | 'basic' | 'pro' | 'enterprise';
}

export interface OrganizationStatus {
  value: 'active' | 'inactive' | 'suspended' | 'trial';
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  features: {
    ai: boolean;
    analytics: boolean;
    integrations: boolean;
    customFields: boolean;
  };
  limits: {
    users: number;
    companies: number;
    contacts: number;
    products: number;
    invoices: number;
    storage: number; // in MB
  };
}

export interface OrganizationProps {
  id: OrganizationId;
  name: string;
  slug: OrganizationSlug;
  description?: string;
  website?: string;
  logo?: string;
  settings: OrganizationSettings;
  subscriptionTier: SubscriptionTier;
  status: OrganizationStatus;
  trialEndsAt?: Date;
  billingEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization {
  private constructor(private props: OrganizationProps) {}

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<OrganizationProps, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const now = new Date();
    return new Organization({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now
    });
  }

  static fromPersistence(data: any): Organization {
    return new Organization({
      id: { value: data.id },
      name: data.name,
      slug: { value: data.slug },
      description: data.description,
      website: data.website,
      logo: data.logo,
      settings: data.settings || this.getDefaultSettings(),
      subscriptionTier: { value: data.subscriptionTier },
      status: { value: data.status },
      trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
      billingEmail: data.billingEmail,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  private static getDefaultSettings(): OrganizationSettings {
    return {
      timezone: 'UTC',
      currency: 'EUR',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      features: {
        ai: false,
        analytics: false,
        integrations: false,
        customFields: false
      },
      limits: {
        users: 5,
        companies: 100,
        contacts: 500,
        products: 200,
        invoices: 1000,
        storage: 1000 // 1GB
      }
    };
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): OrganizationId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): OrganizationSlug {
    return this.props.slug;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get logo(): string | undefined {
    return this.props.logo;
  }

  get settings(): OrganizationSettings {
    return this.props.settings;
  }

  get subscriptionTier(): SubscriptionTier {
    return this.props.subscriptionTier;
  }

  get status(): OrganizationStatus {
    return this.props.status;
  }

  get trialEndsAt(): Date | undefined {
    return this.props.trialEndsAt;
  }

  get billingEmail(): string | undefined {
    return this.props.billingEmail;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateWebsite(website: string): void {
    this.props.website = website;
    this.props.updatedAt = new Date();
  }

  updateLogo(logo: string): void {
    this.props.logo = logo;
    this.props.updatedAt = new Date();
  }

  updateSettings(settings: Partial<OrganizationSettings>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();
  }

  upgradeSubscription(tier: SubscriptionTier['value']): void {
    this.props.subscriptionTier = { value: tier };
    this.props.updatedAt = new Date();
  }

  updateStatus(status: OrganizationStatus['value']): void {
    this.props.status = { value: status };
    this.props.updatedAt = new Date();
  }

  setTrialEndsAt(date: Date): void {
    this.props.trialEndsAt = date;
    this.props.updatedAt = new Date();
  }

  updateBillingEmail(email: string): void {
    this.props.billingEmail = email;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // BUSINESS RULES
  // ========================================================================

  isActive(): boolean {
    return this.props.isActive && this.props.status.value === 'active';
  }

  isTrial(): boolean {
    return this.props.status.value === 'trial';
  }

  isTrialExpired(): boolean {
    if (!this.isTrial() || !this.props.trialEndsAt) {
      return false;
    }
    return new Date() > this.props.trialEndsAt;
  }

  canAddUsers(): boolean {
    return this.props.settings.limits.users > 0;
  }

  canAddCompanies(): boolean {
    return this.props.settings.limits.companies > 0;
  }

  canAddContacts(): boolean {
    return this.props.settings.limits.contacts > 0;
  }

  canAddProducts(): boolean {
    return this.props.settings.limits.products > 0;
  }

  canAddInvoices(): boolean {
    return this.props.settings.limits.invoices > 0;
  }

  hasFeature(feature: keyof OrganizationSettings['features']): boolean {
    return this.props.settings.features[feature];
  }

  hasAIFeature(): boolean {
    return this.hasFeature('ai');
  }

  hasAnalyticsFeature(): boolean {
    return this.hasFeature('analytics');
  }

  hasIntegrationsFeature(): boolean {
    return this.hasFeature('integrations');
  }

  hasCustomFieldsFeature(): boolean {
    return this.hasFeature('customFields');
  }

  getMaxUsers(): number {
    return this.props.settings.limits.users;
  }

  getMaxCompanies(): number {
    return this.props.settings.limits.companies;
  }

  getMaxContacts(): number {
    return this.props.settings.limits.contacts;
  }

  getMaxProducts(): number {
    return this.props.settings.limits.products;
  }

  getMaxInvoices(): number {
    return this.props.settings.limits.invoices;
  }

  getMaxStorage(): number {
    return this.props.settings.limits.storage;
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  static validateSlug(slug: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!slug || slug.length < 3) {
      errors.push('Slug must be at least 3 characters long');
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      errors.push('Slug cannot start or end with a hyphen');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name || name.length < 2) {
      errors.push('Organization name must be at least 2 characters long');
    }

    if (name.length > 100) {
      errors.push('Organization name cannot exceed 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateWebsite(website: string): boolean {
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  toPersistence(): any {
    return {
      id: this.props.id.value,
      name: this.props.name,
      slug: this.props.slug.value,
      description: this.props.description,
      website: this.props.website,
      logo: this.props.logo,
      settings: this.props.settings,
      subscriptionTier: this.props.subscriptionTier.value,
      status: this.props.status.value,
      trialEndsAt: this.props.trialEndsAt,
      billingEmail: this.props.billingEmail,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
  }

  toDTO(): any {
    return {
      id: this.props.id.value,
      name: this.props.name,
      slug: this.props.slug.value,
      description: this.props.description,
      website: this.props.website,
      logo: this.props.logo,
      settings: this.props.settings,
      subscriptionTier: this.props.subscriptionTier.value,
      status: this.props.status.value,
      trialEndsAt: this.props.trialEndsAt,
      billingEmail: this.props.billingEmail,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
  }

  // ========================================================================
  // EQUALITY
  // ========================================================================

  equals(other: Organization): boolean {
    return this.props.id.value === other.props.id.value;
  }

  hashCode(): string {
    return this.props.id.value;
  }
}
