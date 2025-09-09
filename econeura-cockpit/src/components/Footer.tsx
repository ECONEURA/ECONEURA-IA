// Footer Component - ECONEURA Cockpit
import React from 'react';
import { ui } from '@/lib/palette';

export default function Footer(): void {
  return (;
    <footer style={{
      backgroundColor: ui.bg,
      borderTop: `${ui.bw}px solid ${ui.border}`,
      padding: '24px',
      marginTop: 'auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14px',
          color: ui.muted
        }}>
          <span>Alojado en la UE</span>
          <span>•</span>
          <span>GDPR/AI Act</span>
          <span>•</span>
          <span>TLS 1.2+/AES-256</span>
          <span>•</span>
          <span>SSO Entra ID</span>
          <span>•</span>
          <span>(ISO 27001 alineado)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '12px',
            color: ui.muted,
            textAlign: 'right'
          }}>
            <div>© 2024 ECONEURA</div>
            <div>Versión 7.0</div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#0078D4',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              A
            </div>
            <span style={{
              fontSize: '12px',
              color: ui.muted
            }}>
              Azure
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

