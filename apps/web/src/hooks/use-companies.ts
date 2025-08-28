import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CompanySchema } from '@econeura/shared/schemas/crm'
import { z } from 'zod'

// Types
export type Company = z.infer<typeof CompanySchema>

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CompanyFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  industry?: string
  city?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Query keys
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: CompanyFilters) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
  stats: () => [...companyKeys.all, 'stats'] as const
}

// Hooks
export function useCompanies(filters: CompanyFilters = {}) {
  return useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Company>>('/v1/crm/companies', filters)
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => apiClient.get<{ success: boolean; data: Company }>(`/v1/crm/companies/${id}`),
    enabled: !!id
  })
}

export function useCompanyStats() {
  return useQuery({
    queryKey: companyKeys.stats(),
    queryFn: () => apiClient.get<{ success: boolean; data: any }>('/v1/crm/companies/stats')
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Company>) => 
      apiClient.post<{ success: boolean; data: Company }>('/v1/crm/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() })
    }
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
      apiClient.put<{ success: boolean; data: Company }>(`/v1/crm/companies/${id}`, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() })
    }
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/v1/crm/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() })
    }
  })
}

export function useAddContactToCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, contactId }: { companyId: string; contactId: string }) =>
      apiClient.post<{ success: boolean; message: string }>(
        `/v1/crm/companies/${companyId}/contacts`,
        { contactId }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.companyId) })
    }
  })
}

export function useCompanyActivities(companyId: string, filters: CompanyFilters = {}) {
  return useQuery({
    queryKey: ['activities', 'company', companyId, filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<any>>(`/v1/crm/companies/${companyId}/activities`, filters),
    enabled: !!companyId
  })
}