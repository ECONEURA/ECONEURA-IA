'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useApiClient } from '@/hooks/useApi';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Calendar,
  Activity,
  Target,
  Zap,
  RefreshCw,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_interactions: number;
    interactions_per_day: number;
    completion_rate: number;
    avg_response_time_hours: number;
  };
  type_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  conversion_rates: {
    calls: number;
    emails: number;
    meetings: number;
    notes: number;
    tasks: number;
  };
  daily_trends: Array<{
    date: string;
    total: number;
    by_type: Record<string, number>;
  }>;
  top_performers: Array<{
    user_id: string;
    name: string;
    interactions: number;
    conversion_rate: number;
  }>;
  heatmap: Array<{
    day: string;
    hours: Array<{
      hour: number;
      count: number;
      intensity: number;
    }>;
  }>;
  insights: string[];
  recommendations: string[];
}

export default function InteractionsAnalyticsPage() {
  const { user } = useAuth();
  const apiClient = useApiClient();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [filters, setFilters] = useState({
    company_id: '',
    contact_id: '',
    deal_id: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, [period, filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        period,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const response = await apiClient(`/interactions/analytics?${queryParams.toString()}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatTime = (hours: number) => `${hours.toFixed(1)}h`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-mediterranean-600 animate-spin mx-auto mb-4" />
          <p className="text-mediterranean-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-sand-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-sand-600 mb-2">No hay datos disponibles</h3>
          <p className="text-sand-500">Crea algunas interacciones para ver analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mediterranean-900 font-playfair">
                Analytics de Interacciones
              </h1>
              <p className="text-mediterranean-600 mt-1">
                Métricas y insights de rendimiento de interacciones CRM
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
              <button
                onClick={loadAnalytics}
                className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sand-600">Total Interacciones</p>
                <p className="text-3xl font-bold text-mediterranean-900">
                  {analytics.overview.total_interactions}
                </p>
              </div>
              <Activity className="w-8 h-8 text-mediterranean-600" />
            </div>
            <p className="text-sm text-sand-500 mt-2">
              {analytics.overview.interactions_per_day} por día
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sand-600">Tasa de Finalización</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatPercentage(analytics.overview.completion_rate)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-sand-500 mt-2">
              Interacciones completadas
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sand-600">Tiempo Respuesta</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatTime(analytics.overview.avg_response_time_hours)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-sand-500 mt-2">
              Promedio de respuesta
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sand-600">Conversión</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatPercentage(analytics.conversion_rates.meetings)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-sand-500 mt-2">
              Tasa de conversión
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Type Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">Distribución por Tipo</h3>
            <div className="space-y-3">
              {Object.entries(analytics.type_distribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-sand-700 capitalize">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-sand-200 rounded-full h-2">
                      <div 
                        className="bg-mediterranean-600 h-2 rounded-full"
                        style={{ 
                          width: `${(count / analytics.overview.total_interactions) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-sand-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">Distribución por Estado</h3>
            <div className="space-y-3">
              {Object.entries(analytics.status_distribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-sand-700 capitalize">{status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-sand-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'completed' ? 'bg-green-600' :
                          status === 'pending' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ 
                          width: `${(count / analytics.overview.total_interactions) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-sand-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">Top Performers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.top_performers.map((performer, index) => (
              <div key={performer.user_id} className="bg-gradient-to-r from-sand-50 to-white rounded-xl p-4 border border-sand-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-mediterranean-900">{performer.name}</p>
                    <p className="text-sm text-sand-600">
                      {performer.interactions} interacciones
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-sand-600">Tasa de conversión</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatPercentage(performer.conversion_rate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">Insights</h3>
            </div>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-900">Recomendaciones</h3>
            </div>
            <div className="space-y-3">
              {analytics.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-green-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">Actividad por Hora (Últimos 7 días)</h3>
          <div className="overflow-x-auto">
            <div className="flex space-x-1">
              {analytics.heatmap.map((day) => (
                <div key={day.day} className="flex flex-col space-y-1">
                  <div className="text-xs text-sand-600 text-center h-6 flex items-center justify-center">
                    {day.day}
                  </div>
                  {day.hours.map((hour) => (
                    <div
                      key={hour.hour}
                      className={`w-4 h-4 rounded-sm ${
                        hour.intensity === 0 ? 'bg-sand-100' :
                        hour.intensity < 0.3 ? 'bg-green-200' :
                        hour.intensity < 0.7 ? 'bg-green-400' :
                        'bg-green-600'
                      }`}
                      title={`${day.day} ${hour.hour}:00 - ${hour.count} interacciones`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-sand-600">
              <span>Menos</span>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-sand-100 rounded-sm" />
                <div className="w-4 h-4 bg-green-200 rounded-sm" />
                <div className="w-4 h-4 bg-green-400 rounded-sm" />
                <div className="w-4 h-4 bg-green-600 rounded-sm" />
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
