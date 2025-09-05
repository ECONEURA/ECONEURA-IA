'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  BarChart3,
  RefreshCw,
  Settings,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  XCircle
} from 'lucide-react';

interface AgentStats {
  id: string;
  name: string;
  category: string;
  executions: number;
  successRate: number;
  avgExecutionTime: number;
  avgCost: number;
  lastExecution: string | null;
  status: 'idle' | 'running' | 'error';
}

interface CockpitData {
  agents: {
    total: number;
    running: number;
    failed: number;
    categories: Record<string, number>;
  };
  costs: {
    totalSpent: number;
    budgetUsed: number;
    topSpenders: Array<{
      agentId: string;
      cost: number;
    }>;
  };
  performance: {
    p95ResponseTime: number;
    errorRate: number;
    availability: number;
  };
  queues: {
    pending: number;
    processing: number;
    failed: number;
  };
}

const CATEGORY_COLORS = {
  ventas: 'bg-blue-500',
  marketing: 'bg-green-500',
  operaciones: 'bg-yellow-500',
  finanzas: 'bg-purple-500',
  soporte_qa: 'bg-red-500',
};

const CATEGORY_LABELS = {
  ventas: 'Ventas',
  marketing: 'Marketing',
  operaciones: 'Operaciones',
  finanzas: 'Finanzas',
  soporte_qa: 'Soporte/QA',
};

export default function CockpitPage() {
  const [cockpitData, setCockpitData] = useState<CockpitData | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchCockpitData = async () => {
    try {
      const [overviewRes, agentsRes] = await Promise.all([
        fetch('/api/econeura/v1/cockpit/overview'),
        fetch('/api/econeura/v1/cockpit/agents')
      ]);

      if (overviewRes.ok && agentsRes.ok) {
        const overviewData = await overviewRes.json();
        const agentsData = await agentsRes.json();
        
        setCockpitData(overviewData.data);
        setAgentStats(agentsData.data.agents);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch cockpit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCockpitData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchCockpitData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    fetchCockpitData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Cargando Cockpit...</span>
        </div>
      </div>
    );
  }

  if (!cockpitData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar los datos del cockpit</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 ECONEURA Cockpit
              </h1>
              <p className="text-gray-600 mt-2">
                Panel operacional unificado - 60 agentes IA en Azure
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {autoRefresh ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                {autoRefresh ? 'Auto' : 'Manual'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Agentes Totales</p>
                <p className="text-2xl font-bold text-gray-900">{cockpitData.agents.total}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {cockpitData.agents.running} ejecutándose
              </span>
              {cockpitData.agents.failed > 0 && (
                <span className="text-red-600 ml-4 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {cockpitData.agents.failed} fallidos
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coste Total</p>
                <p className="text-2xl font-bold text-gray-900">€{cockpitData.costs.totalSpent.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Presupuesto usado</span>
                <span className="font-medium">{cockpitData.costs.budgetUsed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    cockpitData.costs.budgetUsed > 90 ? 'bg-red-500' :
                    cockpitData.costs.budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(cockpitData.costs.budgetUsed, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">P95 Response</p>
                <p className="text-2xl font-bold text-gray-900">{cockpitData.performance.p95ResponseTime}ms</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center ${
                cockpitData.performance.p95ResponseTime <= 350 ? 'text-green-600' : 'text-red-600'
              }`}>
                {cockpitData.performance.p95ResponseTime <= 350 ? (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-1" />
                )}
                Target: ≤350ms
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponibilidad</p>
                <p className="text-2xl font-bold text-gray-900">{cockpitData.performance.availability}%</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center ${
                cockpitData.performance.availability >= 99.9 ? 'text-green-600' : 'text-red-600'
              }`}>
                {cockpitData.performance.availability >= 99.9 ? (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-1" />
                )}
                Target: ≥99.9%
              </span>
            </div>
          </div>
        </div>

        {/* Agent Categories */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Agentes por Categoría</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(cockpitData.agents.categories).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} flex items-center justify-center text-white font-bold text-xl mb-2`}>
                    {count}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  </p>
                  <p className="text-xs text-gray-500">12 agentes</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estado de Colas</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Pendientes</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{cockpitData.queues.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Procesando</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{cockpitData.queues.processing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Fallidos</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{cockpitData.queues.failed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Agentes por Coste</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {cockpitData.costs.topSpenders.slice(0, 5).map((spender, index) => (
                  <div key={spender.agentId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{spender.agentId}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">€{spender.cost.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Details Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detalle de Agentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ejecuciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Éxito %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiempo Prom.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coste Prom.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentStats.slice(0, 20).map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                        CATEGORY_COLORS[agent.category as keyof typeof CATEGORY_COLORS]
                      }`}>
                        {CATEGORY_LABELS[agent.category as keyof typeof CATEGORY_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.executions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`${
                        agent.successRate >= 95 ? 'text-green-600' :
                        agent.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {agent.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.avgExecutionTime.toLocaleString()}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{agent.avgCost.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.status === 'running' ? 'bg-green-100 text-green-800' :
                        agent.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status === 'running' && <Activity className="h-3 w-3 mr-1" />}
                        {agent.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {agent.status === 'idle' && <Clock className="h-3 w-3 mr-1" />}
                        {agent.status === 'running' ? 'Ejecutando' :
                         agent.status === 'error' ? 'Error' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}