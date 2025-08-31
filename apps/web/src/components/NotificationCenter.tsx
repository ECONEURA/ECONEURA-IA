'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// INTERFACES
// ============================================================================

interface NotificationTemplate {
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

interface Notification {
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

interface NotificationPreferences {
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

interface NotificationStats {
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
// COMPONENTE PRINCIPAL
// ============================================================================

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Estados para crear notificación
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    channels: ['in_app'] as ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[]
  });

  // Estados para crear template
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'info' as const,
    subject: '',
    body: '',
    variables: [] as string[],
    channels: ['in_app'] as ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[]
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    loadInitialData();
    
    // Configurar actualización automática
    refreshIntervalRef.current = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000); // Actualizar cada 30 segundos

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([
        loadNotifications(),
        loadTemplates(),
        loadPreferences(),
        loadStats(),
        loadUnreadCount()
      ]);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?userId=demo-user&orgId=demo-org');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/notifications/templates?orgId=demo-org');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences?userId=demo-user&orgId=demo-org');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats?orgId=demo-org');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count?userId=demo-user&orgId=demo-org');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  // ============================================================================
  // FUNCIONES DE ACCIÓN
  // ============================================================================

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'demo-user', orgId: 'demo-org' }),
      });

      if (response.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const createNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newNotification,
          userId: 'demo-user',
          orgId: 'demo-org'
        }),
      });

      if (response.ok) {
        setNewNotification({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          channels: ['in_app']
        });
        setIsCreatingNotification(false);
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        setNewTemplate({
          name: '',
          description: '',
          type: 'info',
          subject: '',
          body: '',
          variables: [],
          channels: ['in_app']
        });
        setIsCreatingTemplate(false);
        await loadTemplates();
      }
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user',
          orgId: 'demo-org',
          ...updates
        }),
      });

      if (response.ok) {
        await loadPreferences();
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  };

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'alert': return '🚨';
      case 'reminder': return '⏰';
      case 'update': return '🔄';
      case 'announcement': return '📢';
      default: return '📧';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'alert': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'reminder': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'update': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'announcement': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-blue-600 bg-blue-100';
      case 'read': return 'text-gray-600 bg-gray-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date): string => {
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
  };

  const getChannelIcon = (channel: string): string => {
    switch (channel) {
      case 'email': return '📧';
      case 'sms': return '📱';
      case 'push': return '🔔';
      case 'in_app': return '💬';
      case 'webhook': return '🔗';
      default: return '📢';
    }
  };

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'unread' && notification.status === 'read') return false;
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    if (selectedPriority !== 'all' && notification.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && notification.status !== selectedStatus) return false;
    return true;
  });

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  if (isLoading && !notifications.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-gray-500">Manage your notifications and preferences</p>
        </div>
        
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
          
          <Button onClick={() => setIsCreatingNotification(true)}>
            New Notification
          </Button>
          
          <Button onClick={() => setIsCreatingTemplate(true)} variant="outline">
            New Template
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {unreadCount > 0 && (
                <div className="mt-4">
                  <Button onClick={markAllAsRead} variant="outline" size="sm">
                    Mark all as read
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`${notification.status !== 'read' ? 'border-blue-200 bg-blue-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatDate(notification.createdAt)}</span>
                        <span>•</span>
                        <div className="flex gap-1">
                          {notification.channels.map((channel) => (
                            <span key={channel} title={channel}>
                              {getChannelIcon(channel)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {notification.status !== 'read' && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          variant="outline"
                          size="sm"
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteNotification(notification.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredNotifications.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No notifications found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates List */}
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getNotificationIcon(template.type)}
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <p className="text-gray-500 mt-1">{template.description}</p>
                      )}
                    </div>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Subject:</strong> {template.subject}
                    </div>
                    <div>
                      <strong>Body:</strong> {template.body}
                    </div>
                    <div className="flex gap-2">
                      <strong>Channels:</strong>
                      {template.channels.map((channel) => (
                        <span key={channel} title={channel}>
                          {getChannelIcon(channel)}
                        </span>
                      ))}
                    </div>
                    {template.variables && template.variables.length > 0 && (
                      <div>
                        <strong>Variables:</strong> {template.variables.join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          {preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>📧</span>
                        <span>Email Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.email}
                        onCheckedChange={(checked) => updatePreferences({ email: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>📱</span>
                        <span>SMS Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.sms}
                        onCheckedChange={(checked) => updatePreferences({ sms: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>🔔</span>
                        <span>Push Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.push}
                        onCheckedChange={(checked) => updatePreferences({ push: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>💬</span>
                        <span>In-App Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.in_app}
                        onCheckedChange={(checked) => updatePreferences({ in_app: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>🔗</span>
                        <span>Webhook Notifications</span>
                      </div>
                      <Switch
                        checked={preferences.webhook}
                        onCheckedChange={(checked) => updatePreferences({ webhook: checked })}
                      />
                    </div>
                  </div>
                </div>

                {preferences.quietHours && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Quiet Hours</h3>
                    <div className="flex items-center justify-between">
                      <span>Enable Quiet Hours</span>
                      <Switch
                        checked={preferences.quietHours.enabled}
                        onCheckedChange={(checked) => updatePreferences({
                          quietHours: { ...preferences.quietHours, enabled: checked }
                        })}
                      />
                    </div>
                    
                    {preferences.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Time</label>
                          <Input
                            type="time"
                            value={preferences.quietHours.startTime}
                            onChange={(e) => updatePreferences({
                              quietHours: { ...preferences.quietHours, startTime: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Time</label>
                          <Input
                            type="time"
                            value={preferences.quietHours.endTime}
                            onChange={(e) => updatePreferences({
                              quietHours: { ...preferences.quietHours, endTime: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sent:</span>
                    <span className="font-semibold text-green-600">{stats.recentActivity.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-semibold text-red-600">{stats.recentActivity.failed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Read:</span>
                    <span className="font-semibold text-blue-600">{stats.recentActivity.read}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>By Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>By Channel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.byChannel).map(([channel, count]) => (
                    <div key={channel} className="flex justify-between">
                      <span className="capitalize">{channel}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Notification Modal */}
      {isCreatingNotification && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Create New Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                placeholder="Enter notification title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                placeholder="Enter notification message..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select value={newNotification.priority} onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={createNotification} disabled={!newNotification.title || !newNotification.message}>
                Create
              </Button>
              <Button onClick={() => setIsCreatingNotification(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Template Modal */}
      {isCreatingTemplate && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Enter template name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Enter template description..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select value={newTemplate.type} onValueChange={(value: any) => setNewTemplate({ ...newTemplate, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Enter email subject..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Body</label>
              <Textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                placeholder="Enter template body..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={createTemplate} disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.body}>
                Create
              </Button>
              <Button onClick={() => setIsCreatingTemplate(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

