// Main Cockpit Component - ECONEURA Cockpit
'use client';
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import DeptHeader from './DeptHeader';
import NeuraChat from './NeuraChat';
import AgentCard from './AgentCard';
import Timeline from './Timeline';
import Footer from './Footer';
import { type DeptKey } from '@/lib/palette';
import { type AgentConfig, type ActivityEvent, type RunOrder } from '@/lib/models';
import { getDeptName } from '@/lib/palette';

export default function Cockpit() {
  const [activeDept, setActiveDept] = useState<DeptKey>('ceo');
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<ActivityEvent[]>([]);

  // Mock data para agentes
  useEffect(() => {
    const mockAgents: AgentConfig[] = [
      {
        key: 'agent-1',
        name: 'Análisis de Datos',
        description: 'Procesa y analiza datos de ventas para generar insights',
        dept: activeDept,
        status: 'idle',
        usage: activeDept === 'ia' ? {
          tokens: 1250,
          cost: 0.0025,
          requests: 15,
          lastUpdated: new Date().toISOString()
        } : undefined
      },
      {
        key: 'agent-2',
        name: 'Reportes Automáticos',
        description: 'Genera reportes periódicos de KPIs del departamento',
        dept: activeDept,
        status: 'completed',
        usage: activeDept === 'ia' ? {
          tokens: 2100,
          cost: 0.0042,
          requests: 8,
          lastUpdated: new Date().toISOString()
        } : undefined
      },
      {
        key: 'agent-3',
        name: 'Optimización de Procesos',
        description: 'Identifica oportunidades de mejora en procesos operativos',
        dept: activeDept,
        status: 'running',
        usage: activeDept === 'ia' ? {
          tokens: 850,
          cost: 0.0017,
          requests: 3,
          lastUpdated: new Date().toISOString()
        } : undefined
      },
      {
        key: 'agent-4',
        name: 'Monitoreo de Seguridad',
        description: 'Supervisa eventos de seguridad y compliance',
        dept: activeDept,
        status: 'warning',
        usage: activeDept === 'ia' ? {
          tokens: 3200,
          cost: 0.0064,
          requests: 22,
          lastUpdated: new Date().toISOString()
        } : undefined
      }
    ];
    setAgents(mockAgents);
  }, [activeDept]);

  // Mock data para timeline
  useEffect(() => {
    const mockEvents: ActivityEvent[] = [
      {
        ts: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        dept: activeDept,
        kind: 'ok',
        msg: 'Agente "Análisis de Datos" completado exitosamente',
        key: 'event-1'
      },
      {
        ts: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        dept: activeDept,
        kind: 'info',
        msg: 'Nueva ejecución programada para "Reportes Automáticos"',
        key: 'event-2'
      },
      {
        ts: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        dept: activeDept,
        kind: 'warn',
        msg: 'Advertencia en "Optimización de Procesos": tiempo de ejecución elevado',
        key: 'event-3'
      },
      {
        ts: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        dept: activeDept,
        kind: 'ok',
        msg: 'Sistema de monitoreo actualizado correctamente',
        key: 'event-4'
      }
    ];
    setTimelineEvents(mockEvents);
  }, [activeDept]);

  const handleExecuteAgent = async (agentKey: string) => {
    const agent = agents.find(a => a.key === agentKey);
    if (!agent) return;

    // Actualizar estado del agente
    setAgents(prev => prev.map(a => 
      a.key === agentKey ? { ...a, status: 'running' as const } : a
    ));

    // Crear orden de ejecución
    const runOrder: RunOrder = {
      tenantId: 'demo-tenant',
      dept: activeDept,
      agentKey,
      trigger: 'manual',
      payload: { params: {}, hitl: false },
      idempotencyKey: `${agentKey}-${Date.now()}`,
      requestedBy: { userId: 'demo-user', role: 'admin' },
      legalBasis: 'legitimate_interest',
      dataClass: ['none'],
      ts: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runOrder)
      });

      const data = await response.json();
      
      if (data.ok) {
        // Agregar evento al timeline
        const newEvent: ActivityEvent = {
          ts: new Date().toISOString(),
          dept: activeDept,
          kind: 'ok',
          msg: `Agente "${agent.name}" ejecutado exitosamente`,
          key: `event-${Date.now()}`
        };
        setTimelineEvents(prev => [newEvent, ...prev]);

        // Simular finalización después de 3 segundos
        setTimeout(() => {
          setAgents(prev => prev.map(a => 
            a.key === agentKey ? { ...a, status: 'completed' as const } : a
          ));
        }, 3000);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error ejecutando agente:', error);
      
      // Actualizar estado a fallido
      setAgents(prev => prev.map(a => 
        a.key === agentKey ? { ...a, status: 'failed' as const } : a
      ));

      // Agregar evento de error al timeline
      const errorEvent: ActivityEvent = {
        ts: new Date().toISOString(),
        dept: activeDept,
        kind: 'err',
        msg: `Error ejecutando agente "${agent.name}": ${error}`,
        key: `error-${Date.now()}`
      };
      setTimelineEvents(prev => [errorEvent, ...prev]);
    }
  };

  const kpis = {
    active: agents.filter(a => a.status === 'running').length,
    completed: agents.filter(a => a.status === 'completed').length,
    failed: agents.filter(a => a.status === 'failed').length,
    pending: agents.filter(a => a.status === 'idle').length
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F9FAFB'
    }}>
      <Header />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeDept={activeDept} onDeptChange={setActiveDept} />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <DeptHeader dept={activeDept} kpis={kpis} />
          
          <div style={{
            flex: 1,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* NEURA Chat - Solo visible en IA */}
            {activeDept === 'ia' && (
              <NeuraChat dept={getDeptName(activeDept)} />
            )}
            
            {/* Grid de Agentes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {agents.map(agent => (
                <AgentCard
                  key={agent.key}
                  agent={agent}
                  onExecute={handleExecuteAgent}
                />
              ))}
            </div>
            
            {/* Timeline */}
            <Timeline events={timelineEvents} />
          </div>
          
          <Footer />
        </main>
      </div>
    </div>
  );
}
