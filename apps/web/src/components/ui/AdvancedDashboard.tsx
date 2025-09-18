'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Building2, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Users,
  ShoppingCart,
  Truck,
  Calendar,
  Filter
} from 'lucide-react';

interface DashboardMetrics {
  inventory: {
    total_products: number;
    active_products: number;
    total_inventory_value: number;
    total_inventory_cost: number;
    avg_profit_margin: number;
    stock_turnover_rate: number;
    days_of_inventory: number;
    stockout_rate: number;
    excess_stock_value: number;
    inventory_accuracy: number;
  };
  supplier: {
    total_suppliers: number;
    active_suppliers: number;
    avg_supplier_rating: number;
    on_time_delivery_rate: number;
    quality_acceptance_rate: number;
    avg_payment_terms: number;
    supplier_diversity_score: number;
  };
  financial: {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    gross_profit_margin: number;
    operating_expenses: number;
    net_profit: number;
    net_profit_margin: number;
    cash_flow: number;
    working_capital: number;
    return_on_inventory: number;
  };
  operational: {
    order_fulfillment_rate: number;
    avg_order_processing_time: number;
    customer_satisfaction_score: number;
    return_rate: number;
    lead_time_variance: number;
    forecast_accuracy: number;
    capacity_utilization: number;
  };
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

interface DashboardProps {
  className?: string;
  refreshInterval?: number;
}

export default function AdvancedDashboard({
  className = "",
  refreshInterval = 30000
}: DashboardProps) {
  const api = apiClient;
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'inventory' | 'suppliers' | 'financial' | 'operational'>('overview');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.request({ url: `/metrics/kpi-scorecard?period=${selectedPeriod}`, method: 'GET' });
      setMetrics(data.data ?? data);
      setError(null);
    } catch (err) {
      setError('Error loading dashboard metrics');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
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
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-sand-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-sand-600 mb-4">{error}</p>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const getMetricCard = (title: string, value: number, unit: string, icon: React.ReactNode, trend?: number, color: string = 'mediterranean') => (
    <div className="bg-white rounded-lg p-6 border border-sand-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-sand-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-sand-900">
        {typeof value === 'number' && value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(1)}
        <span className="text-sm font-normal text-sand-500 ml-1">{unit}</span>
      </p>
    </div>
  );

