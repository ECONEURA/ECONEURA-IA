// Timeline Component - ECONEURA Cockpit
import React from 'react';
import { ui } from '@/lib/palette';
import type { ActivityEvent } from '@/lib/models';

interface TimelineProps {
  events: ActivityEvent[];
}

export default function Timeline({ events }: TimelineProps): void {
  const getEventIcon = (kind: string) => {
    switch (kind) {
      case 'ok': return '✅';
      case 'warn': return '⚠️';
      case 'err': return '❌';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getEventColor = (kind: string) => {
    switch (kind) {
      case 'ok': return '#10B981';
      case 'warn': return '#F59E0B';
      case 'err': return '#EF4444';
      case 'info': return '#3B82F6';
      default: return ui.muted;
    }
  };

  return (;
    <div style={{
      backgroundColor: '#FFFFFF',
      border: `${ui.bw}px solid ${ui.border}`,
      borderRadius: `${ui.r}px`,
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: ui.ink,
        margin: 0,
        marginBottom: '20px'
      }}>
        Timeline de Actividad
      </h3>

      <div style={{
        maxHeight: '400px',
        overflowY: 'auto'
      }} aria-live="polite">
        {events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: ui.muted,
            fontSize: '14px',
            padding: '40px 20px'
          }}>
            No hay actividad reciente
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {events.map((event, index) => (
              <div
                key={event.key || index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getEventColor(event.kind)}`
                }}
              >
                <div style={{
                  fontSize: '16px',
                  lineHeight: '1'
                }}>
                  {getEventIcon(event.kind)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    color: ui.ink,
                    marginBottom: '4px'
                  }}>
                    {event.msg}
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: ui.muted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{event.dept.toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(event.ts).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

