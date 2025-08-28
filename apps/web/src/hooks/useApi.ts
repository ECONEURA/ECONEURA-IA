import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ApiOptions extends RequestInit {
  skipAuth?: boolean
}

export function useApiClient() {
  const { token } = useAuth()

  const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
    const { skipAuth = false, ...fetchOptions } = options
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (!skipAuth && token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || error.detail || 'API Error')
    }

    // Return null for 204 No Content
    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  return { apiCall }
}

// Generic query hook
export function useApiQuery<T = any>(
  key: string | string[],
  endpoint: string,
  options?: ApiOptions & { enabled?: boolean }
) {
  const { apiCall } = useApiClient()
  
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: () => apiCall(endpoint, options),
    enabled: options?.enabled !== false,
  })
}

// Generic mutation hook
export function useApiMutation<TData = any, TVariables = any>(
  endpoint: string | ((variables: TVariables) => string),
  options?: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    invalidateKeys?: string[]
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
  }
) {
  const { apiCall } = useApiClient()
  const queryClient = useQueryClient()
  
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const url = typeof endpoint === 'function' ? endpoint(variables) : endpoint
      const method = options?.method || 'POST'
      
      return apiCall(url, {
        method,
        body: method === 'DELETE' ? undefined : JSON.stringify(variables),
      })
    },
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}