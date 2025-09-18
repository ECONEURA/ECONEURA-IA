import { BaseEntity, Metadata, Status } from './base.js';
export interface OrganizationSettings {
    aiEnabled: boolean;
    aiQuota: number;
    maxUsers: number;
    features: string[];
    allowedDomains?: string[];
    securitySettings: SecuritySettings;
    notificationSettings: NotificationSettings;
}
export interface SecuritySettings {
    mfaRequired: boolean;
    passwordPolicy: {
        minLength: number;
        requireSpecialChars: boolean;
        requireNumbers: boolean;
        requireUppercase: boolean;
        expirationDays?: number;
    };
    ipWhitelist?: string[];
    sessionTimeoutMinutes: number;
}
export interface NotificationSettings {
    emailNotifications: boolean;
    slackWebhook?: string;
    teamsWebhook?: string;
    alertContacts: string[];
    alertThresholds: {
        costWarningThresholdEur: number;
        errorRateThreshold: number;
        responseTimeThresholdMs: number;
    };
}
export interface SubscriptionPlan {
    name: string;
    price: number;
    billing: 'monthly' | 'annual';
    features: string[];
    limits: {
        users: number;
        storage: number;
        apiCalls: number;
    };
}
export interface Organization extends BaseEntity {
    name: string;
    slug: string;
    status: Status;
    settings: OrganizationSettings;
    plan: SubscriptionPlan;
    metadata: Metadata;
    domain: string;
    logo?: string;
    apiKeys: ApiKey[];
}
export interface ApiKey {
    id: string;
    name: string;
    hash: string;
    prefix: string;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    scopes: string[];
    createdBy: string;
}
//# sourceMappingURL=org.d.ts.map