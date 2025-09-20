import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'ECONEURA Cockpit',
  description: 'Baseline UI para snapshots de Playwright (≤2%)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
