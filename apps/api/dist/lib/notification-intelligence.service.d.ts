import { NotificationPreferences, Notification, NotificationAnalytics, UpdateNotificationPreferencesRequest, SendNotificationRequest, NotificationStats } from './quiet-hours-types.js';
export declare class NotificationIntelligenceService {
    private preferences;
    private notifications;
    private analytics;
    constructor();
    getNotificationPreferences(userId: string, organizationId: string): Promise<NotificationPreferences | null>;
    updateNotificationPreferences(userId: string, organizationId: string, request: UpdateNotificationPreferencesRequest): Promise<NotificationPreferences>;
    sendNotification(request: SendNotificationRequest): Promise<Notification>;
    getNotificationHistory(userId: string, limit?: number): Promise<Notification[]>;
    getNotificationAnalytics(organizationId: string): Promise<NotificationAnalytics>;
    getNotificationStats(organizationId: string): Promise<NotificationStats>;
    markNotificationAsRead(notificationId: string): Promise<Notification | null>;
    sendDigestNotification(userId: string, organizationId: string): Promise<Notification>;
    private initializeDefaultPreferences;
    private getDefaultChannels;
    private getDefaultQuietHoursSettings;
    private getDefaultEscalationSettings;
    private getDefaultDigestSettings;
    private determineChannels;
    private evaluateFilter;
    private filterChannelsByQuietHours;
    private isQuietHours;
    private deliverNotification;
    private deliverToChannel;
    private calculateAverageDeliveryTime;
    private calculateAverageReadTime;
    private calculateChannelStats;
    private calculateTimeStats;
    private calculateErrorStats;
    private generateDigestContent;
    private generateId;
}
//# sourceMappingURL=notification-intelligence.service.d.ts.map