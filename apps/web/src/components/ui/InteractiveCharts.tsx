'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Activity,
  Download,
  Filter,
  Calendar,
  Target,
  DollarSign,
  Package,
  Users,
  Truck
} from 'lucide-react';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  title: string;
  description: string;
  data: ChartData;
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        position?: 'top' | 'bottom' | 'left' | 'right';
        display?: boolean;
      };
      tooltip?: {
        enabled?: boolean;
      };
    };
    scales?: {
      y?: {
        beginAtZero?: boolean;
  max?: number;
        grid?: {
          display?: boolean;
        };
      };
      x?: {
        grid?: {
          display?: boolean;
        };
      };
    };
  };
}

interface InteractiveChartsProps {
  data: any;
  className?: string;
  onChartClick?: (chartId: string, dataPoint: any) => void;
}

export default function InteractiveCharts({
  data,
  className = "",
  onChartClick
}: InteractiveChartsProps) {
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut' | 'area'>('bar');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('inventory');

  // Generate chart configurations based on data
  const chartConfigs = useMemo(() => {
    if (!data) return [];

    const configs: ChartConfig[] = [];

    // Inventory Distribution Chart
    if (data.inventory_metrics) {
      configs.push({
        type: 'pie',
        title: 'Distribución de Inventario',
        description: 'Estado actual del inventario por categorías',
        data: {
          labels: ['En Stock', 'Stock Bajo', 'Sin Stock', 'Exceso'],
          datasets: [{
            label: 'Productos',
            data: [
              data.inventory_metrics.active_products - Math.round(data.inventory_metrics.active_products * data.inventory_metrics.stockout_rate / 100),
              Math.round(data.inventory_metrics.active_products * 0.1),
              Math.round(data.inventory_metrics.active_products * data.inventory_metrics.stockout_rate / 100),
              Math.round(data.inventory_metrics.active_products * 0.05)
            ],
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              display: true
            }
          }
        }
      });
    }

    // Financial Performance Chart
    if (data.financial_metrics) {
      configs.push({
        type: 'bar',
        title: 'Rendimiento Financiero',
        description: 'Métricas financieras clave',
        data: {
          labels: ['Ingresos', 'Costos', 'Beneficio Bruto', 'Beneficio Neto'],
          datasets: [{
            label: 'Valor (€)',
            data: [
              data.financial_metrics.total_revenue,
              data.financial_metrics.total_cost,
              data.financial_metrics.gross_profit,
              data.financial_metrics.net_profit
            ],
            backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true
              }
            }
          }
        }
      });
    }

    // Supplier Performance Chart
    if (data.supplier_metrics) {
      configs.push({
        type: 'line',
        title: 'Rendimiento de Proveedores',
        description: 'Métricas de calidad y entrega',
        data: {
          labels: ['Entrega a Tiempo', 'Calidad', 'Rating', 'Diversidad'],
          datasets: [{
            label: 'Porcentaje (%)',
            data: [
              data.supplier_metrics.on_time_delivery_rate,
              data.supplier_metrics.quality_acceptance_rate,
              data.supplier_metrics.avg_supplier_rating * 20, // Convert to percentage
              data.supplier_metrics.supplier_diversity_score
            ],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                display: true
              }
            }
          }
        }
      });
    }

    // Operational Metrics Chart
    if (data.operational_metrics) {
      configs.push({
        type: 'area',
        title: 'Métricas Operacionales',
        description: 'Eficiencia y satisfacción del cliente',
        data: {
          labels: ['Cumplimiento', 'Satisfacción', 'Utilización', 'Precisión'],
          datasets: [{
            label: 'Porcentaje (%)',
            data: [
              data.operational_metrics.order_fulfillment_rate,
              data.operational_metrics.customer_satisfaction_score * 20,
              data.operational_metrics.capacity_utilization,
              data.operational_metrics.forecast_accuracy
            ],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                display: true
              }
            }
          }
        }
      });
    }

    return configs;
  }, [data]);

  const renderChart = (config: ChartConfig) => {
    const chartId = `chart-${config.type}-${config.title.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div key={chartId} className="bg-white rounded-lg p-6 border border-sand-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-sand-900">{config.title}</h3>
            <p className="text-sm text-sand-600">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChartClick?.(chartId, config.data)}
              className="p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg"
              title="Ver detalles"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadChartData(config)}
              className="p-2 text-sand-600 hover:text-mediterranean-600 hover:bg-sand-50 rounded-lg"
              title="Descargar datos"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-64 relative">
          {/* Mock Chart Rendering */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {config.type === 'pie' && <PieChart className="w-16 h-16 text-sand-400 mx-auto mb-4" />}
              {config.type === 'bar' && <BarChart3 className="w-16 h-16 text-sand-400 mx-auto mb-4" />}
              {config.type === 'line' && <TrendingUp className="w-16 h-16 text-sand-400 mx-auto mb-4" />}
              {config.type === 'area' && <Activity className="w-16 h-16 text-sand-400 mx-auto mb-4" />}
              
              <p className="text-sand-600 font-medium">{config.title}</p>
              <p className="text-sm text-sand-500 mt-2">
                {config.data.labels.length} categorías
              </p>
              
              {/* Data Preview */}
              <div className="mt-4 space-y-2">
                {config.data.labels.map((label, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-sand-600">{label}</span>
                    <span className="font-semibold text-sand-900">
                      {config.data.datasets[0].data[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Legend */}
        {config.data.datasets[0].backgroundColor && (
          <div className="mt-4 flex flex-wrap gap-2">
            {config.data.labels.map((label, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: Array.isArray(config.data.datasets[0].backgroundColor)
                      ? config.data.datasets[0].backgroundColor![index]
                      : config.data.datasets[0].backgroundColor
                  }}
                />
                <span className="text-xs text-sand-600">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const downloadChartData = (config: ChartConfig) => {
    const csvContent = [
      ['Categoría', 'Valor'],
      ...config.data.labels.map((label, index) => [
        label,
        config.data.datasets[0].data[index].toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}-${selectedTimeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'suppliers': return <Truck className="w-4 h-4" />;
      case 'operational': return <Activity className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Activity className="w-12 h-12 text-sand-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-sand-900 mb-2">Sin datos disponibles</h3>
        <p className="text-sand-600">Los gráficos se mostrarán cuando haya datos disponibles</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
          >
            <option value="inventory">Inventario</option>
            <option value="financial">Financiero</option>
            <option value="suppliers">Proveedores</option>
            <option value="operational">Operacional</option>
          </select>

          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sand-400" />
          <span className="text-sm text-sand-600">Filtros activos</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartConfigs.map((config) => renderChart(config))}
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpi_scorecard && (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Puntuación General</p>
                  <p className="text-2xl font-bold">{data.kpi_scorecard.overall_score.toFixed(1)}</p>
                </div>
                <Target className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Tendencia</p>
                  <p className="text-2xl font-bold">
                    {data.kpi_scorecard.trend_analysis.trend_direction === 'improving' ? '+' : ''}
                    {data.kpi_scorecard.trend_analysis.change_percentage.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Eventos Auditados</p>
                  <p className="text-2xl font-bold">{data.kpi_scorecard.total_events}</p>
                </div>
                <Activity className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Alertas Activas</p>
                  <p className="text-2xl font-bold">{data.kpi_scorecard.alerts.length}</p>
                </div>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
