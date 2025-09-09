'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Package,
  Building2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  category?: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface RealtimeNotificationsProps {
  className?: string;
  maxNotifications?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function RealtimeNotifications({
  className = "",
  maxNotifications = 10,
  autoHide = true,
  autoHideDelay = 5000
}: RealtimeNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const autoHideTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (user) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  const connectWebSocket = () => {
    try {
      // In a real app, this would connect to your WebSocket server
      // const ws = new WebSocket(`ws://localhost:3001/realtime?token=${user?.token}`);

      // For now, we'll simulate WebSocket connection
      setIsConnected(true);

      // Simulate incoming notifications
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every interval
          addNotification(generateMockNotification());
        }
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const generateMockNotification = (): Omit<Notification, 'id' | 'timestamp'> => {
    const types: Array<'success' | 'warning' | 'error' | 'info'> = ['success', 'warning', 'error', 'info'];
    const categories = ['inventory', 'suppliers', 'products', 'alerts', 'reports'];
    const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];

    const type = types[Math.floor(Math.random() * types.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const notifications = {
      inventory: {
        success: { title: 'Inventario Actualizado', message: 'El inventario se ha actualizado correctamente' },
        warning: { title: 'Stock Bajo', message: 'Algunos productos tienen stock bajo' },
        error: { title: 'Error de Inventario', message: 'Error al actualizar el inventario' },
        info: { title: 'Movimiento de Stock', message: 'Nuevo movimiento registrado en el inventario' }
      },
      suppliers: {
        success: { title: 'Proveedor Agregado', message: 'Nuevo proveedor agregado exitosamente' },
        warning: { title: 'Proveedor Inactivo', message: 'Un proveedor ha sido marcado como inactivo' },
        error: { title: 'Error de Proveedor', message: 'Error al procesar datos del proveedor' },
        info: { title: 'Actualización de Proveedor', message: 'Información del proveedor actualizada' }
      },
      products: {
        success: { title: 'Producto Creado', message: 'Nuevo producto agregado al catálogo' },
        warning: { title: 'Producto Sin Stock', message: 'Un producto se ha quedado sin stock' },
        error: { title: 'Error de Producto', message: 'Error al procesar el producto' },
        info: { title: 'Precio Actualizado', message: 'Precio de producto actualizado' }
      },
      alerts: {
        success: { title: 'Alerta Resuelta', message: 'Una alerta ha sido resuelta' },
        warning: { title: 'Nueva Alerta', message: 'Se ha generado una nueva alerta del sistema' },
        error: { title: 'Error de Alerta', message: 'Error en el sistema de alertas' },
        info: { title: 'Alerta Configurada', message: 'Nueva configuración de alerta aplicada' }
      },
      reports: {
        success: { title: 'Reporte Generado', message: 'Reporte generado exitosamente' },
        warning: { title: 'Reporte Pendiente', message: 'Hay reportes pendientes de revisión' },
        error: { title: 'Error de Reporte', message: 'Error al generar el reporte' },
        info: { title: 'Reporte Programado', message: 'Nuevo reporte programado' }
      }
    };

    const notification = notifications[category as keyof typeof notifications][type];

    return {
      type,
      title: notification.title,
      message: notification.message,
      category,
      priority,
      read: false,
      data: {
        category,
        timestamp: new Date().toISOString()
      }
    };
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()}`,
      timestamp: new Date()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    setUnreadCount(prev => prev + 1);

    // Auto-hide notification
    if (autoHide && notification.priority !== 'urgent') {
      const timeout = setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDelay);

      autoHideTimeouts.current.set(newNotification.id, timeout);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      const removed = prev.find(n => n.id === id);

      if (removed && !removed.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return updated;
    });

    // Clear auto-hide timeout
    const timeout = autoHideTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      autoHideTimeouts.current.delete(id);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );

    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);

    // Clear all timeouts
    autoHideTimeouts.current.forEach(timeout => clearTimeout(timeout));
    autoHideTimeouts.current.clear();
  };

  const getNotificationIcon = (type: string, category?: string) => {
    if (category === 'inventory') return <Package className="w-4 h-4" />;
    if (category === 'suppliers') return <Building2 className="w-4 h-4" />;
    if (category === 'products') return <Package className="w-4 h-4" />;
    if (category === 'alerts') return <AlertTriangle className="w-4 h-4" />;
    if (category === 'reports') return <TrendingUp className="w-4 h-4" />;

    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    const baseColors = {
      success: 'border-green-200 bg-green-50',
      warning: 'border-orange-200 bg-orange-50',
      error: 'border-red-200 bg-red-50',
      info: 'border-blue-200 bg-blue-50'
    };

    const priorityColors = {
      low: 'border-l-4 border-l-gray-400',
      medium: 'border-l-4 border-l-blue-400',
      high: 'border-l-4 border-l-orange-400',
      urgent: 'border-l-4 border-l-red-400'
    };

    return `${baseColors[type as keyof typeof baseColors]} ${priorityColors[priority as keyof typeof priorityColors]}`;
  };

  const getNotificationTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-orange-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} días`;

    return timestamp.toLocaleDateString('es-ES');
  };

  return (;
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg transition-colors duration-200"
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </button>

      {/* Notifications Panel */}
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-sand-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sand-200">
            <h3 className="font-semibold text-sand-900">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-mediterranean-600 hover:text-mediterranean-700"
                >
                  Marcar como leídas
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-sand-500 hover:text-sand-700"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="text-sand-400 hover:text-sand-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sand-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-sand-50 transition-colors duration-200 ${getNotificationColor(notification.type, notification.priority)} ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${getNotificationTextColor(notification.type)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${getNotificationTextColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-sand-400 hover:text-sand-600 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={`text-sm mt-1 ${getNotificationTextColor(notification.type)} opacity-80`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-sand-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-mediterranean-600 hover:text-mediterranean-700"
                            >
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-sand-200 bg-sand-50">
              <div className="flex items-center justify-between text-xs text-sand-600">
                <span>{notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}</span>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

