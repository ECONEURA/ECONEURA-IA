'use client';

import { useState } from 'react';
import { 
  Banknotes, 
  FileText, 
  CreditCard,
  BarChart3,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro
} from 'lucide-react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  averagePaymentTime: number;
  monthlyGrowth: number;
}

function MediterraneanFinance() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'invoices' | 'payments' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock finance statistics
  const financeStats: FinanceStats = {
    totalRevenue: 2847650,
    totalExpenses: 1956840,
    netProfit: 890810,
    pendingInvoices: 28,
    paidInvoices: 342,
    overdueInvoices: 12,
    averagePaymentTime: 24.5,
    monthlyGrowth: 18.4
  };

  const recentTransactions = [
    {
      id: '1',
      type: 'income',
      description: 'Pago factura #INV-2024-0856 - Mediterráneo Tech Solutions',
      amount: 85000,
      date: '2024-08-28',
      status: 'completed',
      method: 'Transferencia bancaria'
    },
    {
      id: '2',
      type: 'expense',
      description: 'Compra equipos Dell - Orden #PO-2024-0234',
      amount: 42500,
      date: '2024-08-27',
      status: 'completed',
      method: 'Tarjeta de crédito'
    },
    {
      id: '3',
      type: 'income',
      description: 'Pago factura #INV-2024-0855 - Costa del Sol Business',
      amount: 125000,
      date: '2024-08-26',
      status: 'pending',
      method: 'Transferencia bancaria'
    },
    {
      id: '4',
      type: 'expense',
      description: 'Nómina mensual - Agosto 2024',
      amount: 67800,
      date: '2024-08-25',
      status: 'completed',
      method: 'Transferencia bancaria'
    }
  ];

  const upcomingPayments = [
    {
      id: '1',
      invoice: 'INV-2024-0890',
      client: 'Barcelona Innovation Hub',
      amount: 65000,
      dueDate: '2024-09-02',
      status: 'pending',
      daysUntilDue: 5
    },
    {
      id: '2',
      invoice: 'INV-2024-0889',
      client: 'Sevilla Sistemas Integrados',
      amount: 45000,
      dueDate: '2024-09-05',
      status: 'sent',
      daysUntilDue: 8
    },
    {
      id: '3',
      invoice: 'INV-2024-0888',
      client: 'Madrid Corporate Systems',
      amount: 180000,
      dueDate: '2024-09-10',
      status: 'draft',
      daysUntilDue: 13
    }
  ];

  const quickActions = [
    {
      title: 'Nueva Factura',
      description: 'Crear factura para cliente',
      icon: DocumentTextIcon,
      color: 'coral',
      href: '/finance/invoices/new'
    },
    {
      title: 'Registrar Pago',
      description: 'Procesar pago recibido',
      icon: CreditCardIcon,
      color: 'mediterranean',
      href: '/finance/payments/new'
    },
    {
      title: 'Generar Reporte',
      description: 'Crear reporte financiero',
      icon: ChartBarIcon,
      color: 'olive',
      href: '/finance/reports/new'
    },
    {
      title: 'Gastos del Mes',
      description: 'Registrar nuevo gasto',
      icon: BanknotesIcon,
      color: 'terracotta',
      href: '/finance/expenses/new'
    }
  ];

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'pending') return 'text-orange-600 bg-orange-50';
    return type === 'income' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'sent': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'sent': return 'Enviado';
      case 'draft': return 'Borrador';
      default: return 'Desconocido';
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-terracotta-600 via-coral-500 to-mediterranean-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Centro Financiero Mediterráneo
              </h1>
              <p className="text-coral-100 text-lg">
                Gestión integral de finanzas empresariales
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Buscar facturas, pagos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 w-64"
                />
              </div>
              
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Resumen', icon: ChartBarIcon },
              { id: 'invoices', label: 'Facturas', icon: DocumentTextIcon },
              { id: 'payments', label: 'Pagos', icon: CreditCardIcon },
              { id: 'reports', label: 'Reportes', icon: BanknotesIcon }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-terracotta-500 to-coral-500 text-white shadow-md'
                      : 'text-mediterranean-700 hover:bg-mediterranean-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: 'Ingresos Totales',
                  value: formatCurrency(financeStats.totalRevenue),
                  icon: ArrowTrendingUpIcon,
                  color: 'green',
                  change: '+18.4%'
                },
                {
                  label: 'Gastos Totales',
                  value: formatCurrency(financeStats.totalExpenses),
                  icon: ArrowTrendingDownIcon,
                  color: 'red',
                  change: '+12.1%'
                },
                {
                  label: 'Beneficio Neto',
                  value: formatCurrency(financeStats.netProfit),
                  icon: CurrencyEuroIcon,
                  color: 'mediterranean',
                  change: '+24.8%'
                },
                {
                  label: 'Facturas Pendientes',
                  value: financeStats.pendingInvoices.toString(),
                  icon: ExclamationTriangleIcon,
                  color: 'orange',
                  change: '-8.2%'
                }
              ].map((kpi, index) => {
                const IconComponent = kpi.icon;
                const isPositive = !kpi.change.startsWith('-');
                
                return (
                  <div
                    key={kpi.label}
                    className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      kpi.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      kpi.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      kpi.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                      'bg-gradient-to-br from-orange-500 to-orange-600'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                    
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
                          {Math.abs(parseFloat(kpi.change.replace('%', '')))}%
                        </div>
                      </div>
                      
                      <div className="text-3xl font-bold text-white mb-1 font-playfair">
                        {kpi.value}
                      </div>
                      
                      <div className="text-white/80 text-sm font-medium">
                        {kpi.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Acciones Rápidas
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.title}
                        className={`text-left p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${
                          action.color === 'coral' ? 'bg-coral-50 hover:bg-coral-100' :
                          action.color === 'mediterranean' ? 'bg-mediterranean-50 hover:bg-mediterranean-100' :
                          action.color === 'olive' ? 'bg-olive-50 hover:bg-olive-100' :
                          'bg-terracotta-50 hover:bg-terracotta-100'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <IconComponent className={`w-5 h-5 mr-2 ${
                            action.color === 'coral' ? 'text-coral-600' :
                            action.color === 'mediterranean' ? 'text-mediterranean-600' :
                            action.color === 'olive' ? 'text-olive-600' :
                            'text-terracotta-600'
                          }`} />
                          <span className={`font-medium ${
                            action.color === 'coral' ? 'text-coral-800' :
                            action.color === 'mediterranean' ? 'text-mediterranean-800' :
                            action.color === 'olive' ? 'text-olive-800' :
                            'text-terracotta-800'
                          }`}>
                            {action.title}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          action.color === 'coral' ? 'text-coral-600' :
                          action.color === 'mediterranean' ? 'text-mediterranean-600' :
                          action.color === 'olive' ? 'text-olive-600' :
                          'text-terracotta-600'
                        }`}>
                          {action.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Transacciones Recientes
                </h3>
                
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-mediterranean-50 transition-colors duration-200">
                      <div className={`p-2 rounded-full ${getTransactionColor(transaction.type, transaction.status)}`}>
                        {transaction.type === 'income' ? (
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-mediterranean-800 text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-mediterranean-600 text-xs mt-1">
                          {transaction.method} • {formatDate(transaction.date)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`font-bold text-sm ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                            {getStatusLabel(transaction.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Payments */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-6">
                  Próximos Cobros
                </h3>
                
                <div className="space-y-4">
                  {upcomingPayments.map((payment) => (
                    <div key={payment.id} className="p-4 border border-mediterranean-100 rounded-xl hover:bg-mediterranean-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-mediterranean-800 text-sm">
                            {payment.invoice}
                          </h4>
                          <p className="text-mediterranean-600 text-xs">
                            {payment.client}
                          </p>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-mediterranean-800">
                          {formatCurrency(payment.amount)}
                        </span>
                        
                        <div className="text-right">
                          <div className={`text-sm ${
                            payment.daysUntilDue <= 3 ? 'text-red-600' :
                            payment.daysUntilDue <= 7 ? 'text-orange-600' :
                            'text-mediterranean-600'
                          }`}>
                            {payment.daysUntilDue} días
                          </div>
                          <div className="text-xs text-mediterranean-500">
                            {formatDate(payment.dueDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {selectedTab !== 'overview' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
            <div className="text-mediterranean-600 mb-4">
              <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
                {selectedTab === 'invoices' && 'Gestión de Facturas'}
                {selectedTab === 'payments' && 'Procesamiento de Pagos'}
                {selectedTab === 'reports' && 'Reportes Financieros'}
              </h3>
              <p className="text-mediterranean-600">
                Esta sección está en desarrollo. Próximamente disponible con diseño mediterráneo completo.
              </p>
            </div>
            
            <button className="bg-gradient-to-r from-terracotta-500 to-coral-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              Explorar Funcionalidades
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinancePage() {
  return (
    <ProtectedRoute requiredPermission="finance:view">
      <MediterraneanFinance />
    </ProtectedRoute>
  );
}