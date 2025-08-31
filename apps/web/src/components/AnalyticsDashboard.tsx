'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================================
// INTERFACES
// ============================================================================

interface MetricData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

interface DimensionData {
  dimension: string;
  value: string | number;
  count: number;
  percentage: number;
}

interface AnalyticsResult {
  metrics: Record<string, MetricData[]>;
  dimensions: Record<string, DimensionData[]>;
  summary: {
    totalRecords: number;
    timeRange: string;
    lastUpdated: Date;
  };
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  userId: string;
  orgId: string;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'funnel';
  title: string;
  query: AnalyticsQuery;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config?: Record<string, any>;
}

interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: Filter[];
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
}

interface Filter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number | Array<string | number>;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AnalyticsDashboard() {
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResult | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<Record<string, number>>({});
  const [selectedTimeRange, setSelectedTimeRange] = useState<'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'>('day');
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');

  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    loadInitialData();
    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentDashboard) {
      loadDashboardData();
    }
  }, [currentDashboard, selectedTimeRange]);

  useEffect(() => {
    // Configurar actualización en tiempo real
    if (realTimeIntervalRef.current) {
      clearInterval(realTimeIntervalRef.current);
    }

    realTimeIntervalRef.current = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000); // Actualizar cada 30 segundos

    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
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

      // Cargar datos en paralelo
      const [metricsRes, dimensionsRes, sampleDataRes, dashboardsRes] = await Promise.all([
        fetch('/api/analytics/metrics/available'),
        fetch('/api/analytics/dimensions/available'),
        fetch('/api/analytics/sample-data'),
        fetch('/api/analytics/dashboards?userId=demo-user&orgId=demo-org')
      ]);

      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        setAvailableMetrics(metrics);
      }

      if (dimensionsRes.ok) {
        const dimensions = await dimensionsRes.json();
        setAvailableDimensions(dimensions);
      }

      if (sampleDataRes.ok) {
        const data = await sampleDataRes.json();
        setSampleData(data);
      }

      if (dashboardsRes.ok) {
        const dashboardsData = await dashboardsRes.json();
        setDashboards(dashboardsData);
        
        // Seleccionar el primer dashboard si existe
        if (dashboardsData.length > 0) {
          setCurrentDashboard(dashboardsData[0]);
        }
      }

      // Cargar métricas en tiempo real
      await loadRealTimeMetrics();
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!currentDashboard) return;

    try {
      setIsLoading(true);
      setError(null);

      // Crear consulta para el dashboard
      const query: AnalyticsQuery = {
        metrics: ['page_views', 'user_sessions', 'conversion_rate', 'revenue'],
        timeRange: selectedTimeRange,
        dimensions: ['device_type', 'country']
      };

      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const metrics = ['page_views', 'user_sessions', 'api_usage', 'error_rate'];
      const response = await fetch('/api/analytics/metrics', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
      });

      if (response.ok) {
        const data = await response.json();
        setRealTimeMetrics(data);
      }
    } catch (err) {
      console.error('Error loading real-time metrics:', err);
    }
  };

  // ============================================================================
  // FUNCIONES DE DASHBOARD
  // ============================================================================

  const createDashboard = async () => {
    if (!newDashboardName.trim()) return;

    try {
      setIsCreatingDashboard(true);
      setError(null);

      const defaultWidgets: Widget[] = [
        {
          id: `widget_${Date.now()}_1`,
          type: 'metric',
          title: 'Page Views',
          query: {
            metrics: ['page_views'],
            timeRange: selectedTimeRange
          },
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: `widget_${Date.now()}_2`,
          type: 'chart',
          title: 'User Sessions',
          query: {
            metrics: ['user_sessions'],
            timeRange: selectedTimeRange
          },
          position: { x: 6, y: 0, width: 6, height: 4 }
        },
        {
          id: `widget_${Date.now()}_3`,
          type: 'metric',
          title: 'Conversion Rate',
          query: {
            metrics: ['conversion_rate'],
            timeRange: selectedTimeRange
          },
          position: { x: 0, y: 4, width: 6, height: 4 }
        },
        {
          id: `widget_${Date.now()}_4`,
          type: 'metric',
          title: 'Revenue',
          query: {
            metrics: ['revenue'],
            timeRange: selectedTimeRange
          },
          position: { x: 6, y: 4, width: 6, height: 4 }
        }
      ];

      const response = await fetch('/api/analytics/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDashboardName,
          description: 'Dashboard created automatically',
          userId: 'demo-user',
          orgId: 'demo-org',
          widgets: defaultWidgets
        }),
      });

      if (response.ok) {
        const newDashboard = await response.json();
        setDashboards(prev => [newDashboard, ...prev]);
        setCurrentDashboard(newDashboard);
        setNewDashboardName('');
      } else {
        throw new Error('Failed to create dashboard');
      }
    } catch (err) {
      setError('Failed to create dashboard');
      console.error('Error creating dashboard:', err);
    } finally {
      setIsCreatingDashboard(false);
    }
  };

  const deleteDashboard = async (dashboardId: string) => {
    try {
      const response = await fetch(`/api/analytics/dashboards/${dashboardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDashboards(prev => prev.filter(d => d.id !== dashboardId));
        if (currentDashboard?.id === dashboardId) {
          setCurrentDashboard(dashboards.length > 1 ? dashboards[1] : null);
        }
      }
    } catch (err) {
      console.error('Error deleting dashboard:', err);
    }
  };

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const formatMetricValue = (value: number, metric: string): string => {
    switch (metric) {
      case 'revenue':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'conversion_rate':
        return `${(value * 100).toFixed(2)}%`;
      case 'customer_satisfaction':
        return value.toFixed(1);
      case 'error_rate':
        return `${(value * 100).toFixed(2)}%`;
      case 'system_performance':
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('es-ES').format(value);
    }
  };

  const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'conversion_rate':
        return value > 0.025 ? 'text-green-600' : value > 0.015 ? 'text-yellow-600' : 'text-red-600';
      case 'customer_satisfaction':
        return value > 4.0 ? 'text-green-600' : value > 3.5 ? 'text-yellow-600' : 'text-red-600';
      case 'error_rate':
        return value < 0.01 ? 'text-green-600' : value < 0.05 ? 'text-yellow-600' : 'text-red-600';
      case 'system_performance':
        return value > 95 ? 'text-green-600' : value > 90 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMetricIcon = (metric: string): string => {
    switch (metric) {
      case 'page_views':
        return '👁️';
      case 'user_sessions':
        return '👥';
      case 'conversion_rate':
        return '📈';
      case 'revenue':
        return '💰';
      case 'customer_satisfaction':
        return '😊';
      case 'system_performance':
        return '⚡';
      case 'error_rate':
        return '⚠️';
      case 'api_usage':
        return '🔌';
      case 'ai_chat_usage':
        return '🤖';
      case 'inventory_movements':
        return '📦';
      default:
        return '📊';
    }
  };

  const getTimeRangeLabel = (timeRange: string): string => {
    switch (timeRange) {
      case 'hour':
        return 'Última hora';
      case 'day':
        return 'Último día';
      case 'week':
        return 'Última semana';
      case 'month':
        return 'Último mes';
      case 'quarter':
        return 'Último trimestre';
      case 'year':
        return 'Último año';
      default:
        return timeRange;
    }
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  if (isLoading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Monitor your data and insights in real-time</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Última hora</SelectItem>
              <SelectItem value="day">Último día</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsCreatingDashboard(true)}>
            New Dashboard
          </Button>
        </div>
      </div>

      {/* Create Dashboard Modal */}
      {isCreatingDashboard && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Create New Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dashboard Name</label>
              <Input
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                placeholder="Enter dashboard name..."
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createDashboard} disabled={!newDashboardName.trim() || isCreatingDashboard}>
                {isCreatingDashboard ? 'Creating...' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingDashboard(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Selector */}
      {dashboards.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dashboards.map((dashboard) => (
            <Button
              key={dashboard.id}
              variant={currentDashboard?.id === dashboard.id ? 'default' : 'outline'}
              onClick={() => setCurrentDashboard(dashboard)}
              className="whitespace-nowrap"
            >
              {dashboard.name}
            </Button>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="real-time">Real-time</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="sample-data">Sample Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData && Object.entries(analyticsData.metrics).map(([metric, data]) => {
              const latestValue = data[data.length - 1]?.value || 0;
              const previousValue = data[data.length - 2]?.value || 0;
              const change = previousValue > 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;
              
              return (
                <Card key={metric}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {getMetricIcon(metric)} {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                    <Badge variant={change >= 0 ? 'default' : 'secondary'}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatMetricValue(latestValue, metric)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getTimeRangeLabel(selectedTimeRange)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Views Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Chart component would go here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Sessions by Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Chart component would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="real-time" className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(realTimeMetrics).map(([metric, value]) => (
              <Card key={metric}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {getMetricIcon(metric)} {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                  <Badge variant="outline" className="text-green-600">
                    Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getMetricColor(metric, value)}`}>
                    {formatMetricValue(value, metric)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated just now
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-6">
          {/* Dimensions Data */}
          {analyticsData && Object.entries(analyticsData.dimensions).map(([dimension, data]) => (
            <Card key={dimension}>
              <CardHeader>
                <CardTitle>{dimension.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.value}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20 h-2" />
                        <span className="text-sm text-gray-500">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sample-data" className="space-y-6">
          {/* Sample Data Display */}
          {Object.entries(sampleData).map(([key, data]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
