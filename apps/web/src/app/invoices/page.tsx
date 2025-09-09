'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  BarChart3,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Download
} from 'lucide-react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

interface Invoice {
  id: string;
  number: string;
  client: string;
  clientEmail: string;
  amount: number;
  tax: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  description: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

function InvoicesContent(): void {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Mock invoices data
  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockInvoices: Invoice[] = [
        {
          id: '1',
          number: 'INV-2024-0890',
          client: 'Barcelona Innovation Hub',
          clientEmail: 'ana.martinez@barcelonainnova.com',
          amount: 65000,
          tax: 13650,
          total: 78650,
          issueDate: '2024-08-15',
          dueDate: '2024-09-15',
          status: 'sent',
          description: 'Desarrollo plataforma I+D+i - Fase 1',
          items: [
            { id: '1', description: 'Desarrollo backend', quantity: 40, unitPrice: 1200, total: 48000 },
            { id: '2', description: 'Desarrollo frontend', quantity: 20, unitPrice: 850, total: 17000 }
          ]
        },
        {
          id: '2',
          number: 'INV-2024-0889',
          client: 'Mediterráneo Tech Solutions',
          clientEmail: 'maria.garcia@mediterranetech.com',
          amount: 125000,
          tax: 26250,
          total: 151250,
          issueDate: '2024-08-10',
          dueDate: '2024-09-10',
          status: 'paid',
          paymentMethod: 'Transferencia bancaria',
          description: 'Sistema ERP completo - Implementación',
          items: [
            { id: '1', description: 'Licencias ERP', quantity: 1, unitPrice: 75000, total: 75000 },
            { id: '2', description: 'Implementación y configuración', quantity: 50, unitPrice: 1000, total: 50000 }
          ]
        },
        {
          id: '3',
          number: 'INV-2024-0888',
          client: 'Costa del Sol Business Group',
          clientEmail: 'carlos@costadelsolbiz.es',
          amount: 95000,
          tax: 19950,
          total: 114950,
          issueDate: '2024-07-25',
          dueDate: '2024-08-25',
          status: 'overdue',
          description: 'Consultoría transformación digital',
          items: [
            { id: '1', description: 'Auditoría procesos', quantity: 30, unitPrice: 1500, total: 45000 },
            { id: '2', description: 'Plan transformación', quantity: 1, unitPrice: 50000, total: 50000 }
          ]
        },
        {
          id: '4',
          number: 'INV-2024-0887',
          client: 'Madrid Corporate Systems',
          clientEmail: 'roberto@madridcorp.es',
          amount: 180000,
          tax: 37800,
          total: 217800,
          issueDate: '2024-08-28',
          dueDate: '2024-09-28',
          status: 'draft',
          description: 'Plataforma Fintech - Desarrollo completo',
          items: [
            { id: '1', description: 'Arquitectura y diseño', quantity: 80, unitPrice: 1200, total: 96000 },
            { id: '2', description: 'Desarrollo e integración', quantity: 120, unitPrice: 700, total: 84000 }
          ]
        },
        {
          id: '5',
          number: 'INV-2024-0886',
          client: 'Sevilla Sistemas Integrados',
          clientEmail: 'diego@sevillasistemas.es',
          amount: 45000,
          tax: 9450,
          total: 54450,
          issueDate: '2024-08-05',
          dueDate: '2024-09-05',
          status: 'sent',
          description: 'Migración infraestructura cloud',
          items: [
            { id: '1', description: 'Migración datos', quantity: 25, unitPrice: 800, total: 20000 },
            { id: '2', description: 'Configuración servicios', quantity: 50, unitPrice: 500, total: 25000 }
          ]
        },
        {
          id: '6',
          number: 'INV-2024-0885',
          client: 'Bilbao Digital Solutions',
          clientEmail: 'laura.jimenez@bilbaodigital.com',
          amount: 85000,
          tax: 17850,
          total: 102850,
          issueDate: '2024-07-20',
          dueDate: '2024-08-20',
          status: 'cancelled',
          description: 'Sistema marketing automation',
          items: [
            { id: '1', description: 'Plataforma base', quantity: 1, unitPrice: 60000, total: 60000 },
            { id: '2', description: 'Integraciones CRM', quantity: 25, unitPrice: 1000, total: 25000 }
          ]
        }
      ];

      setInvoices(mockInvoices);
      setLoading(false);
    };

