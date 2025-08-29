'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner, Chip } from '@/components/ui'

interface ApprovalItem {
  id: string
  customer: string
  invoice: string
  amount: number
  status: 'pending_approval' | 'approved' | 'expired'
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for CI; replace with API call when backend is ready
    const mock: ApprovalItem[] = [
      { id: 'f1', customer: 'Acme Corp', invoice: 'INV-1001', amount: 123400, status: 'pending_approval' },
    ]
    setItems(mock)
    setLoading(false)
  }, [])

  const approve = async (id: string) => {
    // In real impl, call POST /api/flows/:id/approve
    setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'approved' } : it))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Bandeja de Aprobaciones</h1>
      </div>
      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="flex items-center gap-2"><LoadingSpinner /> Cargando...</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No hay aprobaciones pendientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Factura</th>
                  <th className="py-2">Importe</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(it => (
                  <tr key={it.id}>
                    <td className="py-2">{it.customer}</td>
                    <td className="py-2">{it.invoice}</td>
                    <td className="py-2">€{(it.amount/100).toFixed(2)}</td>
                    <td className="py-2">
                      <Chip color={it.status === 'pending_approval' ? 'warning' : it.status === 'approved' ? 'success' : 'danger'}>
                        {it.status === 'pending_approval' ? 'Pendiente' : it.status === 'approved' ? 'Aprobado' : 'Expirado'}
                      </Chip>
                    </td>
                    <td className="py-2">
                      {it.status === 'pending_approval' && (
                        <button className="px-3 py-1.5 text-sm rounded-lg bg-mediterranean-600 text-white hover:opacity-90" onClick={() => approve(it.id)}>
                          Aprobar y Enviar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

