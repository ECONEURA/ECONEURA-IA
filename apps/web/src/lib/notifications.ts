// ============================================================================
// CLIENTE DEL SISTEMA DE NOTIFICACIONES - BFF
// ============================================================================

// ============================================================================
// INTERFACES
// ============================================================================

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

// ============================================================================
// CLIENTE PRINCIPAL
// ============================================================================

class WebNotificationSystem {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/notifications';
    console.log('WebNotificationSystem initialized (client-side)');
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }

  async getTemplate(id: string): Promise<NotificationTemplate | null> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting notification template:', error);
      throw error;
    }
  }

  async listTemplates(orgId: string): Promise<NotificationTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/templates?orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing notification templates:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICACIONES
  // ============================================================================

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotification(id: string): Promise<Notification | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting notification:', error);
      throw error;
    }
  }

  async listNotifications(userId: string, orgId: string, filters?: {
    status?: string;
    type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    try {
      const params = new URLSearchParams({
        userId,
        orgId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.limit && { limit: filters.limit.toString() }),
        ...(filters?.offset && { offset: filters.offset.toString() })
      });

      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing notifications:', error);
      throw error;
    }
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string, orgId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, orgId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // ============================================================================
  // PREFERENCIAS
  // ============================================================================

  async getPreferences(userId: string, orgId: string): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences?userId=${userId}&orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  async updatePreferences(userId: string, orgId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, orgId, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // ============================================================================
  // ENVÍO
  // ============================================================================

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendBulkNotifications(notifications: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Notification[]> {
    try {
      const response = await fetch(`${this.baseUrl}/send/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifications }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  async scheduleNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>, scheduledAt: Date): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification, scheduledAt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  async getStatistics(orgId: string): Promise<NotificationStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats?orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  async getUnreadCount(userId: string, orgId: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/unread-count?userId=${userId}&orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILIDADES DE UI
  // ============================================================================

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'alert':
        return '🚨';
      case 'reminder':
        return '⏰';
      case 'update':
        return '🔄';
      case 'announcement':
        return '📢';
      default:
        return '📧';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'alert':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'reminder':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'update':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'announcement':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'delivered':
        return 'text-blue-600 bg-blue-100';
      case 'read':
        return 'text-gray-600 bg-gray-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  getChannelIcon(channel: string): string {
    switch (channel) {
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      case 'push':
        return '🔔';
      case 'in_app':
        return '💬';
      case 'webhook':
        return '🔗';
      default:
        return '📢';
    }
  }

  getChannelLabel(channel: string): string {
    switch (channel) {
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      case 'push':
        return 'Push';
      case 'in_app':
        return 'In-App';
      case 'webhook':
        return 'Webhook';
      default:
        return channel;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'info':
        return 'Information';
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'alert':
        return 'Alert';
      case 'reminder':
        return 'Reminder';
      case 'update':
        return 'Update';
      case 'announcement':
        return 'Announcement';
      default:
        return type;
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }
}

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export const webNotificationSystem = new WebNotificationSystem();

