export class Organization {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new Organization({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    static fromPersistence(data) {
        return new Organization({
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            website: data.website,
            logo: data.logo,
            settings: data.settings || this.getDefaultSettings(),
            subscriptionTier: data.subscriptionTier,
            status: data.status,
            trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
            billingEmail: data.billingEmail,
            isActive: data.isActive,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    static getDefaultSettings() {
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
                storage: 1000
            }
        };
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get slug() {
        return this.props.slug;
    }
    get description() {
        return this.props.description;
    }
    get website() {
        return this.props.website;
    }
    get logo() {
        return this.props.logo;
    }
    get settings() {
        return this.props.settings;
    }
    get subscriptionTier() {
        return this.props.subscriptionTier;
    }
    get status() {
        return this.props.status;
    }
    get trialEndsAt() {
        return this.props.trialEndsAt;
    }
    get billingEmail() {
        return this.props.billingEmail;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateName(name) {
        this.props.name = name;
        this.props.updatedAt = new Date();
    }
    updateDescription(description) {
        this.props.description = description;
        this.props.updatedAt = new Date();
    }
    updateWebsite(website) {
        this.props.website = website;
        this.props.updatedAt = new Date();
    }
    updateLogo(logo) {
        this.props.logo = logo;
        this.props.updatedAt = new Date();
    }
    updateSettings(settings) {
        this.props.settings = { ...this.props.settings, ...settings };
        this.props.updatedAt = new Date();
    }
    upgradeSubscription(tier) {
        this.props.subscriptionTier = tier;
        this.props.updatedAt = new Date();
    }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }
    setTrialEndsAt(date) {
        this.props.trialEndsAt = date;
        this.props.updatedAt = new Date();
    }
    updateBillingEmail(email) {
        this.props.billingEmail = email;
        this.props.updatedAt = new Date();
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    isActive() {
        return this.props.isActive && this.props.status.value === 'active';
    }
    isTrial() {
        return this.props.status.value === 'trial';
    }
    isTrialExpired() {
        if (!this.isTrial() || !this.props.trialEndsAt) {
            return false;
        }
        return new Date() > this.props.trialEndsAt;
    }
    canAddUsers() {
        return this.props.settings.limits.users > 0;
    }
    canAddCompanies() {
        return this.props.settings.limits.companies > 0;
    }
    canAddContacts() {
        return this.props.settings.limits.contacts > 0;
    }
    canAddProducts() {
        return this.props.settings.limits.products > 0;
    }
    canAddInvoices() {
        return this.props.settings.limits.invoices > 0;
    }
    hasFeature(feature) {
        return this.props.settings.features[feature];
    }
    hasAIFeature() {
        return this.hasFeature('ai');
    }
    hasAnalyticsFeature() {
        return this.hasFeature('analytics');
    }
    hasIntegrationsFeature() {
        return this.hasFeature('integrations');
    }
    hasCustomFieldsFeature() {
        return this.hasFeature('customFields');
    }
    getMaxUsers() {
        return this.props.settings.limits.users;
    }
    getMaxCompanies() {
        return this.props.settings.limits.companies;
    }
    getMaxContacts() {
        return this.props.settings.limits.contacts;
    }
    getMaxProducts() {
        return this.props.settings.limits.products;
    }
    getMaxInvoices() {
        return this.props.settings.limits.invoices;
    }
    getMaxStorage() {
        return this.props.settings.limits.storage;
    }
    static validateSlug(slug) {
        const errors = [];
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
    static validateName(name) {
        const errors = [];
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
    static validateWebsite(website) {
        try {
            new URL(website);
            return true;
        }
        catch {
            return false;
        }
    }
    toPersistence() {
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
    toDTO() {
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
    equals(other) {
        return this.props.id.value === other.props.id.value;
    }
    hashCode() {
        return this.props.id.value;
    }
}
//# sourceMappingURL=organization.entity.js.map