'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function ReportsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
        <p className="text-gray-600">Informes detallados de rendimiento financiero y operativo.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-green-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Centro de Reportes</h3>
          <p className="text-gray-600 mb-4">
            Esta página contendrá dashboards interactivos, métricas de negocio,
            reportes de AI y análisis de rendimiento del sistema.
          </p>
          <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">
            📊 En desarrollo
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredPermission="reports:view">
      <ReportsContent />
    </ProtectedRoute>
  )
}