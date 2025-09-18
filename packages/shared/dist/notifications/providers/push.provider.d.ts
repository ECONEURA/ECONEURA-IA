import { z } from 'zod';
declare const PushProviderConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["firebase", "web_push", "apns"]>;
    serverKey: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    privateKey: z.ZodOptional<z.ZodString>;
    keyId: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    bundleId: z.ZodOptional<z.ZodString>;
    vapidPublicKey: z.ZodOptional<z.ZodString>;
    vapidPrivateKey: z.ZodOptional<z.ZodString>;
    vapidSubject: z.ZodOptional<z.ZodString>;
    testMode: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    provider?: "firebase" | "web_push" | "apns";
    testMode?: boolean;
    serverKey?: string;
    projectId?: string;
    privateKey?: string;
    keyId?: string;
    teamId?: string;
    bundleId?: string;
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
    vapidSubject?: string;
}, {
    provider?: "firebase" | "web_push" | "apns";
    testMode?: boolean;
    serverKey?: string;
    projectId?: string;
    privateKey?: string;
    keyId?: string;
    teamId?: string;
    bundleId?: string;
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
    vapidSubject?: string;
}>;
declare const PushMessageSchema: z.ZodObject<{
    to: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    title: z.ZodString;
    body: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    badge: z.ZodOptional<z.ZodNumber>;
    sound: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    clickAction: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    requireInteraction: z.ZodDefault<z.ZodBoolean>;
    silent: z.ZodDefault<z.ZodBoolean>;
    ttl: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["normal", "high"]>>;
    collapseKey: z.ZodOptional<z.ZodString>;
    delayWhileIdle: z.ZodDefault<z.ZodBoolean>;
    dryRun: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    data?: Record<string, any>;
    title?: string;
    image?: string;
    ttl?: number;
    silent?: boolean;
    to?: string | string[];
    priority?: "high" | "normal";
    body?: string;
    icon?: string;
    badge?: number;
    sound?: string;
    clickAction?: string;
    tag?: string;
    requireInteraction?: boolean;
    collapseKey?: string;
    delayWhileIdle?: boolean;
    dryRun?: boolean;
}, {
    data?: Record<string, any>;
    title?: string;
    image?: string;
    ttl?: number;
    silent?: boolean;
    to?: string | string[];
    priority?: "high" | "normal";
    body?: string;
    icon?: string;
    badge?: number;
    sound?: string;
    clickAction?: string;
    tag?: string;
    requireInteraction?: boolean;
    collapseKey?: string;
    delayWhileIdle?: boolean;
    dryRun?: boolean;
}>;
export interface PushProviderConfig {
    provider: 'firebase' | 'web_push' | 'apns';
    serverKey?: string;
    projectId?: string;
    privateKey?: string;
    keyId?: string;
    teamId?: string;
    bundleId?: string;
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
    vapidSubject?: string;
    testMode?: boolean;
}
export interface PushMessage {
    to: string | string[];
    title: string;
    body: string;
    icon?: string;
    image?: string;
    badge?: number;
    sound?: string;
    data?: Record<string, any>;
    clickAction?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    ttl?: number;
    priority?: 'normal' | 'high';
    collapseKey?: string;
    delayWhileIdle?: boolean;
    dryRun?: boolean;
}
export interface PushResult {
    messageId: string;
    success: boolean;
    provider: string;
    timestamp: Date;
    error?: string;
    metadata?: {
        successCount?: number;
        failureCount?: number;
        canonicalIds?: number;
        multicastId?: string;
        results?: Array<{
            messageId?: string;
            registrationId?: string;
            error?: string;
        }>;
    };
}
export interface IPushProvider {
    send(message: PushMessage): Promise<PushResult>;
    sendBulk(messages: PushMessage[]): Promise<PushResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class FirebaseProvider implements IPushProvider {
    private config;
    private serverKey;
    private projectId;
    constructor(config: PushProviderConfig);
    send(message: PushMessage): Promise<PushResult>;
    sendBulk(messages: PushMessage[]): Promise<PushResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class WebPushProvider implements IPushProvider {
    private config;
    private vapidPublicKey;
    private vapidPrivateKey;
    private vapidSubject;
    constructor(config: PushProviderConfig);
    send(message: PushMessage): Promise<PushResult>;
    sendBulk(messages: PushMessage[]): Promise<PushResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class APNSProvider implements IPushProvider {
    private config;
    private privateKey;
    private keyId;
    private teamId;
    private bundleId;
    constructor(config: PushProviderConfig);
    send(message: PushMessage): Promise<PushResult>;
    sendBulk(messages: PushMessage[]): Promise<PushResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class PushProviderFactory {
    static create(config: PushProviderConfig): IPushProvider;
}
export { PushProviderConfigSchema, PushMessageSchema };
//# sourceMappingURL=push.provider.d.ts.map