import axios, { AxiosError, AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private client: AxiosInstance
  private refreshPromise: Promise<void> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          // Prevent multiple refresh calls
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshAccessToken()
          }

          try {
            await this.refreshPromise
            this.refreshPromise = null
            
            // Retry original request with new token
            const token = localStorage.getItem('accessToken')
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return this.client(originalRequest)
          } catch (refreshError) {
            this.refreshPromise = null
            // Redirect to login
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async refreshAccessToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    })

    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  // CRM methods
  async getCompanies(params?: any) {
    const response = await this.client.get('/v1/crm/companies', { params })
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
    await this.client.delete(`/v1/crm/companies/${id}`)
  }

  async getContacts(params?: any) {
    const response = await this.client.get('/v1/crm/contacts', { params })
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
    await this.client.delete(`/v1/crm/contacts/${id}`)
  }

  async getDeals(params?: any) {
    const response = await this.client.get('/v1/crm/deals', { params })
    return response.data
  }

  async getDeal(id: string) {
    const response = await this.client.get(`/v1/crm/deals/${id}`)
    return response.data
  }

  async getDealsPipeline() {
    const response = await this.client.get('/v1/crm/deals/pipeline')
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
    await this.client.delete(`/v1/crm/deals/${id}`)
  }

  // ERP methods
  async getProducts(params?: any) {
    const response = await this.client.get('/v1/erp/products', { params })
    return response.data
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/v1/erp/products/${id}`)
    return response.data
  }

  async getLowStockProducts() {
    const response = await this.client.get('/v1/erp/products/low-stock')
    return response.data
  }

  async createProduct(data: any) {
    const response = await this.client.post('/v1/erp/products', data)
    return response.data
  }

  async updateProduct(id: string, data: any) {
    const response = await this.client.put(`/v1/erp/products/${id}`, data)
    return response.data
  }

  async deleteProduct(id: string) {
    await this.client.delete(`/v1/erp/products/${id}`)
  }

  // Finance methods
  async getInvoices(params?: any) {
    const response = await this.client.get('/v1/finance/invoices', { params })
    return response.data
  }

  async getInvoice(id: string) {
    const response = await this.client.get(`/v1/finance/invoices/${id}`)
    return response.data
  }

  async getInvoicesSummary() {
    const response = await this.client.get('/v1/finance/invoices/summary')
    return response.data
  }

  async createInvoice(data: any) {
    const response = await this.client.post('/v1/finance/invoices', data)
    return response.data
  }

  async updateInvoiceStatus(id: string, status: string, notes?: string) {
    const response = await this.client.put(`/v1/finance/invoices/${id}/status`, { status, notes })
    return response.data
  }
}

export const apiClient = new ApiClient()