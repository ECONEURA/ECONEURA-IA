import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, PATCH, DELETE, OPTIONS } from './route'

// Mock environment
vi.mock('@econeura/shared', () => ({
  env: () => ({
    BFF_TARGET_API: 'http://localhost:3001',
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('BFF Proxy Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should forward GET request with proper headers', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
        headers: {
          'x-org-id': 'org1',
          'authorization': 'Bearer token123',
          'x-request-id': 'req-123',
        },
      })

      const response = await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.status).toBe(200)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-org-id': 'org1',
            'authorization': 'Bearer token123',
            'x-request-id': 'req-123',
            'x-bff-proxy': 'true',
          }),
        })
      )
    })

    it('should generate correlation ID if not present', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
      })

      const response = await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.status).toBe(200)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-request-id': expect.any(String),
            'traceparent': expect.stringMatching(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/),
          }),
        })
      )
    })
  })

  describe('POST requests', () => {
    it('should forward POST request with body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const requestBody = { name: 'Test Company', email: 'test@example.com' }
      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-org-id': 'org1',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.status).toBe(201)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'content-type': 'application/json',
            'x-org-id': 'org1',
          }),
        })
      )
    })
  })

  describe('PUT requests', () => {
    it('should forward PUT request with body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const requestBody = { name: 'Updated Company' }
      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies/123', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-org-id': 'org1',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: { path: ['v1', 'crm', 'companies', '123'] } })

      expect(response.status).toBe(200)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody),
        })
      )
    })
  })

  describe('PATCH requests', () => {
    it('should forward PATCH request with body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const requestBody = { status: 'active' }
      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies/123', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-org-id': 'org1',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await PATCH(request, { params: { path: ['v1', 'crm', 'companies', '123'] } })

      expect(response.status).toBe(200)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        })
      )
    })
  })

  describe('DELETE requests', () => {
    it('should forward DELETE request', async () => {
      const mockResponse = new Response(null, { status: 204 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies/123', {
        method: 'DELETE',
        headers: {
          'x-org-id': 'org1',
        },
      })

      const response = await DELETE(request, { params: { path: ['v1', 'crm', 'companies', '123'] } })

      expect(response.status).toBe(204)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight', async () => {
      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'OPTIONS',
      })

      const response = await OPTIONS(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, x-org-id, x-request-id, traceparent')
    })
  })

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
      })

      const response = await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.status).toBe(500)
      const responseBody = await response.json()
      expect(responseBody).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
        title: 'Internal Server Error',
        status: 500,
        detail: 'BFF proxy error',
      })
    })

    it('should handle API errors with proper status codes', async () => {
      const mockResponse = new Response(JSON.stringify({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid request',
      }), {
        status: 400,
        headers: { 'content-type': 'application/problem+json' },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid request',
      })
    })
  })

  describe('Header propagation', () => {
    it('should forward essential headers', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token123',
          'content-type': 'application/json',
          'x-org-id': 'org1',
          'x-request-id': 'req-123',
          'traceparent': '00-trace-123-span-456-01',
          'correlation-id': 'corr-789',
          'user-agent': 'test-agent',
          'accept': 'application/json',
          'accept-language': 'en-US',
          'x-custom-header': 'should-not-forward',
        },
      })

      await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies',
        expect.objectContaining({
          headers: expect.objectContaining({
            'authorization': 'Bearer token123',
            'content-type': 'application/json',
            'x-org-id': 'org1',
            'x-request-id': 'req-123',
            'traceparent': '00-trace-123-span-456-01',
            'correlation-id': 'corr-789',
            'user-agent': 'test-agent',
            'accept': 'application/json',
            'accept-language': 'en-US',
            'x-bff-proxy': 'true',
          }),
        })
      )

      // Custom header should not be forwarded
      expect(fetch).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-custom-header': 'should-not-forward',
          }),
        })
      )
    })

    it('should add BFF-specific headers', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-forwarded-proto': 'https',
        },
      })

      await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/crm/companies',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-bff-proxy': 'true',
            'x-forwarded-for': '192.168.1.1',
            'x-forwarded-proto': 'https',
          }),
        })
      )
    })
  })

  describe('Response headers', () => {
    it('should forward response headers', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': '123',
          'cache-control': 'no-cache',
          'etag': 'abc123',
          'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
          'x-request-id': 'resp-123',
          'traceparent': '00-trace-456-span-789-01',
        },
      })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
      })

      const response = await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.headers.get('content-type')).toBe('application/json')
      expect(response.headers.get('content-length')).toBe('123')
      expect(response.headers.get('cache-control')).toBe('no-cache')
      expect(response.headers.get('etag')).toBe('abc123')
      expect(response.headers.get('last-modified')).toBe('Wed, 21 Oct 2015 07:28:00 GMT')
      expect(response.headers.get('x-request-id')).toBe('resp-123')
      expect(response.headers.get('traceparent')).toBe('00-trace-456-span-789-01')
    })

    it('should add CORS headers to response', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/econeura/v1/crm/companies', {
        method: 'GET',
      })

      const response = await GET(request, { params: { path: ['v1', 'crm', 'companies'] } })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, x-org-id, x-request-id, traceparent')
    })
  })
})
