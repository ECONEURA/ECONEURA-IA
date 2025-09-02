'use client';

import { useState, useEffect } from 'react';
import { useApiClient } from '@/hooks/useApi';
import AdvancedDashboard from '@/components/ui/AdvancedDashboard';
import InteractiveCharts from '@/components/ui/InteractiveCharts';
import { 
  Bell, 
  Settings, 
  RefreshCw, 
  Download,
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardData {
  kpi_scorecard: any;
  demand_predictions: any[];
  inventory_optimizations: any[];
  ai_recommendations: any;
  last_updated: string;
}

interface Notification {
  id: string;
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'read';
  created_at: string;
}

export default function AdvancedDashboardPage() {
  const apiClient = useApiClient();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
        loadNotifications();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [selectedPeriod, autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/dashboard/data/org-123?period=${selectedPeriod}`);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('Error loading dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiClient('/notifications/user/current?limit=5');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleChartClick = (chartId: string, dataPoint: any) => {
    console.log('Chart clicked:', chartId, dataPoint);
    // Handle chart interaction
  };

  const handleExportData = async () => {
    try {
      const response = await apiClient('/dashboard/export/org-123', {
        method: 'POST',
        body: JSON.stringify({ period: selectedPeriod })
      });
      
      // Download the exported data
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${selectedPeriod}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-sand-600 bg-sand-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-sand-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-sand-200 rounded-lg mb-6 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-sand-100 rounded-lg p-6 h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-sand-100 rounded-lg p-6 h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <div className="bg-white border-b border-sand-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sand-900">Dashboard Avanzado</h1>
              <p className="text-sand-600">
                Sistema de Inteligencia de Negocios en Tiempo Real
                {dashboardData?.last_updated && (
                  <span className="ml-2 text-sm">
                    • Última actualización: {new Date(dashboardData.last_updated).toLocaleString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => n.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => n.status === 'pending').length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-sand-200 z-50">
                    <div className="p-4 border-b border-sand-200">
                      <h3 className="font-semibold text-sand-900">Notificaciones</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-sand-100 hover:bg-sand-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                                {getPriorityIcon(notification.priority)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sand-900 text-sm">
                                  {notification.subject}
                                </h4>
                                <p className="text-sand-600 text-xs mt-1">
                                  {notification.body}
                                </p>
                                <p className="text-sand-400 text-xs mt-2">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sand-500">
                          No hay notificaciones nuevas
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
                >
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                </select>

                <button
                  onClick={loadDashboardData}
                  className="p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg"
                  title="Actualizar datos"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={handleExportData}
                  className="p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg"
                  title="Exportar datos"
                >
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg ${
                    autoRefresh 
                      ? 'text-mediterranean-600 bg-mediterranean-50' 
                      : 'text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50'
                  }`}
                  title={autoRefresh ? 'Auto-refresh activado' : 'Auto-refresh desactivado'}
                >
                  <TrendingUp className="w-5 h-5" />
                </button>

                <button className="p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Advanced Dashboard */}
          <AdvancedDashboard className="mb-8" />

          {/* Interactive Charts */}
          <InteractiveCharts
            data={dashboardData}
            onChartClick={handleChartClick}
            className="mb-8"
          />

          {/* AI Insights Section */}
          {dashboardData?.ai_recommendations && (
            <div className="bg-white rounded-lg p-6 border border-sand-200 mb-8">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Insights de IA
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Immediate Actions */}
                <div>
                  <h3 className="font-medium text-sand-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Acciones Inmediatas
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.ai_recommendations.immediate_actions?.map((action: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-sand-800">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opportunities */}
                <div>
                  <h3 className="font-medium text-sand-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Oportunidades
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.ai_recommendations.opportunities?.map((opportunity: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-sand-800">{opportunity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Long-term Strategies */}
              {dashboardData.ai_recommendations.long_term_strategies?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-sand-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Estrategias a Largo Plazo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dashboardData.ai_recommendations.long_term_strategies.map((strategy: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-sand-800">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Status */}
          <div className="bg-white rounded-lg p-6 border border-sand-200">
            <h2 className="text-xl font-semibold text-sand-900 mb-4">
              Estado del Sistema
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-sand-900">Sistema Principal</p>
                  <p className="text-xs text-sand-600">Operacional</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-sand-900">IA Predictiva</p>
                  <p className="text-xs text-sand-600">Activo</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-sand-900">Integraciones</p>
                  <p className="text-xs text-sand-600">Conectado</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-sand-900">Auditoría</p>
                  <p className="text-xs text-sand-600">Monitoreando</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
