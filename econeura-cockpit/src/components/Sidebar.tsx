// Sidebar Component - ECONEURA Cockpit
import React from 'react';
import { palette, getDeptColor, getDeptName, type DeptKey } from '@/lib/palette';
import { ui } from '@/lib/palette';

interface SidebarProps {
  activeDept: DeptKey;
  onDeptChange: (dept: DeptKey) => void;
}

export default function Sidebar({ activeDept, onDeptChange }: SidebarProps): void {
  const depts = Object.keys(palette) as DeptKey[];

  return (;
    <aside style={{
      width: '240px',
      backgroundColor: ui.bg,
      borderRight: `${ui.bw}px solid ${ui.border}`,
      padding: '24px 0',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <nav>
        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0
        }}>
          {depts.map((dept) => {
            const isActive = activeDept === dept;
            const color = getDeptColor(dept);
            const name = getDeptName(dept);

            return (;
              <li key={dept} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => onDeptChange(dept)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: isActive ? color : 'transparent',
                    color: isActive ? '#FFFFFF' : ui.ink,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all 0.2s ease',
                    borderLeft: isActive ? `4px solid ${color}` : '4px solid transparent'
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

