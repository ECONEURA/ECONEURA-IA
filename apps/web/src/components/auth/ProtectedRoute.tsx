'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallback
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (;
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (;
      fallback || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">
              No tienes permisos suficientes para acceder a esta página.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
