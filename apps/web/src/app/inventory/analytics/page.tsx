'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Package,
  Building2,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  TrendingDown,
  CheckCircle,
  Clock
} from 'lucide-react';

interface InventoryAnalytics {
  overview: {
    total_products: number;
    active_products: number;
    low_stock_products: number;
    total_inventory_value: number;
    stockout_risk_percentage: number;
  };
  category_distribution: Array<{
    category: string;
    count: number;
    total_value: number;
  }>;
  top_suppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    product_count: number;
    total_value: number;
  }>;
  low_stock_alerts: Array<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    min_stock_level: number;
    supplier_name: string;
    days_until_stockout: number;
  }>;
  stock_movements: Array<{
    date: string;
    in_movements: number;
    out_movements: number;
    total_value_change: number;
  }>;
  insights: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action: string;
  }>;
}

export default function InventoryAnalyticsPage(): void {
  const { user } = useAuth();
  const api = apiClient;
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [filters, setFilters] = useState({
    category: '',
    supplier_id: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, [period, filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        ...(filters.category && { category: filters.category }),
        ...(filters.supplier_id && { supplier_id: filters.supplier_id })
      });

      const data = await api.request({ url: `/inventory/analytics?${params.toString()}`, method: 'GET' });
      setAnalytics(data.data ?? data);
    } catch (error) {
      console.error('Error loading inventory analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `€${amount.toLocaleString()}`;
  const formatNumber = (num: number) => num.toLocaleString();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'info':
        return <Eye className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading && !analytics) {
    return (;
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-mediterranean-600 animate-pulse mx-auto mb-4" />
          <p className="text-mediterranean-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (;
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar los datos</p>
        </div>
      </div>
    );
  }

  return (;
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mediterranean-900 font-playfair">
                Analytics de Inventario
              </h1>
              <p className="text-mediterranean-600 mt-1">
                Métricas y insights del inventario
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAnalytics}
                className="flex items-center px-3 py-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
              <button className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-sand-700">Período:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-sand-700">Categoría:</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {analytics.category_distribution.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sand-600 text-sm font-medium">Total Productos</p>
                <p className="text-3xl font-bold text-mediterranean-900">
                  {formatNumber(analytics.overview.total_products)}
                </p>
              </div>
              <Package className="w-8 h-8 text-mediterranean-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">
                {analytics.overview.active_products} activos
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sand-600 text-sm font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-mediterranean-900">
                  {formatCurrency(analytics.overview.total_inventory_value)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Inventario valorado</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sand-600 text-sm font-medium">Stock Bajo</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatNumber(analytics.overview.low_stock_products)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600">
                {analytics.overview.stockout_risk_percentage}% riesgo
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sand-600 text-sm font-medium">Proveedores</p>
                <p className="text-3xl font-bold text-mediterranean-900">
                  {formatNumber(analytics.top_suppliers.length)}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600">Activos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">
              Distribución por Categorías
            </h3>
            <div className="space-y-3">
              {analytics.category_distribution.slice(0, 5).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                      }}
                    />
                    <span className="text-sand-700 font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-mediterranean-900 font-semibold">
                      {formatNumber(category.count)}
                    </p>
                    <p className="text-sand-500 text-sm">
                      {formatCurrency(category.total_value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">
              Top Proveedores
            </h3>
            <div className="space-y-3">
              {analytics.top_suppliers.slice(0, 5).map((supplier, index) => (
                <div key={supplier.supplier_id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-mediterranean-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-mediterranean-600 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-sand-700 font-medium">{supplier.supplier_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-mediterranean-900 font-semibold">
                      {formatNumber(supplier.product_count)}
                    </p>
                    <p className="text-sand-500 text-sm">
                      {formatCurrency(supplier.total_value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Low Stock Alerts */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">
              Alertas de Stock Bajo
            </h3>
            <div className="space-y-3">
              {analytics.low_stock_alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <p className="font-medium text-sand-900">{alert.name}</p>
                    <p className="text-sm text-sand-600">SKU: {alert.sku}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-orange-600">
                        Stock: {alert.stock_quantity} / {alert.min_stock_level}
                      </span>
                      {alert.days_until_stockout > 0 && (
                        <span className="text-sm text-sand-500 ml-2">
                          • {alert.days_until_stockout} días restantes
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-mediterranean-600 hover:text-mediterranean-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">
              Insights
            </h3>
            <div className="space-y-3">
              {analytics.insights.slice(0, 5).map((insight, index) => (
                <div key={index} className="flex items-start p-3 bg-sand-50 rounded-lg border border-sand-200">
                  {getInsightIcon(insight.type)}
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sand-900">{insight.title}</p>
                    <p className="text-sm text-sand-600 mt-1">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">
            Recomendaciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                <h4 className="font-semibold mb-2">{rec.title}</h4>
                <p className="text-sm mb-3">{rec.description}</p>
                <button className="text-sm font-medium hover:underline">
                  {rec.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Movements Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-mediterranean-900 mb-4">
            Movimientos de Stock
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analytics.stock_movements.slice(-7).map((movement, index) => (
              <div key={movement.date} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col space-y-1">
                  <div
                    className="bg-green-500 rounded-t"
                    style={{
                      height: `${(movement.in_movements / 50) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                  <div
                    className="bg-red-500 rounded-b"
                    style={{
                      height: `${(movement.out_movements / 50) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                </div>
                <span className="text-xs text-sand-500 mt-2">
                  {new Date(movement.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2" />
              <span className="text-sm text-sand-600">Entradas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2" />
              <span className="text-sm text-sand-600">Salidas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
