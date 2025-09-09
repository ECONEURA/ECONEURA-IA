// Department Header Component - ECONEURA Cockpit
import React from 'react';
import { getDeptColor, getDeptName, type DeptKey } from '@/lib/palette';
import { ui } from '@/lib/palette';

interface DeptHeaderProps {
  dept: DeptKey;
  kpis: {
    active: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

export default function DeptHeader({ dept, kpis }: DeptHeaderProps): void {
  const color = getDeptColor(dept);
  const name = getDeptName(dept);

  return (;
    <div style={{
      backgroundColor: ui.bg,
      borderBottom: `${ui.bw}px solid ${ui.border}`,
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: color,
          margin: 0,
          marginBottom: '8px'
        }}>
          {name}
        </h2>
        <p style={{
          fontSize: '16px',
          color: ui.muted,
          margin: 0
        }}>
          Dashboard de gestión y monitoreo
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: color
          }}>
            {kpis.active}
          </div>
          <div style={{
            fontSize: '12px',
            color: ui.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Activos
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#10B981'
          }}>
            {kpis.completed}
          </div>
          <div style={{
            fontSize: '12px',
            color: ui.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Completados
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#EF4444'
          }}>
            {kpis.failed}
          </div>
          <div style={{
            fontSize: '12px',
            color: ui.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Fallidos
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#F59E0B'
          }}>
            {kpis.pending}
          </div>
          <div style={{
            fontSize: '12px',
            color: ui.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Pendientes
          </div>
        </div>
      </div>
    </div>
  );
}

