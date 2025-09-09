// ============================================================================
// NOTIFICATION DASHBOARD - REACT COMPONENT
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Plus, 
  Filter, 
  Search,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Copy,
  Download
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

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
  scheduledAt?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert' | 'reminder' | 'update' | 'announcement';
  subject?: string;
  body: string;
  variables: string[];
  channels: ('email' | 'sms' | 'push' | 'in_app' | 'webhook')[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const NotificationDashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'preferences' | 'statistics'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadData();
  }, [activeTab, filters, pagination.page]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'notifications':
          await loadNotifications();
          break;
        case 'templates':
          await loadTemplates();
          break;
        case 'preferences':
          await loadPreferences();
          break;
        case 'statistics':
          await loadStatistics();
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, pagination.page]);

  const loadNotifications = async () => {
    const params = new URLSearchParams({
      limit: pagination.limit.toString(),
      offset: ((pagination.page - 1) * pagination.limit).toString(),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.priority && { priority: filters.priority })
    });

    const response = await fetch(`/api/notifications?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load notifications');
    }

    const data = await response.json();
    setNotifications(data.data);
    setPagination(prev => ({ ...prev, total: data.count }));
  };

  const loadTemplates = async () => {
    const response = await fetch('/api/notifications/templates', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load templates');
    }

    const data = await response.json();
    setTemplates(data.data);
  };

  const loadPreferences = async () => {
    const response = await fetch('/api/notifications/preferences', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load preferences');
    }

    const data = await response.json();
    setPreferences(data.data);
  };

  const loadStatistics = async () => {
    const response = await fetch('/api/notifications/statistics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }

    const data = await response.json();
    setStats(data.data);
  };

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'read', readAt: new Date().toISOString() } : n)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read', readAt: new Date().toISOString() }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'read':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'push':
        return <Smartphone className="w-4 h-4" />;
      case 'in_app':
        return <Bell className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Notificaciones</h1>
              <p className="text-gray-600">Gestiona notificaciones, plantillas y preferencias</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Notificaciones
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'templates'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Plantillas
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'preferences'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Preferencias
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'statistics'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Estadísticas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && !loading && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="sent">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="read">Leído</option>
                    <option value="failed">Fallido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="info">Info</option>
                    <option value="success">Éxito</option>
                    <option value="warning">Advertencia</option>
                    <option value="error">Error</option>
                    <option value="alert">Alerta</option>
                    <option value="reminder">Recordatorio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Buscar notificaciones..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar todo como leído
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {pagination.total} notificaciones
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow">
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(notification.status)}
                          <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            {notification.channels.map((channel) => (
                              <div key={channel} className="flex items-center space-x-1">
                                {getChannelIcon(channel)}
                                <span>{channel}</span>
                              </div>
                            ))}
                          </div>
                          <span>Creado: {new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.sentAt && (
                            <span>Enviado: {new Date(notification.sentAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {notification.status !== 'read' && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600"
                            title="Marcar como leído"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-2">
                    Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Plantillas de Notificaciones</h2>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Plantilla
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.type)}`}>
                      {template.type}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-gray-600 mb-4">{template.description}</p>
                  )}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Canales:</span>
                      <div className="flex space-x-1">
                        {template.channels.map((channel) => (
                          <div key={channel} className="flex items-center space-x-1">
                            {getChannelIcon(channel)}
                            <span className="text-xs">{channel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Variables:</span>
                      <span className="text-sm text-gray-600">{template.variables.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      <Edit className="w-4 h-4 mr-1 inline" />
                      Editar
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && !loading && preferences && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Preferencias de Notificaciones</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Canales de Notificación</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.email}
                      onChange={(e) => updatePreferences({ email: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">SMS</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.sms}
                      onChange={(e) => updatePreferences({ sms: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Push</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.push}
                      onChange={(e) => updatePreferences({ push: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">In-App</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.in_app}
                      onChange={(e) => updatePreferences({ in_app: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {preferences.quietHours && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horas Silenciosas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Activar horas silenciosas</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.quietHours.enabled}
                        onChange={(e) => updatePreferences({ 
                          quietHours: { ...preferences.quietHours!, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {preferences.quietHours.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora de inicio</label>
                        <input
                          type="time"
                          value={preferences.quietHours.startTime}
                          onChange={(e) => updatePreferences({ 
                            quietHours: { ...preferences.quietHours!, startTime: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora de fin</label>
                        <input
                          type="time"
                          value={preferences.quietHours.endTime}
                          onChange={(e) => updatePreferences({ 
                            quietHours: { ...preferences.quietHours!, endTime: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zona horaria</label>
                        <select
                          value={preferences.quietHours.timezone}
                          onChange={(e) => updatePreferences({ 
                            quietHours: { ...preferences.quietHours!, timezone: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="Europe/Madrid">Europe/Madrid</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && !loading && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Estadísticas de Notificaciones</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Enviadas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.recentActivity.sent}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fallidas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.recentActivity.failed}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Leídas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.recentActivity.read}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Estado</h3>
                <div className="space-y-3">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{status}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Por Canal</h3>
                <div className="space-y-3">
                  {Object.entries(stats.byChannel).map(([channel, count]) => (
                    <div key={channel} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{channel}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDashboard;
