'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus,
  Search,
  BarChart3,
  MoreVertical,
  Pencil,
  Trash2,
  Filter
} from 'lucide-react';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  createdDate: string;
  lastActivity: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
}

interface PipelineStats {
  totalValue: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  averageDealSize: number;
}

function MediterraneanDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);

  // Deal stages configuration
  const dealStages = [
    { id: 'lead', label: 'Lead', color: 'gray' },
    { id: 'qualified', label: 'Cualificado', color: 'blue' },
    { id: 'proposal', label: 'Propuesta', color: 'yellow' },
    { id: 'negotiation', label: 'Negociación', color: 'orange' },
    { id: 'closed-won', label: 'Ganado', color: 'green' },
    { id: 'closed-lost', label: 'Perdido', color: 'red' }
  ];

  // Mock deals data
  useEffect(() => {
    const loadDeals = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDeals: Deal[] = [
        {
          id: '1',
          title: 'Sistema ERP Completo',
          company: 'Mediterráneo Tech Solutions',
          contact: 'María García López',
          value: 285000,
          stage: 'negotiation',
          probability: 75,
          expectedCloseDate: '2024-09-15',
          createdDate: '2024-07-10',
          lastActivity: '2024-08-25',
          description: 'Implementación de sistema ERP integral con módulos de finanzas, inventario y CRM.',
          priority: 'high',
          assignee: 'Carlos Mendoza'
        },
        {
          id: '2',
          title: 'Consultoría Digital',
          company: 'Costa del Sol Business Group',
          contact: 'Carlos Ruiz Mendoza',
          value: 450000,
          stage: 'proposal',
          probability: 60,
          expectedCloseDate: '2024-10-30',
          createdDate: '2024-08-01',
          lastActivity: '2024-08-20',
          description: 'Transformación digital y optimización de procesos empresariales.',
          priority: 'urgent',
          assignee: 'Ana Martín'
        },
        {
          id: '3',
          title: 'Plataforma I+D+i',
          company: 'Barcelona Innovation Hub',
          contact: 'Ana Martínez Silva',
          value: 85000,
          stage: 'qualified',
          probability: 40,
          expectedCloseDate: '2024-11-20',
          createdDate: '2024-08-15',
          lastActivity: '2024-08-28',
          description: 'Desarrollo de plataforma para gestión de proyectos de innovación.',
          priority: 'medium',
          assignee: 'Diego Fernández'
        },
        {
          id: '4',
          title: 'Migración Cloud',
          company: 'Sevilla Sistemas Integrados S.L.',
          contact: 'Diego Fernández Castro',
          value: 65000,
          stage: 'closed-lost',
          probability: 0,
          expectedCloseDate: '2024-08-01',
          createdDate: '2024-06-15',
          lastActivity: '2024-07-15',
          description: 'Migración de infraestructura local a servicios cloud.',
          priority: 'low',
          assignee: 'Laura Jiménez'
        },
        {
          id: '5',
          title: 'Marketing Automation',
          company: 'Bilbao Digital Solutions',
          contact: 'Laura Jiménez Moreno',
          value: 175000,
          stage: 'lead',
          probability: 25,
          expectedCloseDate: '2024-12-15',
          createdDate: '2024-08-22',
          lastActivity: '2024-08-22',
          description: 'Sistema de automatización de marketing digital y CRM.',
          priority: 'medium',
          assignee: 'Roberto Sánchez'
        },
        {
          id: '6',
          title: 'Fintech Platform',
          company: 'Madrid Corporate Systems',
          contact: 'Roberto Sánchez Vega',
          value: 750000,
          stage: 'closed-won',
          probability: 100,
          expectedCloseDate: '2024-08-30',
          createdDate: '2024-05-01',
          lastActivity: '2024-08-27',
          description: 'Desarrollo de plataforma fintech con servicios bancarios digitales.',
          priority: 'urgent',
          assignee: 'María García'
        }
      ];
      
      setDeals(mockDeals);
      
      // Calculate pipeline stats
      const totalValue = mockDeals.reduce((sum, deal) => sum + deal.value, 0);
      const activeDeals = mockDeals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage));
      const wonDeals = mockDeals.filter(d => d.stage === 'closed-won');
      const lostDeals = mockDeals.filter(d => d.stage === 'closed-lost');
      const closedDeals = wonDeals.length + lostDeals.length;
      
      setPipelineStats({
        totalValue,
        totalDeals: mockDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        winRate: closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0,
        averageDealSize: mockDeals.length > 0 ? totalValue / mockDeals.length : 0
      });
      
      setLoading(false);
    };
    
    loadDeals();
  }, []);

  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    const matchesPriority = selectedPriority === 'all' || deal.priority === selectedPriority;
    
    return matchesSearch && matchesStage && matchesPriority;
  });

  // Group deals by stage for kanban view
  const dealsByStage = dealStages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  const getStageColor = (stageId: string) => {
    const stage = dealStages.find(s => s.id === stageId);
    switch (stage?.color) {
      case 'gray': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Deal['priority']) => {
    switch (priority) {
      case 'low': return 'text-gray-600 bg-gray-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'urgent': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: Deal['priority']) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return 'No definida';
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDaysUntilClose = (dateString: string) => {
    const today = new Date();
    const closeDate = new Date(dateString);
    const diffTime = closeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-mediterranean-200 border-t-mediterranean-500 rounded-full animate-spin mx-auto"></div>
            <Users className="w-6 h-6 text-coral-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-mediterranean-700 font-medium">Cargando oportunidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mediterranean-50 via-white to-coral-50">
      {/* Mediterranean Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-mediterranean-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair mb-2">
                Pipeline de Ventas
              </h1>
              <p className="text-terracotta-100 text-lg">
                {filteredDeals.length} oportunidades activas • {formatCurrency(pipelineStats?.totalValue || 0)} en pipeline
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Oportunidad
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-mediterranean-800 font-playfair">
                {pipelineStats?.totalDeals || 0}
              </div>
              <div className="text-sm text-mediterranean-600">Total Deals</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 font-playfair">
                {pipelineStats?.wonDeals || 0}
              </div>
              <div className="text-sm text-mediterranean-600">Ganados</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 font-playfair">
                {pipelineStats?.lostDeals || 0}
              </div>
              <div className="text-sm text-mediterranean-600">Perdidos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-terracotta-600 font-playfair">
                {pipelineStats?.winRate.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-mediterranean-600">Win Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-olive-600 font-playfair">
                €{((pipelineStats?.averageDealSize || 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-mediterranean-600">Tamaño Promedio</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-coral-600 font-playfair">
                €{((pipelineStats?.totalValue || 0) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-mediterranean-600">Valor Total</div>
            </div>
          </div>
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
                placeholder="Buscar oportunidades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-mediterranean-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Stage Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-mediterranean-600" />
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                >
                  <option value="all">Todas las etapas</option>
                  {dealStages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="border border-mediterranean-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              
              {/* View Mode */}
              <div className="flex bg-mediterranean-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'kanban' 
                      ? 'bg-white text-mediterranean-600 shadow-sm' 
                      : 'text-mediterranean-600 hover:bg-mediterranean-50'
                  }`}
                >
                  Kanban
                </button>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Kanban/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {viewMode === 'kanban' ? (
          <div className="flex gap-6 overflow-x-auto pb-6">
            {dealStages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                {/* Stage Header */}
                <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl p-4 border-b border-mediterranean-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-mediterranean-800 font-playfair">
                      {stage.label}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(stage.id)}`}>
                      {dealsByStage[stage.id]?.length || 0}
                    </span>
                  </div>
                </div>
                
                {/* Stage Content */}
                <div className="bg-white/60 backdrop-blur-sm rounded-b-2xl min-h-96 p-4 space-y-4">
                  {dealsByStage[stage.id]?.map((deal) => {
                    const daysUntilClose = getDaysUntilClose(deal.expectedCloseDate);
                    
                    return (
                      <div
                        key={deal.id}
                        className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 border border-mediterranean-100"
                      >
                        {/* Deal Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-mediterranean-800 text-sm leading-tight">
                            {deal.title}
                          </h4>
                          <button className="p-1 hover:bg-mediterranean-50 rounded-full transition-colors">
                            <MoreVertical className="w-4 h-4 text-mediterranean-400" />
                          </button>
                        </div>
                        
                        {/* Deal Details */}
                        <div className="space-y-2 mb-3">
                          <div className="text-xs text-mediterranean-600">
                            <strong>{deal.company}</strong>
                          </div>
                          <div className="text-xs text-mediterranean-600">
                            {deal.contact}
                          </div>
                        </div>
                        
                        {/* Value and Probability */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-mediterranean-800">
                            {formatCurrency(deal.value)}
                          </div>
                          <div className="text-xs text-mediterranean-600">
                            {deal.probability}% prob.
                          </div>
                        </div>
                        
                        {/* Priority and Close Date */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                            {getPriorityLabel(deal.priority)}
                          </span>
                          
                          <div className={`text-xs ${
                            daysUntilClose < 0 ? 'text-red-600' :
                            daysUntilClose <= 7 ? 'text-orange-600' :
                            'text-mediterranean-600'
                          }`}>
                            {daysUntilClose < 0 ? 'Retrasado' :
                             daysUntilClose === 0 ? 'Hoy' :
                             daysUntilClose === 1 ? 'Mañana' :
                             `${daysUntilClose} días`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty State for Stage */}
                  {(!dealsByStage[stage.id] || dealsByStage[stage.id].length === 0) && (
                    <div className="text-center py-8 text-mediterranean-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay oportunidades en esta etapa</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-terracotta-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Oportunidad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Etapa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Probabilidad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Cierre Esperado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-mediterranean-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mediterranean-100">
                  {filteredDeals.map((deal) => {
                    const daysUntilClose = getDaysUntilClose(deal.expectedCloseDate);
                    return (
                      <tr key={deal.id} className="hover:bg-mediterranean-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-mediterranean-800">{deal.title}</div>
                            <div className="text-sm text-mediterranean-600">{deal.contact}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-mediterranean-800">{deal.company}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-mediterranean-800">
                            {formatCurrency(deal.value)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(deal.stage)}`}>
                            {dealStages.find(s => s.id === deal.stage)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-mediterranean-800 mr-2">{deal.probability}%</span>
                            <div className="w-16 bg-mediterranean-200 rounded-full h-2">
                              <div 
                                className="bg-terracotta-500 h-2 rounded-full" 
                                style={{ width: `${deal.probability}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${
                            daysUntilClose < 0 ? 'text-red-600' :
                            daysUntilClose <= 7 ? 'text-orange-600' :
                            'text-mediterranean-600'
                          }`}>
                            {formatDate(deal.expectedCloseDate)}
                            <div className="text-xs">
                              {daysUntilClose < 0 ? 'Retrasado' :
                               daysUntilClose === 0 ? 'Hoy' :
                               daysUntilClose === 1 ? 'Mañana' :
                               `en ${daysUntilClose} días`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                            {getPriorityLabel(deal.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button className="p-2 text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition-colors">
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-mediterranean-600 hover:bg-mediterranean-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
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
        )}

        {/* Empty State */}
        {filteredDeals.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-mediterranean-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-mediterranean-800 font-playfair mb-2">
              No se encontraron oportunidades
            </h3>
            <p className="text-mediterranean-600 mb-6">
              {searchQuery || selectedStage !== 'all' || selectedPriority !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera oportunidad'
              }
            </p>
            <button className="bg-gradient-to-r from-terracotta-500 to-mediterranean-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 inline mr-2" />
              Nueva Oportunidad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  return (
    <ProtectedRoute requiredPermission="crm:deals:view">
      <MediterraneanDeals />
    </ProtectedRoute>
  );
}