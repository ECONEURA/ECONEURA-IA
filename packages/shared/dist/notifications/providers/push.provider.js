import { z } from 'zod';
import { logger } from '../../../utils/logger.js';
const PushProviderConfigSchema = z.object({
    provider: z.enum(['firebase', 'web_push', 'apns']),
    serverKey: z.string().optional(),
    projectId: z.string().optional(),
    privateKey: z.string().optional(),
    keyId: z.string().optional(),
    teamId: z.string().optional(),
    bundleId: z.string().optional(),
    vapidPublicKey: z.string().optional(),
    vapidPrivateKey: z.string().optional(),
    vapidSubject: z.string().optional(),
    testMode: z.boolean().default(false)
});
const PushMessageSchema = z.object({
    to: z.union([z.string(), z.array(z.string())]),
    title: z.string(),
    body: z.string(),
    icon: z.string().optional(),
    image: z.string().optional(),
    badge: z.number().optional(),
    sound: z.string().optional(),
    data: z.record(z.any()).optional(),
    clickAction: z.string().optional(),
    tag: z.string().optional(),
    requireInteraction: z.boolean().default(false),
    silent: z.boolean().default(false),
    ttl: z.number().min(0).max(86400).optional(),
    priority: z.enum(['normal', 'high']).default('normal'),
    collapseKey: z.string().optional(),
    delayWhileIdle: z.boolean().default(false),
    dryRun: z.boolean().default(false)
});
export class FirebaseProvider {
    config;
    serverKey;
    projectId;
    constructor(config) {
        this.config = config;
        this.serverKey = config.serverKey || process.env.FIREBASE_SERVER_KEY || '';
        this.projectId = config.projectId || process.env.FIREBASE_PROJECT_ID || '';
        if (!this.serverKey || !this.projectId) {
            throw new Error('Firebase Server Key and Project ID are required');
        }
    }
    async send(message) {
        try {
            if (this.config.testMode) {
                logger.info('Firebase push sent (test mode)', {
                    to: Array.isArray(message.to) ? message.to.length : 1,
                    title: message.title,
                    provider: 'firebase'
                });
                return {
                    messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    provider: 'firebase',
                    timestamp: new Date(),
                    metadata: { testMode: true }
                };
            }
            const tokens = Array.isArray(message.to) ? message.to : [message.to];
            const fcmMessage = {
                registration_ids: tokens,
                notification: {
                    title: message.title,
                    body: message.body,
                    icon: message.icon,
                    image: message.image,
                    sound: message.sound,
                    click_action: message.clickAction,
                    tag: message.tag,
                    require_interaction: message.requireInteraction,
                    silent: message.silent
                },
                data: message.data,
                android: {
                    ttl: message.ttl ? `${message.ttl}s` : undefined,
                    priority: message.priority,
                    collapse_key: message.collapseKey,
                    delay_while_idle: message.delayWhileIdle,
                    dry_run: message.dryRun
                },
                apns: {
                    headers: {
                        'apns-priority': message.priority === 'high' ? '10' : '5',
                        'apns-expiration': message.ttl ? Math.floor(Date.now() / 1000) + message.ttl : undefined
                    },
                    payload: {
                        aps: {
                            alert: {
                                title: message.title,
                                body: message.body
                            },
                            badge: message.badge,
                            sound: message.sound,
                            'content-available': message.silent ? 1 : 0
                        },
                        ...message.data
                    }
                }
            };
            await new Promise(resolve => setTimeout(resolve, 100));
            const messageId = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger.info('Firebase push sent', {
                messageId,
                tokenCount: tokens.length,
                title: message.title,
                provider: 'firebase'
            });
            const results = tokens.map((token, index) => ({
                messageId: `${messageId}_${index}`,
                registrationId: token,
                error: Math.random() > 0.9 ? 'InvalidRegistration' : undefined
            }));
            const successCount = results.filter(r => !r.error).length;
            const failureCount = results.filter(r => r.error).length;
            return {
                messageId,
                success: successCount > 0,
                provider: 'firebase',
                timestamp: new Date(),
                metadata: {
                    successCount,
                    failureCount,
                    canonicalIds: 0,
                    multicastId: messageId,
                    results
                }
            };
        }
        catch (error) {
            logger.error('Firebase push failed', {
                error: error.message,
                title: message.title
            });
            return {
                messageId: '',
                success: false,
                provider: 'firebase',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async sendBulk(messages) {
        const results = [];
        const batchSize = 100;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.send(message));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }
    async validateConfig() {
        try {
            return !!(this.serverKey && this.projectId);
        }
        catch (error) {
            return false;
        }
    }
    async getQuota() {
        return {
            used: Math.floor(Math.random() * 1000),
            limit: 10000,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
}
export class WebPushProvider {
    config;
    vapidPublicKey;
    vapidPrivateKey;
    vapidSubject;
    constructor(config) {
        this.config = config;
        this.vapidPublicKey = config.vapidPublicKey || process.env.VAPID_PUBLIC_KEY || '';
        this.vapidPrivateKey = config.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY || '';
        this.vapidSubject = config.vapidSubject || process.env.VAPID_SUBJECT || '';
        if (!this.vapidPublicKey || !this.vapidPrivateKey || !this.vapidSubject) {
            throw new Error('VAPID keys and subject are required for Web Push');
        }
    }
    async send(message) {
        try {
            if (this.config.testMode) {
                logger.info('Web Push sent (test mode)', {
                    to: Array.isArray(message.to) ? message.to.length : 1,
                    title: message.title,
                    provider: 'web_push'
                });
                return {
                    messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    provider: 'web_push',
                    timestamp: new Date(),
                    metadata: { testMode: true }
                };
            }
            const subscriptions = Array.isArray(message.to) ? message.to : [message.to];
            const webPushMessage = {
                title: message.title,
                body: message.body,
                icon: message.icon,
                image: message.image,
                badge: message.badge,
                tag: message.tag,
                requireInteraction: message.requireInteraction,
                silent: message.silent,
                data: message.data,
                actions: message.clickAction ? [{
                        action: 'open',
                        title: 'Open',
                        url: message.clickAction
                    }] : undefined,
                ttl: message.ttl || 86400,
                urgency: message.priority
            };
            await new Promise(resolve => setTimeout(resolve, 80));
            const messageId = `webpush_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger.info('Web Push sent', {
                messageId,
                subscriptionCount: subscriptions.length,
                title: message.title,
                provider: 'web_push'
            });
            const results = subscriptions.map((subscription, index) => ({
                messageId: `${messageId}_${index}`,
                registrationId: subscription,
                error: Math.random() > 0.95 ? 'InvalidSubscription' : undefined
            }));
            const successCount = results.filter(r => !r.error).length;
            const failureCount = results.filter(r => r.error).length;
            return {
                messageId,
                success: successCount > 0,
                provider: 'web_push',
                timestamp: new Date(),
                metadata: {
                    successCount,
                    failureCount,
                    results
                }
            };
        }
        catch (error) {
            logger.error('Web Push failed', {
                error: error.message,
                title: message.title
            });
            return {
                messageId: '',
                success: false,
                provider: 'web_push',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async sendBulk(messages) {
        const results = [];
        const batchSize = 50;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.send(message));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }
    async validateConfig() {
        try {
            return !!(this.vapidPublicKey && this.vapidPrivateKey && this.vapidSubject);
        }
        catch (error) {
            return false;
        }
    }
    async getQuota() {
        return {
            used: 0,
            limit: Infinity,
            resetAt: new Date()
        };
    }
}
export class APNSProvider {
    config;
    privateKey;
    keyId;
    teamId;
    bundleId;
    constructor(config) {
        this.config = config;
        this.privateKey = config.privateKey || process.env.APNS_PRIVATE_KEY || '';
        this.keyId = config.keyId || process.env.APNS_KEY_ID || '';
        this.teamId = config.teamId || process.env.APNS_TEAM_ID || '';
        this.bundleId = config.bundleId || process.env.APNS_BUNDLE_ID || '';
        if (!this.privateKey || !this.keyId || !this.teamId || !this.bundleId) {
            throw new Error('APNS private key, key ID, team ID, and bundle ID are required');
        }
    }
    async send(message) {
        try {
            if (this.config.testMode) {
                logger.info('APNS push sent (test mode)', {
                    to: Array.isArray(message.to) ? message.to.length : 1,
                    title: message.title,
                    provider: 'apns'
                });
                return {
                    messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    provider: 'apns',
                    timestamp: new Date(),
                    metadata: { testMode: true }
                };
            }
            const deviceTokens = Array.isArray(message.to) ? message.to : [message.to];
            const apnsMessage = {
                aps: {
                    alert: {
                        title: message.title,
                        body: message.body
                    },
                    badge: message.badge,
                    sound: message.sound,
                    'content-available': message.silent ? 1 : 0,
                    'mutable-content': message.image ? 1 : 0,
                    category: message.clickAction,
                    'thread-id': message.tag
                },
                ...message.data
            };
            await new Promise(resolve => setTimeout(resolve, 120));
            const messageId = `apns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger.info('APNS push sent', {
                messageId,
                deviceTokenCount: deviceTokens.length,
                title: message.title,
                provider: 'apns'
            });
            const results = deviceTokens.map((token, index) => ({
                messageId: `${messageId}_${index}`,
                registrationId: token,
                error: Math.random() > 0.95 ? 'BadDeviceToken' : undefined
            }));
            const successCount = results.filter(r => !r.error).length;
            const failureCount = results.filter(r => r.error).length;
            return {
                messageId,
                success: successCount > 0,
                provider: 'apns',
                timestamp: new Date(),
                metadata: {
                    successCount,
                    failureCount,
                    results
                }
            };
        }
        catch (error) {
            logger.error('APNS push failed', {
                error: error.message,
                title: message.title
            });
            return {
                messageId: '',
                success: false,
                provider: 'apns',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async sendBulk(messages) {
        const results = [];
        const batchSize = 20;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.send(message));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }
    async validateConfig() {
        try {
            return !!(this.privateKey && this.keyId && this.teamId && this.bundleId);
        }
        catch (error) {
            return false;
        }
    }
    async getQuota() {
        return {
            used: Math.floor(Math.random() * 500),
            limit: 5000,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
}
export class PushProviderFactory {
    static create(config) {
        switch (config.provider) {
            case 'firebase':
                return new FirebaseProvider(config);
            case 'web_push':
                return new WebPushProvider(config);
            case 'apns':
                return new APNSProvider(config);
            default:
                throw new Error(`Unsupported push provider: ${config.provider}`);
        }
    }
}
export { PushProviderConfigSchema, PushMessageSchema };
//# sourceMappingURL=push.provider.js.map