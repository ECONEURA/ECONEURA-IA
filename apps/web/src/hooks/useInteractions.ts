import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Interaction {
  id: string
  org_id: string
  entity_type: 'company' | 'contact'
  entity_id: string
  type: 'email' | 'note' | 'call'
  subject?: string
  body: string
  created_by: string
  created_at: string
  updated_at: string
}

export function useInteractions(params: { entityType: 'company' | 'contact'; entityId: string; page?: number; limit?: number }) {
  const { entityType, entityId, page = 1, limit = 20 } = params
  return useQuery({
    queryKey: ['interactions', entityType, entityId, page, limit],
    queryFn: async () => {
      const resp = await api.get('/crm/interactions', { params: { entityType, entityId, page, limit } })
      return resp.data as { data: Interaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
    },
    enabled: !!entityId,
  })
}

export function useCreateInteraction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Interaction, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
      const resp = await api.post('/crm/interactions', payload)
      return resp.data as Interaction
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['interactions', variables.entity_type, variables.entity_id] })
    }
  })
}

export function useInteractionsSummary() {
  return useMutation({
    mutationFn: async (payload: { entityType: 'company' | 'contact'; entityId: string; limit?: number }) => {
      const resp = await api.post('/crm/interactions/summary', payload)
      return resp.data as { summary: string }
    },
  })
}

