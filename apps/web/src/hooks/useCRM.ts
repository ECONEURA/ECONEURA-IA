import { useApiQuery, useApiMutation } from './useApi'
import type { Company, Contact, Deal } from '@econeura/shared'

// ============ COMPANIES ============

export function useCompanies(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()

  return useApiQuery<{
    data: Company[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>(['companies', params], `/v1/crm/companies${queryString ? `?${queryString}` : ''}`)
}

export function useCompany(id: string) {
  return useApiQuery<Company>(
    ['company', id],
    `/v1/crm/companies/${id}`,
    { enabled: !!id }
  )
}

export function useCreateCompany() {
  return useApiMutation<Company, Partial<Company>>(
    '/v1/crm/companies',
    {
      method: 'POST',
      invalidateKeys: ['companies'],
      onSuccess: () => {
        console.log('Company created successfully')
      }
    }
  )
}

export function useUpdateCompany() {
  return useApiMutation<Company, { id: string } & Partial<Company>>(
    (variables) => `/v1/crm/companies/${variables.id}`,
    {
      method: 'PUT',
      invalidateKeys: ['companies', 'company'],
    }
  )
}

export function useDeleteCompany() {
  return useApiMutation<void, { id: string }>(
    (variables) => `/v1/crm/companies/${variables.id}`,
    {
      method: 'DELETE',
      invalidateKeys: ['companies'],
    }
  )
}

// ============ CONTACTS ============

export function useContacts(params?: {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  status?: string
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()

  return useApiQuery<{
    data: Contact[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>(['contacts', params], `/v1/crm/contacts${queryString ? `?${queryString}` : ''}`)
}

export function useContact(id: string) {
  return useApiQuery<Contact>(
    ['contact', id],
    `/v1/crm/contacts/${id}`,
    { enabled: !!id }
  )
}

export function useCreateContact() {
  return useApiMutation<Contact, Partial<Contact>>(
    '/v1/crm/contacts',
    {
      method: 'POST',
      invalidateKeys: ['contacts', 'companies'],
    }
  )
}

export function useUpdateContact() {
  return useApiMutation<Contact, { id: string } & Partial<Contact>>(
    (variables) => `/v1/crm/contacts/${variables.id}`,
    {
      method: 'PUT',
      invalidateKeys: ['contacts', 'contact'],
    }
  )
}

export function useDeleteContact() {
  return useApiMutation<void, { id: string }>(
    (variables) => `/v1/crm/contacts/${variables.id}`,
    {
      method: 'DELETE',
      invalidateKeys: ['contacts', 'companies'],
    }
  )
}

// ============ DEALS ============

export function useDeals(params?: {
  page?: number
  limit?: number
  search?: string
  stage?: string
  status?: string
  assignedUserId?: string
  companyId?: string
  minValue?: number
  maxValue?: number
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()

  return useApiQuery<{
    data: Deal[]
    metrics: Array<{
      stage: string
      _sum: { value: number | null }
      _count: { id: number }
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>(['deals', params], `/v1/crm/deals${queryString ? `?${queryString}` : ''}`)
}

export function useDeal(id: string) {
  return useApiQuery<Deal>(
    ['deal', id],
    `/v1/crm/deals/${id}`,
    { enabled: !!id }
  )
}

export function useCreateDeal() {
  return useApiMutation<Deal, Partial<Deal>>(
    '/v1/crm/deals',
    {
      method: 'POST',
      invalidateKeys: ['deals', 'companies', 'contacts'],
    }
  )
}

export function useUpdateDeal() {
  return useApiMutation<Deal, { id: string } & Partial<Deal>>(
    (variables) => `/v1/crm/deals/${variables.id}`,
    {
      method: 'PUT',
      invalidateKeys: ['deals', 'deal'],
    }
  )
}

export function useDeleteDeal() {
  return useApiMutation<void, { id: string }>(
    (variables) => `/v1/crm/deals/${variables.id}`,
    {
      method: 'DELETE',
      invalidateKeys: ['deals', 'companies', 'contacts'],
    }
  )
}