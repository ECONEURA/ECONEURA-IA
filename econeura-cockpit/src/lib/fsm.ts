// FSM (Finite State Machine) para estados de agentes - ECONEURA Cockpit
import { AgentStatus } from './models';

export const can = (from: AgentStatus, to: AgentStatus): boolean => {
  const transitions: Record<AgentStatus, AgentStatus[]> = {
    idle: ['running', 'paused'],
    running: ['hitl_wait', 'completed', 'warning', 'failed', 'paused'],
    hitl_wait: ['completed', 'failed', 'paused'],
    completed: ['running', 'idle'],
    warning: ['running', 'paused'],
    failed: ['running', 'idle'],
    paused: ['running', 'idle'],
  };
  
  return transitions[from].includes(to);
};

export const getStatusColor = (status: AgentStatus): string => {
  const colors: Record<AgentStatus, string> = {
    idle: '#6B7280',
    running: '#3B82F6',
    hitl_wait: '#F59E0B',
    completed: '#10B981',
    warning: '#F59E0B',
    failed: '#EF4444',
    paused: '#8B5CF6',
  };
  
  return colors[status];
};

export const getStatusLabel = (status: AgentStatus): string => {
  const labels: Record<AgentStatus, string> = {
    idle: 'Inactivo',
    running: 'Ejecutando',
    hitl_wait: 'Esperando intervención',
    completed: 'Completado',
    warning: 'Advertencia',
    failed: 'Fallido',
    paused: 'Pausado',
  };
  
  return labels[status];
};

