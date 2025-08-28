'use client'

import { useState } from 'react'
import { useCompanies, useDeleteCompany } from '@/hooks/useCRM'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import { CompanyForm } from '@/components/crm/CompanyForm'

export default function CompaniesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data, isLoading, error } = useCompanies({
    page,
    limit: 20,
    search: search || undefined
  })

  const deleteCompany = useDeleteCompany()

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      try {
        await deleteCompany.mutateAsync({ id })
      } catch (error) {
        alert('Error al eliminar la empresa')
      }
    }
  }

  return (
    <ProtectedRoute requiredPermission="crm:companies:read">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
              <p className="mt-2 text-gray-600">Gestiona las empresas de tu CRM</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Nueva Empresa
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Companies Table */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando empresas...
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              Error al cargar las empresas
            </div>
          ) : !data?.data.length ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M12 7h.01M8 7h.01M16 7h.01M12 11h.01M8 11h.01M16 11h.01M12 15h.01M8 15h.01M16 15h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva empresa</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contactos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deals
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/crm/companies/${company.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {company.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.industry || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          company.status === 'CUSTOMER' ? 'bg-green-100 text-green-800' :
                          company.status === 'LEAD' ? 'bg-yellow-100 text-yellow-800' :
                          company.status === 'PROSPECT' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {company.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company._count?.contacts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company._count?.deals || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/crm/companies/${company.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between items-center">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      Página {page} de {data.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Company Modal */}
        {showCreateForm && (
          <CompanyForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}