    loadInvoices();
  }, []);

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'sent': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'paid': return 'Pagada';
      case 'overdue': return 'Vencida';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return Pencil;
      case 'sent': return Send;
      case 'paid': return CheckCircle;
      case 'overdue': return AlertTriangle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDaysUntilDue = (dueDateString: string) => {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate statistics
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0);
  const overdueCount = filteredInvoices.filter(inv => inv.status === 'overdue').length;

  if (loading) {
    return (;
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <FileText className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  return (;
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-terracotta-600 via-coral-500 to-mediterranean-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Gestión de Facturas
              </h1>
              <p className="text-coral-100 text-lg">
                {filteredInvoices.length} facturas • {formatCurrency(totalAmount)} total • {overdueCount} vencidas
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Factura
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: 'Total Facturado',
              value: formatCurrency(totalAmount),
              icon: BarChart3,
              color: 'mediterranean'
            },
            {
              label: 'Pagado',
              value: formatCurrency(paidAmount),
              icon: CheckCircle,
              color: 'green'
            },
            {
              label: 'Pendiente Cobro',
              value: formatCurrency(pendingAmount),
              icon: Clock,
              color: 'orange'
            },
            {
              label: 'Facturas Vencidas',
              value: overdueCount.toString(),
              icon: AlertTriangle,
              color: 'red'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (;
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  stat.color === 'mediterranean' ? 'bg-gradient-to-br from-mediterranean-500 to-mediterranean-600' :
                  stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  stat.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                  'bg-gradient-to-br from-red-500 to-red-600'
                }`}
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <IconComponent className="w-8 h-8 text-white mb-4" />
                  <div className="text-2xl font-bold text-white mb-1 font-playfair">
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
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mediterranean-400" />
              <input
                type="text"
                placeholder="Buscar facturas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-mediterranean-600" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex bg-mediterranean-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-mediterranean-600 shadow-sm'
                      : 'text-mediterranean-600 hover:bg-mediterranean-50'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-mediterranean-600 shadow-sm'
                      : 'text-mediterranean-600 hover:bg-mediterranean-50'
                  }`}
                >
                  Cuadrícula
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List/Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {viewMode === 'list' ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-terracotta-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Importe
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mediterranean-100">
                  {filteredInvoices.map((invoice) => {
                    const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                    const StatusIcon = getStatusIcon(invoice.status);

                    return (;
                      <tr key={invoice.id} className="hover:bg-mediterranean-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-mediterranean-800">{invoice.number}</div>
                            <div className="text-sm text-mediterranean-600 truncate max-w-48">{invoice.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-mediterranean-800">{invoice.client}</div>
                            <div className="text-sm text-mediterranean-600">{invoice.clientEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-mediterranean-800">
                              {formatCurrency(invoice.total)}
                            </div>
                            <div className="text-sm text-mediterranean-600">
                              Base: {formatCurrency(invoice.amount)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className={`font-medium ${
                              daysUntilDue < 0 ? 'text-red-600' :
                              daysUntilDue <= 7 ? 'text-orange-600' :
                              'text-mediterranean-800'
                            }`}>
                              {formatDate(invoice.dueDate)}
                            </div>
                            <div className={`text-xs ${
                              daysUntilDue < 0 ? 'text-red-600' :
                              daysUntilDue <= 7 ? 'text-orange-600' :
                              'text-mediterranean-600'
                            }`}>
                              {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencida` :
                               daysUntilDue === 0 ? 'Vence hoy' :
                               `${daysUntilDue} días restantes`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-4 h-4 text-mediterranean-600" />
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                              {getStatusLabel(invoice.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button className="p-2 text-coral-600 hover:bg-coral-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => {
              const daysUntilDue = getDaysUntilDue(invoice.dueDate);
              const StatusIcon = getStatusIcon(invoice.status);

              return (;
                <div
                  key={invoice.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-mediterranean-800 font-playfair">
                        {invoice.number}
                      </h3>
                      <p className="text-mediterranean-600 text-sm truncate">
                        {invoice.client}
                      </p>
                      <p className="text-mediterranean-500 text-xs">
                        {invoice.clientEmail}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5 text-mediterranean-600" />
                      <button className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4 text-mediterranean-400" />
                      </button>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-mediterranean-600 text-sm">Total</span>
                      <span className="font-bold text-mediterranean-800 text-lg">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-mediterranean-600 text-sm">Vencimiento</span>
                      <span className={`text-sm ${
                        daysUntilDue < 0 ? 'text-red-600' :
                        daysUntilDue <= 7 ? 'text-orange-600' :
                        'text-mediterranean-700'
                      }`}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>

                    {daysUntilDue !== null && (
                      <div className="text-xs text-mediterranean-500">
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencida` :
                         daysUntilDue === 0 ? 'Vence hoy' :
                         `${daysUntilDue} días restantes`}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-mediterranean-600 text-sm line-clamp-2">
                      {invoice.description}
                    </p>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-mediterranean-100">
                    <button className="flex-1 bg-gradient-to-r from-coral-500 to-coral-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Ver
                    </button>
                    <button className="px-3 py-2 border border-mediterranean-200 text-mediterranean-600 rounded-xl hover:bg-mediterranean-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
              No se encontraron facturas
            </h3>
            <p className="text-mediterranean-600 mb-6">
              {searchQuery || selectedStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera factura'
              }
            </p>
            <button className="bg-gradient-to-r from-coral-500 to-mediterranean-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 inline mr-2" />
              Nueva Factura
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage(): void {
  return (;
    <ProtectedRoute requiredPermission="invoices:view">
      <InvoicesContent />
    </ProtectedRoute>
  )
}
