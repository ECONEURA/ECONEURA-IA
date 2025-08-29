import axios, { AxiosInstance } from 'axios'
import { env } from '@/lib/env'

let instance: AxiosInstance | null = null

export function getApiClient(): AxiosInstance {
  if (instance) return instance

  instance = axios.create({
    baseURL: `${env.NEXT_PUBLIC_API_BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })

  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (resp) => resp,
    async (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}

export const api = getApiClient()

