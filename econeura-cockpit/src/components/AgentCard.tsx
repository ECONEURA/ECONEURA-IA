// Agent Card Component - ECONEURA Cockpit
import React from 'react';
import { getStatusColor, getStatusLabel } from '@/lib/fsm';
import { ui } from '@/lib/palette';
import type { AgentConfig } from '@/lib/models';

interface AgentCardProps {
  agent: AgentConfig;
  onExecute: (agentKey: string) => void;
}

export default function AgentCard({ agent, onExecute }: AgentCardProps) {
  const statusColor = getStatusColor(agent.status);
  const statusLabel = getStatusLabel(agent.status);

  const canExecute = agent.status === 'idle' || agent.status === 'completed' || agent.status === 'failed';

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: `${ui.bw}px solid ${ui.border}`,
      borderRadius: `${ui.r}px`,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: ui.ink,
          margin: 0
        }}>
          Agente: {agent.name}
        </h4>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: `${statusColor}20`,
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          color: statusColor
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColor
          }} />
          {statusLabel}
        </div>
      </div>

      <p style={{
        fontSize: '14px',
        color: ui.muted,
        margin: 0,
        lineHeight: '1.4'
      }}>
        {agent.description}
      </p>

      {agent.usage && (
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '12px',
          color: ui.muted
        }}>
          <span>Tokens: {agent.usage.tokens.toLocaleString()}</span>
          <span>Coste: €{agent.usage.cost.toFixed(4)}</span>
          <span>Requests: {agent.usage.requests}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: 'auto'
      }}>
        <button
          onClick={() => onExecute(agent.key)}
          disabled={!canExecute}
          style={{
            flex: 1,
            backgroundColor: canExecute ? '#3B82F6' : ui.border,
            color: canExecute ? '#FFFFFF' : ui.muted,
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: canExecute ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (canExecute) {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }
          }}
          onMouseOut={(e) => {
            if (canExecute) {
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }
          }}
        >
          Ejecutar
        </button>
        
        <button
          style={{
            backgroundColor: 'transparent',
            color: ui.muted,
            border: `${ui.bw}px solid ${ui.border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = ui.border;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Ver logs
        </button>
      </div>
    </div>
  );
}