  const getChartData = (): ChartData => {
    if (selectedView === 'inventory') {
      return {
        labels: ['En Stock', 'Stock Bajo', 'Sin Stock', 'Exceso'],
        datasets: [{
          label: 'Productos',
          data: [
            metrics.inventory.active_products - Math.round(metrics.inventory.active_products * metrics.inventory.stockout_rate / 100),
            Math.round(metrics.inventory.active_products * 0.1),
            Math.round(metrics.inventory.active_products * metrics.inventory.stockout_rate / 100),
            Math.round(metrics.inventory.active_products * 0.05)
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
        }]
      };
    }

    if (selectedView === 'financial') {
      return {
        labels: ['Ingresos', 'Costos', 'Gastos Operativos', 'Beneficio Neto'],
        datasets: [{
          label: 'Valor (€)',
          data: [
            metrics.financial.total_revenue,
            metrics.financial.total_cost,
            metrics.financial.operating_expenses,
            metrics.financial.net_profit
          ],
          backgroundColor: ['#3B82F6', '#EF4444', '#F59E0B', '#10B981']
        }]
      };
    }

    return {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [{
        label: 'Ventas',
        data: [120, 135, 110, 145, 130, 140],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true
      }]
    };
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-sand-900">Dashboard Avanzado</h1>
          <p className="text-sand-600">Métricas en tiempo real del sistema de inventario</p>
        </div>
        <div className="flex items-center gap-4">
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
            onClick={loadMetrics}
            className="p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'overview', label: 'Vista General', icon: BarChart3 },
          { key: 'inventory', label: 'Inventario', icon: Package },
          { key: 'suppliers', label: 'Proveedores', icon: Building2 },
          { key: 'financial', label: 'Financiero', icon: DollarSign },
          { key: 'operational', label: 'Operacional', icon: Activity }
        ].map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedView === view.key
                  ? 'bg-mediterranean-600 text-white'
                  : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {selectedView === 'overview' && (
          <>
            {getMetricCard(
              'Valor Total Inventario',
              metrics.inventory.total_inventory_value,
              '€',
              <Package className="w-6 h-6 text-mediterranean-600" />,
              5.2
            )}
            {getMetricCard(
              'Productos Activos',
              metrics.inventory.active_products,
              'productos',
              <CheckCircle className="w-6 h-6 text-green-600" />,
              2.1
            )}
            {getMetricCard(
              'Margen Promedio',
              metrics.inventory.avg_profit_margin,
              '%',
              <TrendingUp className="w-6 h-6 text-blue-600" />,
              -1.5
            )}
            {getMetricCard(
              'Tasa de Rotación',
              metrics.inventory.stock_turnover_rate,
              'veces/año',
              <Activity className="w-6 h-6 text-purple-600" />,
              3.2
            )}
          </>
        )}

        {selectedView === 'inventory' && (
          <>
            {getMetricCard(
              'Productos Sin Stock',
              Math.round(metrics.inventory.active_products * metrics.inventory.stockout_rate / 100),
              'productos',
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            {getMetricCard(
              'Exceso de Stock',
              metrics.inventory.excess_stock_value,
              '€',
              <Package className="w-6 h-6 text-orange-600" />
            )}
            {getMetricCard(
              'Días de Inventario',
              metrics.inventory.days_of_inventory,
              'días',
              <Calendar className="w-6 h-6 text-blue-600" />
            )}
            {getMetricCard(
              'Precisión Inventario',
              metrics.inventory.inventory_accuracy,
              '%',
              <Target className="w-6 h-6 text-green-600" />
            )}
          </>
        )}

        {selectedView === 'suppliers' && (
          <>
            {getMetricCard(
              'Proveedores Activos',
              metrics.supplier.active_suppliers,
              'proveedores',
              <Building2 className="w-6 h-6 text-blue-600" />
            )}
            {getMetricCard(
              'Rating Promedio',
              metrics.supplier.avg_supplier_rating,
              '/5',
              <Target className="w-6 h-6 text-green-600" />
            )}
            {getMetricCard(
              'Entrega a Tiempo',
              metrics.supplier.on_time_delivery_rate,
              '%',
              <Truck className="w-6 h-6 text-purple-600" />
            )}
            {getMetricCard(
              'Diversidad Proveedores',
              metrics.supplier.supplier_diversity_score,
              '%',
              <Users className="w-6 h-6 text-orange-600" />
            )}
          </>
        )}

        {selectedView === 'financial' && (
          <>
            {getMetricCard(
              'Ingresos Totales',
              metrics.financial.total_revenue,
              '€',
              <DollarSign className="w-6 h-6 text-green-600" />,
              8.5
            )}
            {getMetricCard(
              'Beneficio Neto',
              metrics.financial.net_profit,
              '€',
              <TrendingUp className="w-6 h-6 text-blue-600" />,
              12.3
            )}
            {getMetricCard(
              'Margen Neto',
              metrics.financial.net_profit_margin,
              '%',
              <Target className="w-6 h-6 text-purple-600" />
            )}
            {getMetricCard(
              'ROI Inventario',
              metrics.financial.return_on_inventory,
              '%',
              <Activity className="w-6 h-6 text-orange-600" />
            )}
          </>
        )}

        {selectedView === 'operational' && (
          <>
            {getMetricCard(
              'Cumplimiento Pedidos',
              metrics.operational.order_fulfillment_rate,
              '%',
              <ShoppingCart className="w-6 h-6 text-green-600" />
            )}
            {getMetricCard(
              'Tiempo Procesamiento',
              metrics.operational.avg_order_processing_time,
              'días',
              <Clock className="w-6 h-6 text-blue-600" />
            )}
            {getMetricCard(
              'Satisfacción Cliente',
              metrics.operational.customer_satisfaction_score,
              '/5',
              <Users className="w-6 h-6 text-purple-600" />
            )}
            {getMetricCard(
              'Utilización Capacidad',
              metrics.operational.capacity_utilization,
              '%',
              <Activity className="w-6 h-6 text-orange-600" />
            )}
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Main Chart */}
        <div className="bg-white rounded-lg p-6 border border-sand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sand-900">
              {selectedView === 'inventory' && 'Distribución de Stock'}
              {selectedView === 'financial' && 'Análisis Financiero'}
              {selectedView === 'overview' && 'Tendencia de Ventas'}
            </h3>
            <Filter className="w-5 h-5 text-sand-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-sand-50 rounded-lg">
            <div className="text-center">
              <PieChart className="w-16 h-16 text-sand-400 mx-auto mb-4" />
              <p className="text-sand-600">Gráfico interactivo</p>
              <p className="text-sm text-sand-500">Datos: {getChartData().labels.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="bg-white rounded-lg p-6 border border-sand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sand-900">Métricas Clave</h3>
            <Activity className="w-5 h-5 text-sand-400" />
          </div>
          <div className="space-y-4">
            {selectedView === 'overview' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sand-600">Stock Bajo</span>
                  <span className="font-semibold text-red-600">
                    {Math.round(metrics.inventory.active_products * 0.1)} productos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sand-600">Proveedores Críticos</span>
                  <span className="font-semibold text-orange-600">
                    {Math.round(metrics.supplier.active_suppliers * 0.2)} proveedores
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sand-600">ROI Promedio</span>
                  <span className="font-semibold text-green-600">
                    {metrics.financial.return_on_inventory.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sand-600">Eficiencia Operativa</span>
                  <span className="font-semibold text-blue-600">
                    {metrics.operational.order_fulfillment_rate.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="bg-white rounded-lg p-6 border border-sand-200">
        <h3 className="text-lg font-semibold text-sand-900 mb-4">Alertas y Recomendaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sand-800">Alertas Activas</h4>
            {metrics.inventory.stockout_rate > 5 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Alto índice de productos sin stock: {metrics.inventory.stockout_rate.toFixed(1)}%</span>
              </div>
            )}
            {metrics.supplier.on_time_delivery_rate < 90 && (
              <div className="flex items-center gap-2 text-orange-600">
                <Truck className="w-4 h-4" />
                <span>Baja tasa de entrega a tiempo: {metrics.supplier.on_time_delivery_rate.toFixed(1)}%</span>
              </div>
            )}
            {metrics.financial.net_profit_margin < 10 && (
              <div className="flex items-center gap-2 text-red-600">
                <DollarSign className="w-4 h-4" />
                <span>Margen de beneficio bajo: {metrics.financial.net_profit_margin.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-sand-800">Recomendaciones</h4>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Implementar sistema de reabastecimiento automático</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Target className="w-4 h-4" />
              <span>Optimizar niveles de inventario</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <Users className="w-4 h-4" />
              <span>Mejorar relaciones con proveedores</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

