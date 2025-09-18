import { EventEmitter } from 'events';
export interface WebhookSubscription {
    id: string;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
    retryPolicy: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
    };
    headers: Record<string, string>;
    createdAt: Date;
    lastDelivery?: Date;
    failureCount: number;
}
export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    timestamp: Date;
    source: string;
    version: string;
}
export interface WebhookDelivery {
    id: string;
    subscriptionId: string;
    eventId: string;
    url: string;
    status: 'pending' | 'delivered' | 'failed' | 'retrying';
    attempts: number;
    maxAttempts: number;
    nextRetryAt?: Date;
    lastAttemptAt?: Date;
    lastError?: string;
    responseCode?: number;
    responseTime?: number;
}
export declare class WebhookManager extends EventEmitter {
    private subscriptions;
    private deliveries;
    private axiosInstance;
    private retryInterval;
    constructor();
    subscribe(subscription: Omit<WebhookSubscription, 'id' | 'createdAt' | 'failureCount'>): string;
    unsubscribe(subscriptionId: string): boolean;
    updateSubscription(subscriptionId: string, updates: Partial<WebhookSubscription>): boolean;
    getSubscription(subscriptionId: string): WebhookSubscription | undefined;
    getSubscriptionsForEvent(eventType: string): WebhookSubscription[];
    emitEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void>;
    private createDelivery;
    private deliverWebhook;
    private calculateRetryDelay;
    private generateSignature;
    verifySignature(payload: string, signature: string, secret: string): boolean;
    private startRetryProcessor;
    private processRetries;
    getStats(): {
        totalSubscriptions: number;
        activeSubscriptions: number;
        totalDeliveries: number;
        pendingDeliveries: number;
        failedDeliveries: number;
        deliveredDeliveries: number;
    };
    cleanupOldDeliveries(olderThanDays?: number): void;
    private generateSubscriptionId;
    private generateEventId;
    private generateDeliveryId;
    destroy(): void;
}
export declare const webhookManager: WebhookManager;
//# sourceMappingURL=webhook-manager.d.ts.map