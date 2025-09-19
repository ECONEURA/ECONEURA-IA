export class NotificationIntelligenceService {
    preferences = new Map();
    notifications = new Map();
    analytics = new Map();
    constructor() {
        this.initializeDefaultPreferences();
    }
    async getNotificationPreferences(userId, organizationId) {
        const key = `${userId}_${organizationId}`;
        return this.preferences.get(key) || null;
    }
    async updateNotificationPreferences(userId, organizationId, request) {
        const key = `${userId}_${organizationId}`;
        const existing = this.preferences.get(key);
        const now = new Date();
        const preferences = {
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
    async sendNotification(request) {
        const notificationId = this.generateId();
        const now = new Date();
        const preferences = await this.getNotificationPreferences(request.userId, 'org_1');
        const channels = this.determineChannels(request, preferences);
        const allowedChannels = await this.filterChannelsByQuietHours(channels, preferences);
        const notification = {
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
        await this.deliverNotification(notification);
        return notification;
    }
    async getNotificationHistory(userId, limit = 50) {
        const history = Array.from(this.notifications.values())
            .filter(notification => notification.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
        return history;
    }
    async getNotificationAnalytics(organizationId) {
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
    async getNotificationStats(organizationId) {
        const analytics = await this.getNotificationAnalytics(organizationId);
        const channelEffectiveness = {};
        analytics.channelStats.forEach(stat => {
            channelEffectiveness[stat.channel] = stat.deliveryRate;
        });
        return {
            totalNotifications: analytics.totalSent,
            deliveryRate: analytics.deliveryRate,
            readRate: analytics.readRate,
            averageDeliveryTime: analytics.averageDeliveryTime,
            channelEffectiveness,
            userSatisfaction: 88
        };
    }
    async markNotificationAsRead(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) {
            return null;
        }
        notification.readAt = new Date();
        this.notifications.set(notificationId, notification);
        return notification;
    }
    async sendDigestNotification(userId, organizationId) {
        const preferences = await this.getNotificationPreferences(userId, organizationId);
        if (!preferences?.digest.enabled) {
            throw new Error('Digest notifications are disabled for this user');
        }
        const recentNotifications = await this.getNotificationHistory(userId, 10);
        const digestContent = this.generateDigestContent(recentNotifications);
        const request = {
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
    initializeDefaultPreferences() {
        const defaultPreferences = {
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
    getDefaultChannels() {
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
    getDefaultQuietHoursSettings() {
        return {
            enabled: true,
            allowCritical: true,
            allowEscalation: true,
            maxFrequency: 2,
            channels: ['sms', 'call']
        };
    }
    getDefaultEscalationSettings() {
        return {
            enabled: true,
            maxLevel: 3,
            channels: ['email', 'sms', 'call'],
            timeoutMinutes: 15
        };
    }
    getDefaultDigestSettings() {
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
    determineChannels(request, preferences) {
        if (!preferences) {
            return this.getDefaultChannels();
        }
        return preferences.channels.filter(channel => {
            if (!channel.enabled)
                return false;
            if (channel.filters && channel.filters.length > 0) {
                return channel.filters.some(filter => this.evaluateFilter(filter, request));
            }
            return true;
        });
    }
    evaluateFilter(filter, request) {
        switch (filter.type) {
            case 'severity': {
                const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
                const requestLevel = severityLevels[request.severity] || 0;
                const filterLevel = severityLevels[filter.value] || 0;
                switch (filter.operator) {
                    case 'equals': return requestLevel === filterLevel;
                    case 'greater_than': return requestLevel > filterLevel;
                    case 'less_than': return requestLevel < filterLevel;
                    default: return false;
                }
            }
            case 'service':
                if (!request.metadata?.service)
                    return false;
                switch (filter.operator) {
                    case 'equals': return request.metadata.service === filter.value;
                    case 'contains': return request.metadata.service.includes(filter.value);
                    default: return false;
                }
            default:
                return true;
        }
    }
    async filterChannelsByQuietHours(channels, preferences) {
        if (!preferences?.quietHours.enabled) {
            return channels;
        }
        const isQuietHours = this.isQuietHours();
        if (!isQuietHours) {
            return channels;
        }
        return channels.filter(channel => {
            if (preferences.quietHours.channels.includes(channel.type)) {
                return true;
            }
            if (preferences.quietHours.allowCritical) {
                return true;
            }
            return false;
        });
    }
    isQuietHours() {
        const hour = new Date().getHours();
        return hour >= 22 || hour <= 6;
    }
    async deliverNotification(notification) {
        for (const channel of notification.channels) {
            try {
                await this.deliverToChannel(notification, channel);
            }
            catch (error) {
                console.error(`Failed to deliver notification ${notification.id} to channel ${channel.type}:`, error);
                notification.retryCount++;
                if (notification.retryCount < notification.maxRetries) {
                    setTimeout(() => this.deliverToChannel(notification, channel), 5000);
                }
                else {
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
    async deliverToChannel(notification, channel) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        const success = Math.random() > 0.1;
        if (!success) {
            throw new Error(`Delivery failed to ${channel.type}`);
        }
    }
    calculateAverageDeliveryTime(notifications) {
        const deliveredNotifications = notifications.filter(n => n.deliveredAt);
        if (deliveredNotifications.length === 0)
            return 0;
        const totalTime = deliveredNotifications.reduce((sum, n) => {
            if (n.deliveredAt) {
                return sum + (n.deliveredAt.getTime() - n.createdAt.getTime());
            }
            return sum;
        }, 0);
        return totalTime / deliveredNotifications.length / 1000;
    }
    calculateAverageReadTime(notifications) {
        const readNotifications = notifications.filter(n => n.readAt);
        if (readNotifications.length === 0)
            return 0;
        const totalTime = readNotifications.reduce((sum, n) => {
            if (n.readAt && n.deliveredAt) {
                return sum + (n.readAt.getTime() - n.deliveredAt.getTime());
            }
            return sum;
        }, 0);
        return totalTime / readNotifications.length / 1000;
    }
    calculateChannelStats(notifications) {
        const channelMap = new Map();
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
                }
                else if (notification.status === 'failed') {
                    existing.failed++;
                }
                channelMap.set(channel.type, existing);
            });
        });
        channelMap.forEach(stats => {
            stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
            stats.averageDeliveryTime = 1.5;
        });
        return Array.from(channelMap.values());
    }
    calculateTimeStats(notifications) {
        const hourMap = new Map();
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
            const stats = hourMap.get(hour);
            stats.sent++;
            if (notification.status === 'delivered') {
                stats.delivered++;
            }
            if (notification.readAt) {
                stats.read++;
            }
        });
        hourMap.forEach(stats => {
            stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
            stats.readRate = stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0;
        });
        return Array.from(hourMap.values());
    }
    calculateErrorStats(notifications) {
        const errorMap = new Map();
        notifications.forEach(notification => {
            if (notification.status === 'failed') {
                const error = 'Delivery failed';
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
        errorMap.forEach(stats => {
            stats.percentage = totalErrors > 0 ? (stats.count / totalErrors) * 100 : 0;
        });
        return Array.from(errorMap.values());
    }
    generateDigestContent(notifications) {
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
    generateId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=notification-intelligence.service.js.map