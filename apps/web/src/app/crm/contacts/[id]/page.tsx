'use client'

import React from 'react'

import { useParams } from 'next/navigation'
import { useContact } from '@/hooks/useCRM'
import { useInteractions, useCreateInteraction, useInteractionsSummary } from '@/hooks/useInteractions'
import { LoadingSpinner, Chip, FeedItem } from '@/components/ui'
import { useState, useMemo } from 'react'

export default function ContactDetailPage() {
  const params = useParams()
  const contactId = (params?.id as string) || ''
  const { data: contact, isLoading: loadingContact } = useContact(contactId)
  const [page, setPage] = useState(1)
  const { data: interactionsData, isLoading, error } = useInteractions({ entityType: 'contact', entityId: contactId, page, limit: 20 })
  const createInteraction = useCreateInteraction()
  const summaryMutation = useInteractionsSummary()

  const interactions = interactionsData?.data || []
  const pagination = interactionsData?.pagination

  const header = useMemo(() => (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{contact?.name || 'Contacto'}</h1>
        <p className="text-sm text-gray-600">{contact?.email}</p>
      </div>
      <Chip color="info">CRM</Chip>
    </div>
  ), [contact])

  const handleCreate = async (type: 'note' | 'email' | 'call') => {
    if (!contactId) return
    const body = prompt('Escribe la nota/mensaje')
    if (!body) return
    await createInteraction.mutateAsync({ entity_type: 'contact', entity_id: contactId, type, body, subject: type === 'email' ? 'Asunto' : undefined, created_by: 'me' })
  }

  const handleSummarize = async () => {
    if (!contactId) return
    const result = await summaryMutation.mutateAsync({ entityType: 'contact', entityId: contactId, limit: 10 })
    alert(result.summary)
  }

  return (
    <div className="p-6">
      {loadingContact ? (
        <div className="flex items-center gap-2"><LoadingSpinner /> Cargando contacto...</div>
      ) : (
        header
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Actividad</h2>
          <div className="flex gap-2">
            <button onClick={() => handleCreate('note')} className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Añadir nota</button>
            <button onClick={() => handleCreate('email')} className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Registrar email</button>
            <button onClick={() => handleCreate('call')} className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Registrar llamada</button>
            <button onClick={handleSummarize} className="px-3 py-2 text-sm rounded-lg bg-mediterranean-600 text-white hover:opacity-90">Resúmeme las últimas interacciones</button>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 p-4 min-h-[120px] max-h-[420px] overflow-y-auto" aria-live="polite" aria-busy={isLoading}>
          {isLoading && <div className="flex items-center gap-2"><LoadingSpinner size="sm" /> Cargando interacciones...</div>}
          {error && <p className="text-sm text-red-600">Error cargando interacciones</p>}
          {!isLoading && interactions.length === 0 && <p className="text-sm text-gray-500">Sin actividad todavía.</p>}
          <ul className="divide-y divide-gray-100">
            {interactions.map((it) => (
              <li key={it.id}>
                <FeedItem 
                  title={`${it.type.toUpperCase()} ${it.subject ? `• ${it.subject}` : ''}`}
                  description={it.body}
                  timestamp={it.created_at}
                  right={<span className="text-xs text-gray-500">{it.created_by}</span>}
                />
              </li>
            ))}
          </ul>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded border disabled:opacity-50">Anterior</button>
            <span>Página {pagination.page} de {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} className="px-2 py-1 rounded border disabled:opacity-50">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  )
}

