import { EventEmitter } from 'events';
import crypto from 'crypto';
import axios from 'axios';
export class WebhookManager extends EventEmitter {
    subscriptions = new Map();
    deliveries = new Map();
    axiosInstance;
    retryInterval = null;
    constructor() {
        super();
        this.axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'ECONEURA-WebhookManager/1.0.0'
            }
        });
        this.startRetryProcessor();
    }
    subscribe(subscription) {
        const id = this.generateSubscriptionId();
        const fullSubscription = {
            ...subscription,
            id,
            createdAt: new Date(),
            failureCount: 0
        };
        this.subscriptions.set(id, fullSubscription);
        this.emit('subscriptionCreated', fullSubscription);
        return id;
    }
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            this.subscriptions.delete(subscriptionId);
            this.emit('subscriptionDeleted', subscription);
            return true;
        }
        return false;
    }
    updateSubscription(subscriptionId, updates) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            Object.assign(subscription, updates);
            this.emit('subscriptionUpdated', subscription);
            return true;
        }
        return false;
    }
    getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId);
    }
    getSubscriptionsForEvent(eventType) {
        return Array.from(this.subscriptions.values()).filter(sub => sub.active && sub.events.includes(eventType));
    }
    async emitEvent(event) {
        const fullEvent = {
            ...event,
            id: this.generateEventId(),
            timestamp: new Date()
        };
        this.emit('eventEmitted', fullEvent);
        const subscriptions = this.getSubscriptionsForEvent(fullEvent.type);
        if (subscriptions.length === 0) {
            return;
        }
        for (const subscription of subscriptions) {
            await this.createDelivery(subscription, fullEvent);
        }
    }
    async createDelivery(subscription, event) {
        const deliveryId = this.generateDeliveryId();
        const delivery = {
            id: deliveryId,
            subscriptionId: subscription.id,
            eventId: event.id,
            url: subscription.url,
            status: 'pending',
            attempts: 0,
            maxAttempts: subscription.retryPolicy.maxRetries + 1
        };
        this.deliveries.set(deliveryId, delivery);
        this.emit('deliveryCreated', delivery);
        await this.deliverWebhook(delivery, event, subscription);
    }
    async deliverWebhook(delivery, event, subscription) {
        delivery.attempts++;
        delivery.lastAttemptAt = new Date();
        delivery.status = 'retrying';
        try {
            const payload = {
                id: event.id,
                type: event.type,
                data: event.data,
                timestamp: event.timestamp.toISOString(),
                source: event.source,
                version: event.version
            };
            const signature = this.generateSignature(JSON.stringify(payload), subscription.secret);
            const response = await this.axiosInstance.post(subscription.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event.type,
                    'X-Webhook-Delivery': delivery.id,
                    ...subscription.headers
                }
            });
            delivery.status = 'delivered';
            delivery.responseCode = response.status;
            delivery.responseTime = Date.now() - delivery.lastAttemptAt.getTime();
            subscription.lastDelivery = new Date();
            subscription.failureCount = 0;
            this.emit('deliverySucceeded', { delivery, event, subscription });
        }
        catch (error) {
            delivery.lastError = error instanceof Error ? error.message : 'Unknown error';
            delivery.responseCode = error?.response?.status;
            if (delivery.attempts >= delivery.maxAttempts) {
                delivery.status = 'failed';
                subscription.failureCount++;
                this.emit('deliveryFailed', { delivery, event, subscription });
            }
            else {
                const delay = this.calculateRetryDelay(delivery.attempts, subscription.retryPolicy);
                delivery.nextRetryAt = new Date(Date.now() + delay);
                this.emit('deliveryRetryScheduled', { delivery, event, subscription, delay });
            }
        }
    }
    calculateRetryDelay(attempt, retryPolicy) {
        const baseDelay = retryPolicy.retryDelay;
        const multiplier = retryPolicy.backoffMultiplier;
        return baseDelay * Math.pow(multiplier, attempt - 1);
    }
    generateSignature(payload, secret) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        return `sha256=${hmac.digest('hex')}`;
    }
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    startRetryProcessor() {
        this.retryInterval = setInterval(() => {
            this.processRetries();
        }, 10000);
    }
    async processRetries() {
        const now = new Date();
        const pendingDeliveries = Array.from(this.deliveries.values()).filter(delivery => delivery.status === 'retrying' &&
            delivery.nextRetryAt &&
            delivery.nextRetryAt <= now);
        for (const delivery of pendingDeliveries) {
            const subscription = this.subscriptions.get(delivery.subscriptionId);
            if (!subscription)
                continue;
            const event = {
                id: delivery.eventId,
                type: 'retry',
                data: {},
                timestamp: new Date(),
                source: 'webhook-manager',
                version: '1.0.0'
            };
            await this.deliverWebhook(delivery, event, subscription);
        }
    }
    getStats() {
        const subscriptions = Array.from(this.subscriptions.values());
        const deliveries = Array.from(this.deliveries.values());
        return {
            totalSubscriptions: subscriptions.length,
            activeSubscriptions: subscriptions.filter(s => s.active).length,
            totalDeliveries: deliveries.length,
            pendingDeliveries: deliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length,
            failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
            deliveredDeliveries: deliveries.filter(d => d.status === 'delivered').length
        };
    }
    cleanupOldDeliveries(olderThanDays = 7) {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        let cleanedCount = 0;
        for (const [id, delivery] of this.deliveries.entries()) {
            if (delivery.lastAttemptAt && delivery.lastAttemptAt < cutoffDate) {
                this.deliveries.delete(id);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
        }
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateDeliveryId() {
        return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    destroy() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
        }
        this.removeAllListeners();
    }
}
export const webhookManager = new WebhookManager();
//# sourceMappingURL=webhook-manager.js.map