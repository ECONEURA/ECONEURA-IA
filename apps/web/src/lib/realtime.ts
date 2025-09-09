/**
 * Sistema de tiempo real para Cockpit
 * FASE 4 - COCKPIT SIN MOCKS EMBEBIDOS
 * 
 * Funcionalidades:
 * - EventSource para progreso en tiempo real
 * - WebSocket para actualizaciones instantáneas
 * - Reconexión automática
 * - Manejo de errores
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface RealtimeEvent {
  type: string;
  data: unknown;
  timestamp: string;
  correlationId?: string;
}

export interface AgentProgressEvent {
  type: 'agent_progress';
  data: {
    agentId: string;
    progress: {
      current: number;
      total: number;
      message: string;
    };
    status: 'running' | 'completed' | 'error' | 'paused';
  };
  timestamp: string;
  correlationId: string;
}

export interface CostUpdateEvent {
  type: 'cost_update';
  data: {
    orgId: string;
    currentDaily: number;
    currentMonthly: number;
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    killSwitchActive: boolean;
  };
  timestamp: string;
}

export interface TimelineEvent {
  type: 'timeline_event';
  data: {
    id: string;
    type: 'agent_start' | 'agent_complete' | 'agent_error' | 'system_alert' | 'user_action';
    timestamp: string;
    dept: string;
    agent?: string;
    message: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface SystemAlertEvent {
  type: 'system_alert';
  data: {
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    dept?: string;
    agentId?: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: string;
}

export type CockpitEvent = AgentProgressEvent | CostUpdateEvent | TimelineEvent | SystemAlertEvent;

// ============================================================================
// REALTIME CLIENT
// ============================================================================

export class RealtimeClient extends EventEmitter {
  private eventSource: EventSource | null = null;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private orgId: string;
  private userId: string;

  constructor(orgId: string, userId: string) {
    super();
    this.orgId = orgId;
    this.userId = userId;
  }

  connect(): void {
    this.connectEventSource();
    this.connectWebSocket();
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  private connectEventSource(): void {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${baseURL}/v1/events/stream?orgId=${this.orgId}&userId=${this.userId}`;
    
    this.eventSource = new EventSource(url);
    
    this.eventSource.onopen = () => {
      console.log('EventSource connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as CockpitEvent;
        this.handleEvent(data);
      } catch (error) {
        console.error('Error parsing EventSource message:', error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      this.isConnected = false;
      this.emit('error', error);
      this.scheduleReconnect();
    };
    
    // Listen for specific event types
    this.eventSource.addEventListener('agent_progress', (event) => {
      try {
        const data = JSON.parse(event.data) as AgentProgressEvent;
        this.emit('agent_progress', data);
      } catch (error) {
        console.error('Error parsing agent_progress event:', error);
      }
    });
    
    this.eventSource.addEventListener('cost_update', (event) => {
      try {
        const data = JSON.parse(event.data) as CostUpdateEvent;
        this.emit('cost_update', data);
      } catch (error) {
        console.error('Error parsing cost_update event:', error);
      }
    });
    
    this.eventSource.addEventListener('timeline_event', (event) => {
      try {
        const data = JSON.parse(event.data) as TimelineEvent;
        this.emit('timeline_event', data);
      } catch (error) {
        console.error('Error parsing timeline_event:', error);
      }
    });
    
    this.eventSource.addEventListener('system_alert', (event) => {
      try {
        const data = JSON.parse(event.data) as SystemAlertEvent;
        this.emit('system_alert', data);
      } catch (error) {
        console.error('Error parsing system_alert event:', error);
      }
    });
  }

  private connectWebSocket(): void {
    const baseURL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const url = `${baseURL}/v1/ws?orgId=${this.orgId}&userId=${this.userId}`;
    
    this.websocket = new WebSocket(url);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    };
    
    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as CockpitEvent;
        this.handleEvent(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
      this.emit('error', error);
      this.scheduleReconnect();
    };
    
    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.emit('disconnected');
      this.scheduleReconnect();
    };
  }

  private handleEvent(event: CockpitEvent): void {
    this.emit(event.type, event);
    this.emit('event', event);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // Public methods for sending data
  sendAgentCommand(agentId: string, command: string, data?: unknown): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'agent_command',
        data: {
          agentId,
          command,
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    }
  }

  subscribeToAgent(agentId: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'subscribe',
        data: {
          resource: 'agent',
          id: agentId,
          timestamp: new Date().toISOString(),
        },
      }));
    }
  }

  unsubscribeFromAgent(agentId: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'unsubscribe',
        data: {
          resource: 'agent',
          id: agentId,
          timestamp: new Date().toISOString(),
        },
      }));
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get reconnectAttemptsCount(): number {
    return this.reconnectAttempts;
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useState, useRef } from 'react';

export function useRealtime(orgId: string, userId: string) {
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

  useEffect(() => {
    const realtimeClient = new RealtimeClient(orgId, userId);
    clientRef.current = realtimeClient;
    setClient(realtimeClient);

    realtimeClient.on('connected', () => {
      setConnected(true);
      setError(null);
    });

    realtimeClient.on('disconnected', () => {
      setConnected(false);
    });

    realtimeClient.on('error', (err) => {
      setError(err);
    });

    realtimeClient.connect();

    return () => {
      realtimeClient.disconnect();
      clientRef.current = null;
    };
  }, [orgId, userId]);

  return {
    client,
    connected,
    error,
    sendAgentCommand: (agentId: string, command: string, data?: unknown) => {
      clientRef.current?.sendAgentCommand(agentId, command, data);
    },
    subscribeToAgent: (agentId: string) => {
      clientRef.current?.subscribeToAgent(agentId);
    },
    unsubscribeFromAgent: (agentId: string) => {
      clientRef.current?.unsubscribeFromAgent(agentId);
    },
  };
}

export function useAgentProgress(agentId: string, client: RealtimeClient | null) {
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error' | 'paused'>('idle');

  useEffect(() => {
    if (!client) return;

    const handleProgress = (event: AgentProgressEvent) => {
      if (event.data.agentId === agentId) {
        setProgress(event.data.progress);
        setStatus(event.data.status);
      }
    };

    client.on('agent_progress', handleProgress);
    client.subscribeToAgent(agentId);

    return () => {
      client.off('agent_progress', handleProgress);
      client.unsubscribeFromAgent(agentId);
    };
  }, [client, agentId]);

  return { progress, status };
}

export function useCostUpdates(client: RealtimeClient | null) {
  const [costStatus, setCostStatus] = useState<{
    currentDaily: number;
    currentMonthly: number;
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    killSwitchActive: boolean;
  } | null>(null);

  useEffect(() => {
    if (!client) return;

    const handleCostUpdate = (event: CostUpdateEvent) => {
      setCostStatus(event.data);
    };

    client.on('cost_update', handleCostUpdate);

    return () => {
      client.off('cost_update', handleCostUpdate);
    };
  }, [client]);

  return costStatus;
}

export function useTimelineEvents(client: RealtimeClient | null, dept?: string) {
  const [events, setEvents] = useState<TimelineEvent['data'][]>([]);

  useEffect(() => {
    if (!client) return;

    const handleTimelineEvent = (event: TimelineEvent) => {
      if (!dept || event.data.dept === dept) {
        setEvents(prev => [event.data, ...prev.slice(0, 49)]); // Keep last 50 events
      }
    };

    client.on('timeline_event', handleTimelineEvent);

    return () => {
      client.off('timeline_event', handleTimelineEvent);
    };
  }, [client, dept]);

  return events;
}
