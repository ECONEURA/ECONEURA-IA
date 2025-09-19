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
        storage: number;
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
export declare class Organization {
    private props;
    private constructor();
    static create(props: Omit<OrganizationProps, 'id' | 'createdAt' | 'updatedAt'>): Organization;
    static fromPersistence(data: any): Organization;
    private static getDefaultSettings;
    get id(): OrganizationId;
    get name(): string;
    get slug(): OrganizationSlug;
    get description(): string | undefined;
    get website(): string | undefined;
    get logo(): string | undefined;
    get settings(): OrganizationSettings;
    get subscriptionTier(): SubscriptionTier;
    get status(): OrganizationStatus;
    get trialEndsAt(): Date | undefined;
    get billingEmail(): string | undefined;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateDescription(description: string): void;
    updateWebsite(website: string): void;
    updateLogo(logo: string): void;
    updateSettings(settings: Partial<OrganizationSettings>): void;
    upgradeSubscription(tier: SubscriptionTier['value']): void;
    updateStatus(status: OrganizationStatus['value']): void;
    setTrialEndsAt(date: Date): void;
    updateBillingEmail(email: string): void;
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    isTrial(): boolean;
    isTrialExpired(): boolean;
    canAddUsers(): boolean;
    canAddCompanies(): boolean;
    canAddContacts(): boolean;
    canAddProducts(): boolean;
    canAddInvoices(): boolean;
    hasFeature(feature: keyof OrganizationSettings['features']): boolean;
    hasAIFeature(): boolean;
    hasAnalyticsFeature(): boolean;
    hasIntegrationsFeature(): boolean;
    hasCustomFieldsFeature(): boolean;
    getMaxUsers(): number;
    getMaxCompanies(): number;
    getMaxContacts(): number;
    getMaxProducts(): number;
    getMaxInvoices(): number;
    getMaxStorage(): number;
    static validateSlug(slug: string): {
        isValid: boolean;
        errors: string[];
    };
    static validateName(name: string): {
        isValid: boolean;
        errors: string[];
    };
    static validateWebsite(website: string): boolean;
    toPersistence(): any;
    toDTO(): any;
    equals(other: Organization): boolean;
    hashCode(): string;
}
//# sourceMappingURL=organization.entity.d.ts.map