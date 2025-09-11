import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import Redis from 'ioredis';

export interface GraphSubscription {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
  clientState?: string;
}

export interface DeltaQueryResult {
  messages?: any[];
  deltaLink?: string;
  nextLink?: string;
}

export class GraphService {
  private client: Client;
  private redis: Redis;
  private baseNotificationUrl: string;

  constructor() {
    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true
    });
    this.baseNotificationUrl = process.env.GRAPH_NOTIFICATION_URL || 'https://your-domain.com/listen';

    // Initialize Microsoft Graph client (mock for now)
    // TODO: Implement proper authentication when Azure credentials are available
    this.client = {} as Client;
  }

  /**
   * Create Microsoft Graph subscription for mailbox changes
   */
  async createSubscription(mailbox: string, changeTypes: string[]): Promise<GraphSubscription> {
    try {
      const expirationDateTime = new Date();
      expirationDateTime.setHours(expirationDateTime.getHours() + 71); // 71 hours < 72h limit

      const subscription = {
        changeType: changeTypes.join(','),
        notificationUrl: this.baseNotificationUrl,
        resource: `users/${mailbox}/messages`,
        expirationDateTime: expirationDateTime.toISOString(),
        clientState: `mailbox-${mailbox}-${Date.now()}`
      };

      // In a real implementation, this would call the actual Graph API
      // For simulation, we create a mock subscription
      const mockSubscription: GraphSubscription = {
        id: `sub_${Math.random().toString(36).substring(7)}`,
        resource: subscription.resource,
        changeType: subscription.changeType,
        notificationUrl: subscription.notificationUrl,
        expirationDateTime: subscription.expirationDateTime,
        clientState: subscription.clientState
      };

      // Store subscription in Redis
      await this.redis.hset('graph:subscriptions', mockSubscription.id, JSON.stringify({
        ...mockSubscription,
        mailbox,
        createdAt: new Date().toISOString()
      }));

      // Update metrics
      const currentSubs = await this.redis.hlen('graph:subscriptions');
      // TODO: Add metrics.subscriptions.set(currentSubs);

      console.log(`📞 Created subscription ${mockSubscription.id} for mailbox ${mailbox}`);
      
      return mockSubscription;

    } catch (error) {
      console.error('Failed to create subscription:', error);
      // TODO: Add metrics.graphErrors.inc({ error_type: 'subscription_create', status_code: '500' });
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all active subscriptions
   */
  async listSubscriptions(): Promise<GraphSubscription[]> {
    try {
      const subscriptions = await this.redis.hgetall('graph:subscriptions');
      
      return Object.values(subscriptions).map(sub => JSON.parse(sub));

    } catch (error) {
      console.error('Failed to list subscriptions:', error);
      // TODO: Add metrics.graphErrors.inc({ error_type: 'subscription_list', status_code: '500' });
      throw new Error(`Failed to list subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    try {
      // In real implementation, call Graph API to delete
      // await this.client.api(`/subscriptions/${subscriptionId}`).delete();

      // Remove from Redis
      await this.redis.hdel('graph:subscriptions', subscriptionId);

      // Update metrics
      const currentSubs = await this.redis.hlen('graph:subscriptions');
      // TODO: Add metrics.subscriptions.set(currentSubs);

      console.log(`🗑️ Deleted subscription ${subscriptionId}`);

    } catch (error) {
      console.error('Failed to delete subscription:', error);
      // TODO: Add metrics.graphErrors.inc({ error_type: 'subscription_delete', status_code: '500' });
      throw new Error(`Failed to delete subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Renew subscriptions that expire in < 72 hours
   */
  async renewExpiringSubscriptions(): Promise<void> {
    try {
      const subscriptions = await this.listSubscriptions();
      const now = new Date();
      const renewalThreshold = 72 * 60 * 60 * 1000; // 72 hours in ms

      for (const subscription of subscriptions) {
        const expirationTime = new Date(subscription.expirationDateTime);
        const timeToExpiration = expirationTime.getTime() - now.getTime();

        if (timeToExpiration < renewalThreshold) {
          console.log(`🔄 Renewing subscription ${subscription.id} (expires in ${Math.round(timeToExpiration / (60 * 60 * 1000))}h)`);
          
          // Extend expiration by 71 hours
          const newExpiration = new Date();
          newExpiration.setHours(newExpiration.getHours() + 71);

          // In real implementation: await this.client.api(`/subscriptions/${subscription.id}`).patch({ expirationDateTime: newExpiration.toISOString() });
          
          // Update in Redis
          const updatedSubscription = {
            ...subscription,
            expirationDateTime: newExpiration.toISOString(),
            renewedAt: new Date().toISOString()
          };

          await this.redis.hset('graph:subscriptions', subscription.id, JSON.stringify(updatedSubscription));
          
          console.log(`✅ Renewed subscription ${subscription.id} until ${newExpiration.toISOString()}`);
        }
      }

    } catch (error) {
      console.error('Failed to renew subscriptions:', error);
      // TODO: Add metrics.graphErrors.inc({ error_type: 'subscription_renew', status_code: '500' });
    }
  }

  /**
   * Execute delta query for a mailbox
   */
  async executeDeltaQuery(mailbox: string): Promise<DeltaQueryResult> {
    try {
      // Get stored deltaLink for this mailbox
      const deltaLinkKey = `delta:${mailbox}`;
      const storedDeltaLink = await this.redis.get(deltaLinkKey);

      let url: string;
      if (storedDeltaLink) {
        // Use stored deltaLink for incremental changes
        url = storedDeltaLink;
        console.log(`📥 Using delta query for ${mailbox}`);
      } else {
        // Initial delta query
        url = `/users/${mailbox}/messages/delta`;
        console.log(`📥 Initial delta query for ${mailbox}`);
      }

      // In real implementation, this would call the Graph API:
      // const response = await this.client.api(url).get();

      // Simulate Graph API response
      const mockResponse = {
        value: storedDeltaLink ? [] : [ // No new messages if using deltaLink
          {
            id: `msg_${Math.random().toString(36).substring(7)}`,
            internetMessageId: `<${Date.now()}@example.com>`,
            subject: 'Test email from delta query',
            from: { emailAddress: { address: 'test@example.com', name: 'Test User' } },
            receivedDateTime: new Date().toISOString(),
            bodyPreview: 'This is a test email body preview...',
            hasAttachments: false,
            importance: 'normal',
            isRead: false
          }
        ],
        '@odata.deltaLink': `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/delta?$deltatoken=new_token_${Date.now()}`
      };

      // Store new deltaLink
      if (mockResponse['@odata.deltaLink']) {
        await this.redis.set(deltaLinkKey, mockResponse['@odata.deltaLink']);
        console.log(`💾 Updated deltaLink for ${mailbox}`);
      }

      // Update metrics
      // TODO: Add metrics.deltaQueries.inc({ mailbox, status: 'success' });

      return {
        messages: mockResponse.value,
        deltaLink: mockResponse['@odata.deltaLink'],
        nextLink: (mockResponse as any)['@odata.nextLink']
      };

    } catch (error) {
      console.error(`Failed to execute delta query for ${mailbox}:`, error);
      // TODO: Add metrics.deltaQueries.inc({ mailbox, status: 'error' });
      // TODO: Add metrics.graphErrors.inc({ error_type: 'delta_query', status_code: '500' });
      throw new Error(`Delta query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of monitored mailboxes
   */
  async getMonitoredMailboxes(): Promise<string[]> {
    try {
      // Get mailboxes from active subscriptions
      const subscriptions = await this.listSubscriptions();
      const mailboxes = new Set<string>();

      for (const sub of subscriptions) {
        const match = sub.resource.match(/users\/([^/]+)\/messages/);
        if (match) {
          mailboxes.add(match[1]);
        }
      }

      return Array.from(mailboxes);

    } catch (error) {
      console.error('Failed to get monitored mailboxes:', error);
      return [];
    }
  }

  /**
   * Get email by ID with exponential backoff for rate limiting
   */
  async getEmailById(mailbox: string, messageId: string, retryCount: number = 0): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      // In real implementation: const message = await this.client.api(`/users/${mailbox}/messages/${messageId}`).get();
      
      // Simulate API call
      const mockMessage = {
        id: messageId,
        internetMessageId: `<${messageId}@example.com>`,
        subject: 'Retrieved email',
        from: { emailAddress: { address: 'sender@example.com' } },
        body: { content: 'Email content...' },
        receivedDateTime: new Date().toISOString()
      };

      return mockMessage;

    } catch (error: any) {
      const statusCode = error.code || error.status || 500;

      // Handle rate limiting (429) and server errors (5xx) with exponential backoff
      if ((statusCode === 429 || statusCode >= 500) && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⏳ Rate limited/server error, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        // TODO: Add metrics.graphErrors.inc({ error_type: 'rate_limit', status_code: statusCode.toString() });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getEmailById(mailbox, messageId, retryCount + 1);
      }

      // Non-retryable error or max retries exceeded
      console.error(`Failed to get email ${messageId} from ${mailbox}:`, error);
      // TODO: Add metrics.graphErrors.inc({ error_type: 'get_email', status_code: statusCode.toString() });
      throw error;
    }
  }

  /**
   * Send email via Graph API
   */
  async sendEmail(mailbox: string, emailData: any): Promise<void> {
    try {
      // In real implementation:
      // await this.client.api(`/users/${mailbox}/sendMail`).post({ message: emailData });

      console.log(`📤 Sent email from ${mailbox}: ${emailData.subject}`);

    } catch (error) {
      console.error('Failed to send email:', error);
      // TODO: Add metrics.graphErrors.inc({ error_type: 'send_email', status_code: '500' });
      throw error;
    }
  }
}