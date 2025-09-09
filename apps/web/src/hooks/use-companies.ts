import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export function useCompanies(params?: any): void {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => apiClient.getCompanies()
  })
}

export function useCompany(id: string): void {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => apiClient.getCompany(id),
    enabled: !!id
  })
}

export function useCreateCompany(): void {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiClient.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create company');
    }
  })
}

export function useUpdateCompany(): void {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateCompany(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      toast.success('Company updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update company');
    }
  })
}

export function useDeleteCompany(): void {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiClient.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete company');
    }
  })
}
