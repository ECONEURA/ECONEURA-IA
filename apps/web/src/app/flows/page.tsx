'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function FlowsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flujos Activos</h1>
        <p className="text-gray-600">Monitoreo y gestión de todos los flujos de cobro automatizados.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-blue-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Flujos</h3>
          <p className="text-gray-600 mb-4">
            Esta página contendrá el panel completo de flujos automatizados,
            incluyendo configuración, métricas y control de ejecución.
          </p>
          <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">
            🚧 En desarrollo
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FlowsPage() {
  return (
    <ProtectedRoute requiredPermission="flows:view">
      <FlowsContent />
    </ProtectedRoute>
  )
}