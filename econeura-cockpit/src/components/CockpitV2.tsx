/**
 * Cockpit Component V2 - Sin Mocks Embebidos
 * FASE 4 - COCKPIT SIN MOCKS EMBEBIDOS
 * 
 * Funcionalidades:
 * - Consume vía BFF (NEXT_PUBLIC_API_URL)
 * - EventSource/WebSocket para progreso
 * - Costes visibles SOLO en IA
 * - Integración con FinOps
 */

'use client';
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import DeptHeader from './DeptHeader';
import NeuraChat from './NeuraChat';
import AgentCard from './AgentCard';
import Timeline from './Timeline';
import Footer from './Footer';
import CostDisplay from './CostDisplay';
import { type DeptKey } from '@/lib/palette';
import { type AgentConfig, type ActivityEvent, type RunOrder } from '@/lib/models';
import { getDeptName } from '@/lib/palette';
import { useRealtime, useAgentProgress, useTimelineEvents } from '@/lib/realtime';

export default function CockpitV2() {
  const [activeDept, setActiveDept] = useState<DeptKey>('ceo');
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<ActivityEvent[]>([]);
  const [runOrders, setRunOrders] = useState<RunOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock orgId y userId - en producción vendrían de autenticación
  const orgId = 'demo-org-123';
  const userId = 'demo-user-456';

  // Realtime connection
  const { client, connected, error: realtimeError } = useRealtime(orgId, userId);
  const realtimeTimelineEvents = useTimelineEvents(client, activeDept);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [activeDept]);

  // Update timeline with realtime events
  useEffect(() => {
    if (realtimeTimelineEvents.length > 0) {
      setTimelineEvents(prev => {
        const newEvents = realtimeTimelineEvents.filter(
          newEvent => !prev.some(existingEvent => existingEvent.id === newEvent.id)
        );
        return [...newEvents, ...prev].slice(0, 100); // Keep last 100 events
      });
    }
  }, [realtimeTimelineEvents]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load agents for current department
      const agentsResponse = await fetch(`/api/cockpit/bff?endpoint=agents&dept=${activeDept}`);
      const agentsResult = await agentsResponse.json();
      
      if (agentsResult.success) {
        setAgents(agentsResult.data);
      } else {
        throw new Error(agentsResult.error || 'Failed to load agents');
      }

      // Load timeline events
      const timelineResponse = await fetch(`/api/cockpit/bff?endpoint=timeline&dept=${activeDept}&limit=50`);
      const timelineResult = await timelineResponse.json();
      
      if (timelineResult.success) {
        setTimelineEvents(timelineResult.data);
      } else {
        throw new Error(timelineResult.error || 'Failed to load timeline');
      }

      // Load run orders
      const runOrdersResponse = await fetch(`/api/cockpit/bff?endpoint=run-orders&dept=${activeDept}`);
      const runOrdersResult = await runOrdersResponse.json();
      
      if (runOrdersResult.success) {
        setRunOrders(runOrdersResult.data);
      } else {
        throw new Error(runOrdersResult.error || 'Failed to load run orders');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentExecute = async (agentId: string, inputs: unknown) => {
    try {
      const response = await fetch('/api/cockpit/bff?endpoint=execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          inputs,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Subscribe to agent progress updates
        client?.subscribeToAgent(agentId);
        
        // Update agent status
        setAgents(prev => prev.map(agent => 
          agent.key === agentId 
            ? { ...agent, status: 'running' as const }
            : agent
        ));

        // Add timeline event
        const newEvent: ActivityEvent = {
          id: `exec-${Date.now()}`,
          type: 'agent_start',
          timestamp: new Date().toISOString(),
          dept: activeDept,
          agent: agentId,
          message: `Agente ${agentId} iniciado`,
          metadata: { executionId: result.data.executionId },
        };
        
        setTimelineEvents(prev => [newEvent, ...prev.slice(0, 99)]);
        
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to execute agent');
      }
    } catch (err) {
      console.error('Error executing agent:', err);
      throw err;
    }
  };

  const handleDeptChange = (dept: DeptKey) => {
    setActiveDept(dept);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Cockpit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el Cockpit</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadInitialData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar 
          activeDept={activeDept} 
          onDeptChange={handleDeptChange}
        />
        
        <main className="flex-1 p-6">
          <DeptHeader dept={activeDept} />
          
          {/* Connection Status */}
          {realtimeError && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-yellow-800 text-sm">
                  Conexión en tiempo real no disponible. Los datos se actualizarán manualmente.
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Agents */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Agentes de {getDeptName(activeDept)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <AgentCard
                      key={agent.key}
                      agent={agent}
                      onExecute={(inputs) => handleAgentExecute(agent.key, inputs)}
                      realtimeClient={client}
                    />
                  ))}
                </div>
              </div>

              {/* Run Orders */}
              {runOrders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Órdenes de Ejecución
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="space-y-3">
                      {runOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">{order.name}</h3>
                            <p className="text-sm text-gray-600">{order.description}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                            {order.cost && (
                              <p className="text-sm text-gray-600 mt-1">
                                {order.cost.actual.toFixed(4)}€
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Timeline and Cost Display */}
            <div className="space-y-6">
              {/* Cost Display - Only for IA department */}
              <CostDisplay dept={activeDept} orgId={orgId} userId={userId} />
              
              {/* Timeline */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Timeline
                </h2>
                <Timeline events={timelineEvents} />
              </div>

              {/* Neura Chat */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Neura Chat
                </h2>
                <NeuraChat dept={activeDept} />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
