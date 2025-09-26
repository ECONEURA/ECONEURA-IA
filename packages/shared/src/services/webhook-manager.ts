/**
 * Webhook Manager for ECONEURA
 * 
 * Manages webhook subscriptions, delivery, retries, and security/
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

export interface WebhookSubscription {;
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

export interface WebhookEvent {;
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  source: string;
  version: string;
}

export interface WebhookDelivery {;
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

export class WebhookManager extends EventEmitter {;
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private axiosInstance: AxiosInstance;
  private retryInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {/
        'User-Agent': 'ECONEURA-WebhookManager/1.0.0'
      }
    });

    this.startRetryProcessor();
  }
/
  /**
   * Subscribe to webhook events/
   */
  subscribe(subscription: Omit<WebhookSubscription, 'id' | 'createdAt' | 'failureCount'>): string {
    const id = this.generateSubscriptionId();
    const fullSubscription: WebhookSubscription = {;
      ...subscription,
      id,
      createdAt: new Date(),
      failureCount: 0
    };

    this.subscriptions.set(id, fullSubscription);
    this.emit('subscriptionCreated', fullSubscription);

    
    return id;
  }
/
  /**
   * Unsubscribe from webhook events/
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      this.emit('subscriptionDeleted', subscription);
      
      return true;
    }
    return false;
  }
/
  /**
   * Update webhook subscription/
   */
  updateSubscription(subscriptionId: string, updates: Partial<WebhookSubscription>): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      Object.assign(subscription, updates);
      this.emit('subscriptionUpdated', subscription);
      return true;
    }
    return false;
  }
/
  /**
   * Get webhook subscription/
   */
  getSubscription(subscriptionId: string): WebhookSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }
/
  /**
   * Get all subscriptions for an event type/
   */
  getSubscriptionsForEvent(eventType: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.active && sub.events.includes(eventType)
    );
  }
/
  /**
   * Emit webhook event/
   */
  async emitEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: WebhookEvent = {;
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    this.emit('eventEmitted', fullEvent);
/
    // Find all subscriptions for this event type
    const subscriptions = this.getSubscriptionsForEvent(fullEvent.type);
    
    if (subscriptions.length === 0) {
      
      return;
    }
/
    // Create delivery records for each subscription
    for (const subscription of subscriptions) {
      await this.createDelivery(subscription, fullEvent);
    }
  }
/
  /**
   * Create webhook delivery/
   */
  private async createDelivery(subscription: WebhookSubscription, event: WebhookEvent): Promise<void> {
    const deliveryId = this.generateDeliveryId();
    const delivery: WebhookDelivery = {;
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
/
    // Attempt immediate delivery
    await this.deliverWebhook(delivery, event, subscription);
  }
/
  /**
   * Deliver webhook/
   */
  private async deliverWebhook(
    delivery: WebhookDelivery,
    event: WebhookEvent,
    subscription: WebhookSubscription
  ): Promise<void> {
    delivery.attempts++;
    delivery.lastAttemptAt = new Date();
    delivery.status = 'retrying';

    try {
      const payload = {;
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        source: event.source,
        version: event.version
      };

      const signature = this.generateSignature(JSON.stringify(payload), subscription.secret);
      
      const response = await this.axiosInstance.post(subscription.url, payload, {;
        headers: {/
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-Delivery': delivery.id,
          ...subscription.headers
        }
      });
/
      // Success
      delivery.status = 'delivered';
      delivery.responseCode = response.status;
      delivery.responseTime = Date.now() - delivery.lastAttemptAt.getTime();
      subscription.lastDelivery = new Date();
      subscription.failureCount = 0;

      this.emit('deliverySucceeded', { delivery, event, subscription });

    } catch (error) {/
      // Failure
      delivery.lastError = error instanceof Error ? error.message : 'Unknown error';
      delivery.responseCode = (error as any)?.response?.status;

      if (delivery.attempts >= delivery.maxAttempts) {
        delivery.status = 'failed';
        subscription.failureCount++;
        this.emit('deliveryFailed', { delivery, event, subscription });
      } else {/
        // Schedule retry
        const delay = this.calculateRetryDelay(delivery.attempts, subscription.retryPolicy);
        delivery.nextRetryAt = new Date(Date.now() + delay);
        this.emit('deliveryRetryScheduled', { delivery, event, subscription, delay });
      }
    }
  }
/
  /**
   * Calculate retry delay with exponential backoff/
   */
  private calculateRetryDelay(attempt: number, retryPolicy: WebhookSubscription['retryPolicy']): number {
    const baseDelay = retryPolicy.retryDelay;
    const multiplier = retryPolicy.backoffMultiplier;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }
/
  /**
   * Generate webhook signature/
   */
  private generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }
/
  /**
   * Verify webhook signature/
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
/
  /**
   * Start retry processor/
   */
  private startRetryProcessor(): void {
    this.retryInterval = setInterval(() => {
      this.processRetries();/
    }, 10000); // Check every 10 seconds
  }
/
  /**
   * Process pending retries/
   */
  private async processRetries(): Promise<void> {
    const now = new Date();
    const pendingDeliveries = Array.from(this.deliveries.values()).filter(;
      delivery => delivery.status === 'retrying' && 
                  delivery.nextRetryAt && 
                  delivery.nextRetryAt <= now
    );

    for (const delivery of pendingDeliveries) {
      const subscription = this.subscriptions.get(delivery.subscriptionId);
      if (!subscription) continue;
/
      // Find the original event (in a real implementation, you'd store this)';
      const event: WebhookEvent = {;
        id: delivery.eventId,/
        type: 'retry', // This would be the actual event type
        data: {},
        timestamp: new Date(),
        source: 'webhook-manager',
        version: '1.0.0'
      };

      await this.deliverWebhook(delivery, event, subscription);
    }
  }
/
  /**
   * Get delivery statistics/
   */
  getStats(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalDeliveries: number;
    pendingDeliveries: number;
    failedDeliveries: number;
    deliveredDeliveries: number;
  } {
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
/
  /**
   * Cleanup old deliveries/
   */
  cleanupOldDeliveries(olderThanDays: number = 7): void {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, delivery] of this.deliveries.entries()) {
      if (delivery.lastAttemptAt && delivery.lastAttemptAt < cutoffDate) {
        this.deliveries.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {/
      // Cleanup completed
    }
  }
/
  /**
   * Generate IDs/
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeliveryId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
/
  /**
   * Cleanup/
   */
  destroy(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    this.removeAllListeners();
  }
}
/
// Singleton instance
export const webhookManager = new WebhookManager();
/