import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { toast } from 'react-hot-toast'

// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/econeura'

export interface ApiError {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  correlation_id?: string
}

export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
}

/**
 * API Client for ECONEURA BFF
 */
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID
        if (!config.headers['x-request-id']) {
          config.headers['x-request-id'] = crypto.randomUUID()
        }

        // Add traceparent for observability
        if (!config.headers['traceparent']) {
          const traceId = crypto.randomUUID().replace(/-/g, '').substring(0, 32)
          const spanId = crypto.randomUUID().replace(/-/g, '').substring(0, 16)
          config.headers['traceparent'] = `00-${traceId}-${spanId}-01`
        }

        // Add organization context if available
        const orgId = this.getOrgId()
        if (orgId) {
          config.headers['x-org-id'] = orgId
        }

        // Add authorization if available
        const token = this.getAuthToken()
        if (token) {
          config.headers['authorization'] = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error: AxiosError<ApiError>) => {
        this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Get organization ID from storage
   */
  private getOrgId(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const user = localStorage.getItem('econeura_user')
      if (user) {
        const userData = JSON.parse(user)
        return userData.organizationId || null
      }
    } catch (error) {
      console.error('Error getting org ID:', error)
    }

    return null
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      return localStorage.getItem('econeura_token')
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError<ApiError>) {
    const status = error.response?.status
    const errorData = error.response?.data

    // Don't show toast for 401/403 (handled by auth)
    if (status === 401 || status === 403) {
      return
    }

    // Show error message
    const message = errorData?.detail || errorData?.title || error.message || 'API Error'

  if (typeof status === 'number' && status >= 500) {
      toast.error(`Server Error: ${message}`)
  } else if (typeof status === 'number' && status >= 400) {
      toast.error(message)
    } else {
      toast.error('Network Error')
    }

    console.error('API Error:', {
      status,
      error: errorData,
      url: error.config?.url,
      method: error.config?.method,
    })
  }

  // CRM Endpoints
  async getCompanies() {
    const response = await this.client.get('/v1/crm/companies')
    return response.data
  }

  async getCompany(id: string) {
    const response = await this.client.get(`/v1/crm/companies/${id}`)
    return response.data
  }

  async createCompany(data: any) {
    const response = await this.client.post('/v1/crm/companies', data)
    return response.data
  }

  async updateCompany(id: string, data: any) {
    const response = await this.client.put(`/v1/crm/companies/${id}`, data)
    return response.data
  }

  async deleteCompany(id: string) {
    const response = await this.client.delete(`/v1/crm/companies/${id}`)
    return response.data
  }

  async getContacts() {
    const response = await this.client.get('/v1/crm/contacts')
    return response.data
  }

  async getContact(id: string) {
    const response = await this.client.get(`/v1/crm/contacts/${id}`)
    return response.data
  }

  async createContact(data: any) {
    const response = await this.client.post('/v1/crm/contacts', data)
    return response.data
  }

  async updateContact(id: string, data: any) {
    const response = await this.client.put(`/v1/crm/contacts/${id}`, data)
    return response.data
  }

  async deleteContact(id: string) {
    const response = await this.client.delete(`/v1/crm/contacts/${id}`)
    return response.data
  }

  async getDeals() {
    const response = await this.client.get('/v1/crm/deals')
    return response.data
  }

  async getDeal(id: string) {
    const response = await this.client.get(`/v1/crm/deals/${id}`)
    return response.data
  }

  async createDeal(data: any) {
    const response = await this.client.post('/v1/crm/deals', data)
    return response.data
  }

  async updateDeal(id: string, data: any) {
    const response = await this.client.put(`/v1/crm/deals/${id}`, data)
    return response.data
  }

  async deleteDeal(id: string) {
    const response = await this.client.delete(`/v1/crm/deals/${id}`)
    return response.data
  }

  // Finance Endpoints
  async getInvoices() {
    const response = await this.client.get('/v1/finance/invoices')
    return response.data
  }

  async getInvoice(id: string) {
    const response = await this.client.get(`/v1/finance/invoices/${id}`)
    return response.data
  }

  async createInvoice(data: any) {
    const response = await this.client.post('/v1/finance/invoices', data)
    return response.data
  }

  async updateInvoice(id: string, data: any) {
    const response = await this.client.put(`/v1/finance/invoices/${id}`, data)
    return response.data
  }

  async deleteInvoice(id: string) {
    const response = await this.client.delete(`/v1/finance/invoices/${id}`)
    return response.data
  }

  // AI Endpoints
  async routeAIRequest(data: any) {
    const response = await this.client.post('/v1/ai/route', data)
    return response.data
  }

  async getAIProviderHealth() {
    const response = await this.client.get('/v1/ai/providers/health')
    return response.data
  }

  async getAICostUsage() {
    const response = await this.client.get('/v1/ai/cost/usage')
    return response.data
  }

  // Flows Endpoints
  async executeCollectionFlow(data: any) {
    const response = await this.client.post('/v1/flows/collection', data)
    return response.data
  }

  async getPlaybookStatus(playbookId: string) {
    const response = await this.client.get(`/v1/flows/${playbookId}/status`)
    return response.data
  }

  async approvePlaybook(playbookId: string, data: any) {
    const response = await this.client.post(`/v1/flows/${playbookId}/approve`, data)
    return response.data
  }

  async getAvailablePlaybooks() {
    const response = await this.client.get('/v1/flows')
    return response.data
  }

  async getExecutionHistory() {
    const response = await this.client.get('/v1/flows/history')
    return response.data
  }

  // Webhook Endpoints
  async getWebhookStats() {
    const response = await this.client.get('/webhooks/make/stats')
    return response.data
  }

  // Health Check
  async getHealth() {
    const response = await this.client.get('/health')
    return response.data
  }

  // Generic request method
  async request<T = any>(config: any): Promise<T> {
    const response = await this.client.request(config)
    return response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
// Types are already declared above; consumers can import from this module directly
