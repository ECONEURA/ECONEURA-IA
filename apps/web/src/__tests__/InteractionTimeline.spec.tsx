import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }))

vi.mock('@/hooks/useCRM', () => ({
  useCompany: () => ({ data: { id: 'c1', name: 'Empresa Demo', industry: 'Tech' }, isLoading: false })
}))

vi.mock('@/hooks/useInteractions', () => ({
  useInteractions: () => ({
    data: { data: [
      { id: 'i1', org_id: 'o1', entity_type: 'company', entity_id: 'c1', type: 'note', body: 'Nota 1', created_by: 'ana', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    isLoading: false,
    error: undefined,
  }),
  useCreateInteraction: () => ({ mutateAsync: vi.fn() }),
  useInteractionsSummary: () => ({ mutateAsync: vi.fn().mockResolvedValue({ summary: 'Resumen mock' }) })
}))

import Page from '@/app/crm/companies/[id]/page'

describe('Interaction timeline (company)', () => {
  it('renders timeline and allows summary', async () => {
    render(<Page />)
    expect(await screen.findByText('Empresa Demo')).toBeInTheDocument()
    expect(screen.getByText('Nota 1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Resúmeme las últimas interacciones/i }))
    // Alert shown by mock handler; just ensure click works without crash
  })
})

