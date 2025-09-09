// Root Layout - ECONEURA Cockpit
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ECONEURA Cockpit v7',
  description: 'Dashboard de gestión y monitoreo empresarial con IA',
  keywords: ['ECONEURA', 'Cockpit', 'IA', 'Dashboard', 'Empresa'],
  authors: [{ name: 'ECONEURA Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Para desarrollo
  openGraph: {
    title: 'ECONEURA Cockpit v7',
    description: 'Dashboard de gestión y monitoreo empresarial con IA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (;
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
