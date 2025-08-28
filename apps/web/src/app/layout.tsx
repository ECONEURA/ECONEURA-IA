import type { Metadata } from 'next'
import { Inter, Playfair_Display, Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
import { Navigation } from '@/components/layout/Navigation'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair'
})

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat'
})

export const metadata: Metadata = {
  title: 'EcoNeura - Mediterranean Business Suite',
  description: 'AI-powered CRM+ERP platform with Mediterranean elegance for modern businesses',
  keywords: ['CRM', 'ERP', 'AI', 'Business Management', 'Mediterranean Design', 'Enterprise'],
  authors: [{ name: 'EcoNeura Team' }],
  robots: 'noindex, nofollow', // Private enterprise app
}

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        {/* Security Headers */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.econeura.com;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </head>
      <body className={cn(
        inter.variable,
        playfair.variable,
        montserrat.variable,
        "h-full font-sans bg-gradient-to-br from-sand-50 via-white to-mediterranean-50"
      )}>
        <AuthProvider>
          <div className="flex h-full">
            <Navigation />
            <main className="flex-1 ml-64 overflow-y-auto">
              <div className="p-6 min-h-full">
                <div className="animate-fade-in">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'text-sm',
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
