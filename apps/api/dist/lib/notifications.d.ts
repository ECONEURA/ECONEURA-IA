export interface NotificationTemplate {
    id: string;
    name: string;
    description?: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'alert' | 'reminder' | 'update' | 'announcement';
    subject: string;
    body: string;
    variables?: string[];
    channels: ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Notification {
    id: string;
    userId: string;
    orgId: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'alert' | 'reminder' | 'update' | 'announcement';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    data?: Record<string, any>;
    channels: ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[];
    templateId?: string;
    status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
    scheduledAt?: Date;
    sentAt?: Date;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationPreferences {
    userId: string;
    orgId: string;
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
    webhook: boolean;
    quietHours?: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    preferences: Record<string, boolean>;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationStats {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
    recentActivity: {
        sent: number;
        failed: number;
        read: number;
    };
}
export interface INotificationSystem {
    createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate>;
    getTemplate(id: string): Promise<NotificationTemplate | null>;
    listTemplates(orgId: string): Promise<NotificationTemplate[]>;
    updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
    deleteTemplate(id: string): Promise<void>;
    createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
    getNotification(id: string): Promise<Notification | null>;
    listNotifications(userId: string, orgId: string, filters?: {
        status?: string;
        type?: string;
        priority?: string;
        limit?: number;
        offset?: number;
    }): Promise<Notification[]>;
    updateNotification(id: string, updates: Partial<Notification>): Promise<Notification>;
    deleteNotification(id: string): Promise<void>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(userId: string, orgId: string): Promise<void>;
    getPreferences(userId: string, orgId: string): Promise<NotificationPreferences>;
    updatePreferences(userId: string, orgId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
    sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
    sendBulkNotifications(notifications: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Notification[]>;
    scheduleNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>, scheduledAt: Date): Promise<Notification>;
    getStatistics(orgId: string): Promise<NotificationStats>;
    getUnreadCount(userId: string, orgId: string): Promise<number>;
    validateTemplate(template: NotificationTemplate): Promise<boolean>;
}
export declare class NotificationSystemImpl implements INotificationSystem {
    private templates;
    private notifications;
    private preferences;
    constructor();
    createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate>;
    getTemplate(id: string): Promise<NotificationTemplate | null>;
    listTemplates(orgId: string): Promise<NotificationTemplate[]>;
    updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
    deleteTemplate(id: string): Promise<void>;
    createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
    getNotification(id: string): Promise<Notification | null>;
    listNotifications(userId: string, orgId: string, filters?: {
        status?: string;
        type?: string;
        priority?: string;
        limit?: number;
        offset?: number;
    }): Promise<Notification[]>;
    updateNotification(id: string, updates: Partial<Notification>): Promise<Notification>;
    deleteNotification(id: string): Promise<void>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(userId: string, orgId: string): Promise<void>;
    getPreferences(userId: string, orgId: string): Promise<NotificationPreferences>;
    updatePreferences(userId: string, orgId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
    sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
    sendBulkNotifications(notifications: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Notification[]>;
    scheduleNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>, scheduledAt: Date): Promise<Notification>;
    getStatistics(orgId: string): Promise<NotificationStats>;
    getUnreadCount(userId: string, orgId: string): Promise<number>;
    validateTemplate(template: NotificationTemplate): Promise<boolean>;
    private initializeDefaultTemplates;
    private sendToChannel;
    private simulateEmailSend;
    private simulateSMSSend;
    private simulatePushSend;
    private simulateInAppSend;
    private simulateWebhookSend;
}
export declare const notificationSystem: NotificationSystemImpl;
//# sourceMappingURL=notifications.d.ts.map