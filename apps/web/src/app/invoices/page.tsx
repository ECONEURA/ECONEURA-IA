'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function InvoicesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
        <p className="text-gray-600">Vista detallada de todas las facturas y su estado de cobro.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vista de Facturas</h3>
          <p className="text-gray-600 mb-4">
            Esta página contendrá la gestión completa de facturas, filtros avanzados,
            estados de pago y herramientas de seguimiento.
          </p>
          <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">
            🚧 En desarrollo
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <ProtectedRoute requiredPermission="invoices:view">
      <InvoicesContent />
    </ProtectedRoute>
  )
}