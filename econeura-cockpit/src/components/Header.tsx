// Header Component - ECONEURA Cockpit
import React from 'react';
import { ui } from '@/lib/palette';

export default function Header(): void {
  return (;
    <header style={{
      backgroundColor: ui.bg,
      borderBottom: `${ui.bw}px solid ${ui.border}`,
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/logo-econeura.png"
          alt="ECONEURA"
          style={{ height: '32px', width: 'auto' }}
        />
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: ui.ink,
          margin: 0
        }}>
          ECONEURA Cockpit
        </h1>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        color: ui.muted
      }}>
        <span>Alojado en la UE</span>
        <span>•</span>
        <span>GDPR/AI Act</span>
        <span>•</span>
        <span>TLS 1.2+/AES-256</span>
      </div>
    </header>
  );
}

