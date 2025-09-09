'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  CheckSquare,
  Clock,
  User,
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject?: string;
  content?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  contact_id?: string;
  deal_id?: string;
  metadata?: any;
}

interface InteractionSummary {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const typeIcons = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare
};

const typeColors = {
  email: 'bg-blue-100 text-blue-800',
  call: 'bg-green-100 text-green-800',
  meeting: 'bg-purple-100 text-purple-800',
  note: 'bg-yellow-100 text-yellow-800',
  task: 'bg-orange-100 text-orange-800'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function InteractionsPage(): void {
  const { user } = useAuth();
  const api = apiClient;
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [summary, setSummary] = useState<InteractionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    company_id: '',
    contact_id: '',
    deal_id: '',
    assigned_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInteractions();
  }, [filters]);

  const loadInteractions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const data = await api.request({ url: `/interactions?${queryParams.toString()}`, method: 'GET' });
      setInteractions(data.data ?? data);
    } catch (error) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      setSummaryLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const data2 = await api.request({ url: `/interactions/summary?${queryParams.toString()}`, method: 'GET' });
      setSummary(data2.data ?? data2);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const getTypeIcon = (type: Interaction['type']) => {
    const IconComponent = typeIcons[type];
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  return (;
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mediterranean-900 font-playfair">
                Interacciones CRM
              </h1>
              <p className="text-mediterranean-600 mt-1">
                Timeline de todas las interacciones con clientes y prospectos
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSummary}
                disabled={summaryLoading}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-coral-500 to-terracotta-500 text-white rounded-lg hover:from-coral-600 hover:to-terracotta-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {summaryLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Resumen IA
              </button>
              <button className="flex items-center px-4 py-2 bg-mediterranean-600 text-white rounded-lg hover:bg-mediterranean-700 transition-colors duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Interacción
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-mediterranean-900">Filtros</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-mediterranean-600 hover:text-mediterranean-800 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} filtros
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="email">Email</option>
                <option value="call">Llamada</option>
                <option value="meeting">Reunión</option>
                <option value="note">Nota</option>
                <option value="task">Tarea</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-mediterranean-500 focus:border-transparent"
              >
                <option value="">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>

              <button
                onClick={() => setFilters({
                  type: '',
                  status: '',
                  priority: '',
                  company_id: '',
                  contact_id: '',
                  deal_id: '',
                  assigned_to: ''
                })}
                className="px-4 py-2 text-mediterranean-600 border border-mediterranean-300 rounded-lg hover:bg-mediterranean-50 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* AI Summary */}
        {summary && (
          <div className="bg-gradient-to-r from-coral-50 to-terracotta-50 border border-coral-200 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-coral-600 mr-2" />
              <h3 className="text-lg font-semibold text-coral-900">Resumen IA</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-coral-800 mb-2">Resumen</h4>
                <p className="text-coral-700 text-sm">{summary.summary}</p>
              </div>

              <div>
                <h4 className="font-medium text-coral-800 mb-2">Insights</h4>
                <ul className="space-y-1">
                  {summary.insights.map((insight, index) => (
                    <li key={index} className="text-coral-700 text-sm flex items-start">
                      <TrendingUp className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-coral-800 mb-2">Recomendaciones</h4>
                <ul className="space-y-1">
                  {summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-coral-700 text-sm flex items-start">
                      <BarChart3 className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-mediterranean-900 mb-6">Timeline de Interacciones</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mediterranean-600"></div>
              <span className="ml-3 text-mediterranean-600">Cargando interacciones...</span>
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-sand-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sand-600 mb-2">No hay interacciones</h3>
              <p className="text-sand-500">Crea tu primera interacción para comenzar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-sand-200 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${typeColors[interaction.type]}`}>
                    {getTypeIcon(interaction.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-mediterranean-900 mb-1">
                          {interaction.subject || `Interacción ${interaction.type}`}
                        </h3>
                        {interaction.content && (
                          <p className="text-sand-600 text-sm mb-2 line-clamp-2">
                            {interaction.content}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-sand-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {getTimeAgo(interaction.created_at)}
                          </span>
                          {interaction.due_date && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Vence: {formatDate(interaction.due_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[interaction.status]}`}>
                          {interaction.status === 'pending' ? 'Pendiente' :
                           interaction.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[interaction.priority]}`}>
                          {interaction.priority === 'low' ? 'Baja' :
                           interaction.priority === 'medium' ? 'Media' :
                           interaction.priority === 'high' ? 'Alta' : 'Urgente'}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 mt-3 text-xs text-sand-500">
                      {interaction.company_id && (
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          Empresa
                        </span>
                      )}
                      {interaction.contact_id && (
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          Contacto
                        </span>
                      )}
                      {interaction.deal_id && (
                        <span className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Oportunidad
                        </span>
                      )}
                      {interaction.assigned_to && (
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Asignado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
