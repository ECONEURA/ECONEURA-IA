'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon, 
  CurrencyEuroIcon, 
  EnvelopeIcon, 
  ClockIcon,
  UsersIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  activeCustomers: number;
  pendingInvoices: number;
  completedOrders: number;
  aiCostMonth: number;
  collectionRate: number;
  averageOrderValue: number;
}

interface QuickStat {
  label: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'coral' | 'mediterranean' | 'olive' | 'terracotta';
}

function MediterraneanDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for Mediterranean dashboard
      const mockMetrics: DashboardMetrics = {
        totalRevenue: 847650,
        monthlyGrowth: 12.4,
        activeCustomers: 1247,
        pendingInvoices: 28,
        completedOrders: 342,
        aiCostMonth: 1250.75,
        collectionRate: 94.2,
        averageOrderValue: 2480.50
      };
      
      setMetrics(mockMetrics);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Quick stats configuration
  const quickStats: QuickStat[] = [
    {
      label: 'Ingresos Totales',
      value: `€${metrics?.totalRevenue.toLocaleString() || '0'}`,
      change: metrics?.monthlyGrowth || 0,
      icon: CurrencyEuroIcon,
      color: 'mediterranean'
    },
    {
      label: 'Clientes Activos',
      value: metrics?.activeCustomers.toLocaleString() || '0',
      change: 8.2,
      icon: UsersIcon,
      color: 'coral'
    },
    {
      label: 'Pedidos Completados',
      value: metrics?.completedOrders.toLocaleString() || '0',
      change: 15.7,
      icon: ShoppingBagIcon,
      color: 'olive'
    },
    {
      label: 'Facturas Pendientes',
      value: metrics?.pendingInvoices.toLocaleString() || '0',
      change: -12.3,
      icon: ExclamationTriangleIcon,
      color: 'terracotta'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <SparklesIcon className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando dashboard mediterráneo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-mediterranean-600 via-mediterranean-500 to-coral-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Dashboard Mediterráneo
              </h1>
              <p className="text-mediterranean-100 text-lg">
                Centro de control empresarial con inteligencia artificial
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedPeriod === period
                        ? 'bg-white text-mediterranean-600 shadow-sm'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    {period === '7d' && '7 días'}
                    {period === '30d' && '30 días'}
                    {period === '90d' && '90 días'}
                  </button>
                ))}
              </div>
              
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                )}
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const isPositive = stat.change > 0;
            
            return (
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                  stat.color === 'coral' ? 'bg-gradient-to-br from-coral-500 to-coral-600' :
                  stat.color === 'olive' ? 'bg-gradient-to-br from-olive-500 to-olive-600' :
                  'bg-gradient-to-br from-terracotta-500 to-terracotta-600'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                    <div className={`flex items-center text-sm font-medium ${
                      isPositive ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {isPositive ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                      )}
                      {Math.abs(stat.change)}%
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold text-white mb-1 font-playfair">
                    {stat.value}
                  </div>
                  
                  <div className="text-white/80 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-mediterranean-800 font-playfair">
                Evolución de Ingresos
              </h3>
              <ChartBarIcon className="w-6 h-6 text-mediterranean-500" />
            </div>
            
            <div className="relative h-64 flex items-end justify-between gap-2">
              {[45, 52, 48, 61, 55, 67, 59, 73, 69, 78, 84, 88].map((height, index) => (
                <div
                  key={index}
                  className="relative flex-1 bg-gradient-to-t from-mediterranean-500 to-coral-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity duration-200"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-mediterranean-700 opacity-0 hover:opacity-100 transition-opacity">
                    €{(45000 + height * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-4 text-sm text-mediterranean-600">
              {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>
          
          {/* AI Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-mediterranean-800 font-playfair">
                Rendimiento IA
              </h3>
              <SparklesIcon className="w-6 h-6 text-coral-500" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-mediterranean-700">Tasa de Éxito</span>
                <span className="font-bold text-mediterranean-800">{metrics?.collectionRate}%</span>
              </div>
              
              <div className="w-full bg-mediterranean-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-coral-500 to-mediterranean-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics?.collectionRate || 0}%` }}
                ></div>
              </div>
              
              <div className="pt-4 border-t border-mediterranean-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-mediterranean-700">Costo Mensual IA</span>
                  <span className="font-bold text-terracotta-600">€{metrics?.aiCostMonth.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-mediterranean-700">Valor Pedido Promedio</span>
                  <span className="font-bold text-olive-600">€{metrics?.averageOrderValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CRM Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <UsersIcon className="w-6 h-6 text-coral-500 mr-3" />
              <h3 className="text-lg font-bold text-mediterranean-800 font-playfair">CRM</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-xl bg-coral-50 hover:bg-coral-100 transition-colors duration-200 group">
                <div className="font-medium text-coral-800 group-hover:text-coral-900">Nuevos Contactos</div>
                <div className="text-sm text-coral-600">Gestionar leads recientes</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-xl bg-mediterranean-50 hover:bg-mediterranean-100 transition-colors duration-200 group">
                <div className="font-medium text-mediterranean-800 group-hover:text-mediterranean-900">Seguimiento</div>
                <div className="text-sm text-mediterranean-600">Revisar actividades pendientes</div>
              </button>
            </div>
          </div>
          
          {/* ERP Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <ShoppingBagIcon className="w-6 h-6 text-olive-500 mr-3" />
              <h3 className="text-lg font-bold text-mediterranean-800 font-playfair">ERP</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-xl bg-olive-50 hover:bg-olive-100 transition-colors duration-200 group">
                <div className="font-medium text-olive-800 group-hover:text-olive-900">Inventario</div>
                <div className="text-sm text-olive-600">Revisar stock disponible</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-xl bg-terracotta-50 hover:bg-terracotta-100 transition-colors duration-200 group">
                <div className="font-medium text-terracotta-800 group-hover:text-terracotta-900">Proveedores</div>
                <div className="text-sm text-terracotta-600">Gestionar relaciones</div>
              </button>
            </div>
          </div>
          
          {/* Finance Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BanknotesIcon className="w-6 h-6 text-mediterranean-500 mr-3" />
              <h3 className="text-lg font-bold text-mediterranean-800 font-playfair">Finanzas</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-xl bg-mediterranean-50 hover:bg-mediterranean-100 transition-colors duration-200 group">
                <div className="font-medium text-mediterranean-800 group-hover:text-mediterranean-900">Facturas</div>
                <div className="text-sm text-mediterranean-600">Revisar pagos pendientes</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-xl bg-coral-50 hover:bg-coral-100 transition-colors duration-200 group">
                <div className="font-medium text-coral-800 group-hover:text-coral-900">Reportes</div>
                <div className="text-sm text-coral-600">Análisis financiero</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermission="dashboard:view">
      <MediterraneanDashboard />
    </ProtectedRoute>
  );
}