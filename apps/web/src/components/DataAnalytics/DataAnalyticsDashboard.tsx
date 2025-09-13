'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Eye, 
  Download, 
  Settings, 
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Filter,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'heatmap' | 'trend';
  title: string;
  description?: string;
  dataSource: string;
  configuration: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'doughnut';
    metrics: string[];
    dimensions?: string[];
    filters?: Record<string, any>;
    timeRange?: string;
    refreshInterval?: number;
    colors?: string[];
    showLegend?: boolean;
    showDataLabels?: boolean;
    yAxisLabel?: string;
    xAxisLabel?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    rows: number;
    responsive: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  filters: any[];
  permissions: {
    isPublic: boolean;
    allowedUsers: string[];
    allowedRoles: string[];
  };
  organizationId: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
    revenue: number;
    costPerAcquisition: number;
    returnOnInvestment: number;
  };
  trends: {
    users: Array<{ date: string; value: number }>;
    sessions: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
    conversions: Array<{ date: string; value: number }>;
  };
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    bounceRate: number;
    avgTimeOnPage: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
    conversionRate: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    percentage: number;
    sessions: number;
  }>;
  geographicData: Array<{
    country: string;
    region: string;
    visits: number;
    percentage: number;
  }>;
  realTimeData: {
    activeUsers: number;
    currentSessions: number;
    topPages: Array<{ page: string; activeUsers: number }>;
    topReferrers: Array<{ referrer: string; visits: number }>;
  };
}

interface DataAnalyticsDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export default function DataAnalyticsDashboard({
  className = "",
  refreshInterval = 30000
}: DataAnalyticsDashboardProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDashboards();
    loadAnalyticsData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAnalyticsData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [selectedPeriod, autoRefresh, refreshInterval]);

  const loadDashboards = async () => {
    try {
      const response = await fetch('/api/data-analytics/dashboards');
      const result = await response.json();
      
      if (result.success) {
        setDashboards(result.data);
        if (result.data.length > 0) {
          setSelectedDashboard(result.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading dashboards:', err);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/data-analytics/analytics?timeRange=${selectedPeriod}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
        setError(null);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Error loading analytics data');
      console.error('Analytics data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const formatCurrency = (amount: number) => `€${amount.toLocaleString()}`;

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading && !analyticsData) {
    return (
      <div className={`animate-pulse ${className}`}>
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
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading analytics</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={loadAnalyticsData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-500">Analytics data will appear here once available.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Analytics Dashboard</h1>
          <p className="text-gray-600">Análisis completo de datos y métricas de negocio</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Última hora</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="30d">Últimos 30 días</option>
                <option value="7d">Últimos 7 días</option>
                <option value="24h">Últimas 24h</option>
                <option value="1h">Última hora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Métricas</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="all">Todas las métricas</option>
                <option value="users">Usuarios</option>
                <option value="sessions">Sesiones</option>
                <option value="revenue">Ingresos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispositivos</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="all">Todos los dispositivos</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.metrics.totalUsers)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% vs mes anterior
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.metrics.totalSessions)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8.3% vs mes anterior
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.metrics.conversionRate)}</p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                -2.1% vs mes anterior
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.metrics.revenue)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15.7% vs mes anterior
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Trend Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tendencia de Usuarios</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Últimos 30 días
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Gráfico de tendencia de usuarios</p>
              <p className="text-sm text-gray-400">Datos: {analyticsData.trends.users.length} puntos</p>
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Fuentes de Tráfico</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Globe className="w-4 h-4 mr-1" />
              Distribución
            </div>
          </div>
          <div className="space-y-3">
            {analyticsData.trafficSources.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-yellow-500' :
                    index === 3 ? 'bg-red-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{source.source}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{formatNumber(source.visits)}</div>
                  <div className="text-xs text-gray-500">{source.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Breakdown & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Dispositivos</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Monitor className="w-4 h-4 mr-1" />
              Distribución
            </div>
          </div>
          <div className="space-y-4">
            {analyticsData.deviceBreakdown.map((device, index) => (
              <div key={device.device} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getDeviceIcon(device.device)}
                  <span className="ml-2 text-sm font-medium text-gray-700">{device.device}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {device.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Páginas Más Visitadas</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Eye className="w-4 h-4 mr-1" />
              Top 4
            </div>
          </div>
          <div className="space-y-3">
            {analyticsData.topPages.slice(0, 4).map((page, index) => (
              <div key={page.page} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{page.page}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{formatNumber(page.views)}</div>
                  <div className="text-xs text-gray-500">{formatPercentage(page.bounceRate)} rebote</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Data */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Datos en Tiempo Real</h3>
          <div className="flex items-center text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            En vivo
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{analyticsData.realTimeData.activeUsers}</div>
            <div className="text-sm text-gray-600">Usuarios Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{analyticsData.realTimeData.currentSessions}</div>
            <div className="text-sm text-gray-600">Sesiones Actuales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.realTimeData.topPages.reduce((sum, page) => sum + page.activeUsers, 0)}
            </div>
            <div className="text-sm text-gray-600">Páginas Activas</div>
          </div>
        </div>
      </div>

      {/* Geographic Data */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Distribución Geográfica</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Globe className="w-4 h-4 mr-1" />
            Top 6 regiones
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.geographicData.slice(0, 6).map((location, index) => (
            <div key={`${location.country}-${location.region}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">{location.region}</div>
                <div className="text-xs text-gray-500">{location.country}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{formatNumber(location.visits)}</div>
                <div className="text-xs text-gray-500">{location.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
