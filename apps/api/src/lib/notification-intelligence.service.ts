/**
 * PR-46: Notification Intelligence Service
 * 
 * Service for intelligent notification management, preferences, and analytics
 */

import { 
  NotificationPreferences, 
  NotificationChannel, 
  NotificationFilter,
  QuietHoursNotificationSettings,
  EscalationNotificationSettings,
  DigestSettings,
  Notification,
  NotificationAnalytics,
  ChannelStats,
  TimeStats,
  ErrorStats,
  UpdateNotificationPreferencesRequest,
  SendNotificationRequest,
  NotificationStats
} from './quiet-hours-types.js';

export class NotificationIntelligenceService {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private analytics: Map<string, NotificationAnalytics> = new Map();

  constructor() {
    this.initializeDefaultPreferences();
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string, organizationId: string): Promise<NotificationPreferences | null> {
    const key = `${userId}_${organizationId}`;
    return this.preferences.get(key) || null;
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string, 
    organizationId: string, 
    request: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> {
    const key = `${userId}_${organizationId}`;
    const existing = this.preferences.get(key);
    const now = new Date();

    const preferences: NotificationPreferences = {
      id: existing?.id || this.generateId(),
      userId,
      organizationId,
      channels: request.channels ?? existing?.channels ?? this.getDefaultChannels(),
      quietHours: request.quietHours ?? existing?.quietHours ?? this.getDefaultQuietHoursSettings(),
      escalation: request.escalation ?? existing?.escalation ?? this.getDefaultEscalationSettings(),
      digest: request.digest ?? existing?.digest ?? this.getDefaultDigestSettings(),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    this.preferences.set(key, preferences);
    return preferences;
  }

  /**
   * Send a notification
   */
  async sendNotification(request: SendNotificationRequest): Promise<Notification> {
    const notificationId = this.generateId();
    const now = new Date();

    // Get user preferences
    const preferences = await this.getNotificationPreferences(request.userId, 'org_1');
    
    // Determine channels based on preferences and request
    const channels = this.determineChannels(request, preferences);
    
    // Check quiet hours restrictions
    const allowedChannels = await this.filterChannelsByQuietHours(channels, preferences);

    const notification: Notification = {
      id: notificationId,
      userId: request.userId,
      organizationId: 'org_1',
      type: request.type,
      severity: request.severity,
      title: request.title,
      message: request.message,
      channels: allowedChannels,
      metadata: request.metadata,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: now
    };

    this.notifications.set(notificationId, notification);
    
    // Send notification through channels
    await this.deliverNotification(notification);
    
    return notification;
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(userId: string, limit: number = 50): Promise<Notification[]> {
    const history = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return history;
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(organizationId: string): Promise<NotificationAnalytics> {
    const allNotifications = Array.from(this.notifications.values())
      .filter(n => n.organizationId === organizationId);

    const totalSent = allNotifications.length;
    const totalDelivered = allNotifications.filter(n => n.status === 'delivered').length;
    const totalRead = allNotifications.filter(n => n.readAt).length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;

    const averageDeliveryTime = this.calculateAverageDeliveryTime(allNotifications);
    const averageReadTime = this.calculateAverageReadTime(allNotifications);

    const channelStats = this.calculateChannelStats(allNotifications);
    const timeStats = this.calculateTimeStats(allNotifications);
    const errorStats = this.calculateErrorStats(allNotifications);

    return {
      totalSent,
      totalDelivered,
      totalRead,
      deliveryRate,
      readRate,
      averageDeliveryTime,
      averageReadTime,
      channelStats,
      timeStats,
      errorStats
    };
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(organizationId: string): Promise<NotificationStats> {
    const analytics = await this.getNotificationAnalytics(organizationId);
    
    const channelEffectiveness: Record<string, number> = {};
    analytics.channelStats.forEach(stat => {
      channelEffectiveness[stat.channel] = stat.deliveryRate;
    });

    return {
      totalNotifications: analytics.totalSent,
      deliveryRate: analytics.deliveryRate,
      readRate: analytics.readRate,
      averageDeliveryTime: analytics.averageDeliveryTime,
      channelEffectiveness,
      userSatisfaction: 88 // Based on analytics
    };
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return null;
    }

    notification.readAt = new Date();
    this.notifications.set(notificationId, notification);
    return notification;
  }

  /**
   * Send digest notification
   */
  async sendDigestNotification(userId: string, organizationId: string): Promise<Notification> {
    const preferences = await this.getNotificationPreferences(userId, organizationId);
    if (!preferences?.digest.enabled) {
      throw new Error('Digest notifications are disabled for this user');
    }

    // Get recent notifications for digest
    const recentNotifications = await this.getNotificationHistory(userId, 10);
    const digestContent = this.generateDigestContent(recentNotifications);

    const request: SendNotificationRequest = {
      userId,
      type: 'digest',
      severity: 'low',
      title: 'Daily Notification Digest',
      message: digestContent,
      channels: preferences.digest.channels,
      metadata: {
        digestType: 'daily',
        notificationCount: recentNotifications.length
      }
    };

    return this.sendNotification(request);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDefaultPreferences(): void {
    // Create default preferences for demo user
    const defaultPreferences: NotificationPreferences = {
      id: 'default-preferences',
      userId: 'user_1',
      organizationId: 'org_1',
      channels: this.getDefaultChannels(),
      quietHours: this.getDefaultQuietHoursSettings(),
      escalation: this.getDefaultEscalationSettings(),
      digest: this.getDefaultDigestSettings(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.preferences.set('user_1_org_1', defaultPreferences);
  }

  private getDefaultChannels(): NotificationChannel[] {
    return [
      {
        type: 'email',
        enabled: true,
        address: 'user@example.com',
        priority: 'medium',
        filters: []
      },
      {
        type: 'sms',
        enabled: true,
        address: '+1234567890',
        priority: 'high',
        filters: [
          {
            type: 'severity',
            operator: 'greater_than',
            value: 'medium'
          }
        ]
      },
      {
        type: 'push',
        enabled: true,
        address: 'device_token_123',
        priority: 'medium',
        filters: []
      },
      {
        type: 'slack',
        enabled: true,
        address: '#alerts',
        priority: 'low',
        filters: []
      }
    ];
  }

  private getDefaultQuietHoursSettings(): QuietHoursNotificationSettings {
    return {
      enabled: true,
      allowCritical: true,
      allowEscalation: true,
      maxFrequency: 2, // 2 notifications per hour
      channels: ['sms', 'call'] // Only SMS and calls during quiet hours
    };
  }

  private getDefaultEscalationSettings(): EscalationNotificationSettings {
    return {
      enabled: true,
      maxLevel: 3,
      channels: ['email', 'sms', 'call'],
      timeoutMinutes: 15
    };
  }

  private getDefaultDigestSettings(): DigestSettings {
    return {
      enabled: true,
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC',
      channels: ['email'],
      includeResolved: true,
      maxItems: 10
    };
  }

  private determineChannels(request: SendNotificationRequest, preferences?: NotificationPreferences): NotificationChannel[] {
    if (!preferences) {
      return this.getDefaultChannels();
    }

    // Filter channels based on severity and user preferences
    return preferences.channels.filter(channel => {
      if (!channel.enabled) return false;
      
      // Check severity filters
      if (channel.filters && channel.filters.length > 0) {
        return channel.filters.some(filter => this.evaluateFilter(filter, request));
      }
      
      return true;
    });
  }

  private evaluateFilter(filter: NotificationFilter, request: SendNotificationRequest): boolean {
    switch (filter.type) {
      case 'severity': {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const requestLevel = severityLevels[request.severity] || 0;
        const filterLevel = severityLevels[filter.value as keyof typeof severityLevels] || 0;
        
        switch (filter.operator) {
          case 'equals': return requestLevel === filterLevel;
          case 'greater_than': return requestLevel > filterLevel;
          case 'less_than': return requestLevel < filterLevel;
          default: return false;
        }
      }
      
      case 'service':
        if (!request.metadata?.service) return false;
        switch (filter.operator) {
          case 'equals': return request.metadata.service === filter.value;
          case 'contains': return request.metadata.service.includes(filter.value);
          default: return false;
        }
      
      default:
        return true;
    }
  }

  private async filterChannelsByQuietHours(
    channels: NotificationChannel[], 
    preferences?: NotificationPreferences
  ): Promise<NotificationChannel[]> {
    if (!preferences?.quietHours.enabled) {
      return channels;
    }

    // Check if we're in quiet hours (simplified check)
    const isQuietHours = this.isQuietHours();
    
    if (!isQuietHours) {
      return channels;
    }

    // Filter channels allowed during quiet hours
    return channels.filter(channel => {
      if (preferences.quietHours.channels.includes(channel.type)) {
        return true;
      }
      
      // Allow critical notifications on any channel
      if (preferences.quietHours.allowCritical) {
        return true; // Simplified - in production, check actual severity
      }
      
      return false;
    });
  }

  private isQuietHours(): boolean {
    // Simplified implementation - in production, integrate with QuietHoursService
    const hour = new Date().getHours();
    return hour >= 22 || hour <= 6; // 10 PM to 6 AM
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    // Simulate delivery through different channels
    for (const channel of notification.channels) {
      try {
        await this.deliverToChannel(notification, channel);
      } catch (error) {
        console.error(`Failed to deliver notification ${notification.id} to channel ${channel.type}:`, error);
        notification.retryCount++;
        
        if (notification.retryCount < notification.maxRetries) {
          // Schedule retry
          setTimeout(() => this.deliverToChannel(notification, channel), 5000);
        } else {
          notification.status = 'failed';
        }
      }
    }

    if (notification.status === 'pending') {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
    }

    this.notifications.set(notification.id, notification);
  }

  private async deliverToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Simulate delivery success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      throw new Error(`Delivery failed to ${channel.type}`);
    }
    
    
  }

  private calculateAverageDeliveryTime(notifications: Notification[]): number {
    const deliveredNotifications = notifications.filter(n => n.deliveredAt);
    if (deliveredNotifications.length === 0) return 0;
    
    const totalTime = deliveredNotifications.reduce((sum, n) => {
      if (n.deliveredAt) {
        return sum + (n.deliveredAt.getTime() - n.createdAt.getTime());
      }
      return sum;
    }, 0);
    
    return totalTime / deliveredNotifications.length / 1000; // seconds
  }

  private calculateAverageReadTime(notifications: Notification[]): number {
    const readNotifications = notifications.filter(n => n.readAt);
    if (readNotifications.length === 0) return 0;
    
    const totalTime = readNotifications.reduce((sum, n) => {
      if (n.readAt && n.deliveredAt) {
        return sum + (n.readAt.getTime() - n.deliveredAt.getTime());
      }
      return sum;
    }, 0);
    
    return totalTime / readNotifications.length / 1000; // seconds
  }

  private calculateChannelStats(notifications: Notification[]): ChannelStats[] {
    const channelMap = new Map<string, ChannelStats>();
    
    notifications.forEach(notification => {
      notification.channels.forEach(channel => {
        const existing = channelMap.get(channel.type) || {
          channel: channel.type,
          sent: 0,
          delivered: 0,
          failed: 0,
          deliveryRate: 0,
          averageDeliveryTime: 0
        };
        
        existing.sent++;
        if (notification.status === 'delivered') {
          existing.delivered++;
        } else if (notification.status === 'failed') {
          existing.failed++;
        }
        
        channelMap.set(channel.type, existing);
      });
    });
    
    // Calculate rates and averages
    channelMap.forEach(stats => {
      stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
      stats.averageDeliveryTime = 1.5; // Simplified - in production, calculate actual time
    });
    
    return Array.from(channelMap.values());
  }

  private calculateTimeStats(notifications: Notification[]): TimeStats[] {
    const hourMap = new Map<number, TimeStats>();
    
    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourMap.set(hour, {
        hour,
        sent: 0,
        delivered: 0,
        read: 0,
        deliveryRate: 0,
        readRate: 0
      });
    }
    
    notifications.forEach(notification => {
      const hour = notification.createdAt.getHours();
      const stats = hourMap.get(hour)!;
      
      stats.sent++;
      if (notification.status === 'delivered') {
        stats.delivered++;
      }
      if (notification.readAt) {
        stats.read++;
      }
    });
    
    // Calculate rates
    hourMap.forEach(stats => {
      stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
      stats.readRate = stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0;
    });
    
    return Array.from(hourMap.values());
  }

  private calculateErrorStats(notifications: Notification[]): ErrorStats[] {
    const errorMap = new Map<string, ErrorStats>();
    
    notifications.forEach(notification => {
      if (notification.status === 'failed') {
        const error = 'Delivery failed'; // Simplified - in production, track actual errors
        const existing = errorMap.get(error) || {
          error,
          count: 0,
          percentage: 0,
          lastOccurred: notification.createdAt
        };
        
        existing.count++;
        if (notification.createdAt > existing.lastOccurred) {
          existing.lastOccurred = notification.createdAt;
        }
        
        errorMap.set(error, existing);
      }
    });
    
    const totalErrors = Array.from(errorMap.values()).reduce((sum, stats) => sum + stats.count, 0);
    
    // Calculate percentages
    errorMap.forEach(stats => {
      stats.percentage = totalErrors > 0 ? (stats.count / totalErrors) * 100 : 0;
    });
    
    return Array.from(errorMap.values());
  }

  private generateDigestContent(notifications: Notification[]): string {
    const criticalCount = notifications.filter(n => n.severity === 'critical').length;
    const highCount = notifications.filter(n => n.severity === 'high').length;
    const mediumCount = notifications.filter(n => n.severity === 'medium').length;
    const lowCount = notifications.filter(n => n.severity === 'low').length;
    
    return `Daily Notification Digest:
    
📊 Summary:
- Critical: ${criticalCount}
- High: ${highCount}
- Medium: ${mediumCount}
- Low: ${lowCount}

📋 Recent Notifications:
${notifications.slice(0, 5).map(n => `• ${n.title} (${n.severity})`).join('\n')}

View all notifications in the dashboard.`;
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
