import { NextRequest, NextResponse } from 'next/server'
import { env } from '@econeura/shared'

const API_BASE_URL = env().BFF_TARGET_API || 'http://localhost:3001'

/**
 * BFF Proxy for ECONEURA API
 * Forwards requests to the backend API with proper header propagation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const targetPath = pathSegments.join('/')
    const targetUrl = `${API_BASE_URL}/api/${targetPath}`

    // Get request body if present
    let body: string | undefined
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.text()
      } catch {
        // No body present
      }
    }

    // Prepare headers to forward
    const headers = new Headers()

    // Forward essential headers
    const headersToForward = [
      'authorization',
      'content-type',
      'x-org-id',
      'x-request-id',
      'traceparent',
      'correlation-id',
      'user-agent',
      'accept',
      'accept-language',
    ]

    headersToForward.forEach(header => {
      const value = request.headers.get(header)
      if (value) {
        headers.set(header, value);
      }
    })

    // Generate correlation ID if not present
    if (!headers.get('x-request-id')) {
      const correlationId = crypto.randomUUID()
      headers.set('x-request-id', correlationId);
    }

    // Set traceparent if not present
    if (!headers.get('traceparent')) {
      const traceId = crypto.randomUUID().replace(/-/g, '').substring(0, 32)
      const spanId = crypto.randomUUID().replace(/-/g, '').substring(0, 16)
      headers.set('traceparent', `00-${traceId}-${spanId}-01`);
    }

    // Add BFF-specific headers
    headers.set('x-bff-proxy', 'true');
    headers.set('x-forwarded-for', request.ip || request.headers.get('x-forwarded-for') || 'unknown')
    headers.set('x-forwarded-proto', request.headers.get('x-forwarded-proto') || 'http')

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    }

    // Add body if present
    if (body) {
      fetchOptions.body = body
    }

    // Forward request to API
    const response = await fetch(targetUrl, fetchOptions)

    // Get response body
    const responseBody = await response.text()

    // Prepare response headers
    const responseHeaders = new Headers()

    // Forward response headers
    const responseHeadersToForward = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
      'x-request-id',
      'traceparent',
    ]

    responseHeadersToForward.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders.set(header, value);
      }
    })

    // Add CORS headers for web requests
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-org-id, x-request-id, traceparent');

    // Return response
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('BFF Proxy Error:', error);

    // Return error response
    const errorResponse = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'BFF proxy error',
      instance: `/api/econeura/${pathSegments.join('/')}`,
      correlation_id: request.headers.get('x-request-id') || crypto.randomUUID(),
    }

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/problem+json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-org-id, x-request-id, traceparent',
      },
    })
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest): void {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-org-id, x-request-id, traceparent',
      'Access-Control-Max-Age': '86400',
    },
  })
}
