import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:5001';

// Security headers to never forward from client
const BLOCKED_HEADERS = new Set([
  'host',
  'authorization', // Will be set server-side
  'cookie',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
]);

// Headers to always add/override
const REQUIRED_HEADERS = {
  'x-org-id': process.env.ORG_ID || 'org-demo',
  'authorization': `Bearer ${process.env.ORG_API_KEY || 'key-demo-123456789abcdef'}`,
  'content-type': 'application/json',
};

async function proxyRequest(request: NextRequest, path: string, method: string) {
  try {
    const url = `${BACKEND_BASE_URL}/api/${path}`;
    
    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const text = await request.text();
        body = text || undefined;
      } catch {
        // Ignore empty body
      }
    }

    // Prepare headers
    const forwardHeaders: Record<string, string> = { ...REQUIRED_HEADERS };
    
    // Forward safe client headers
    const headersList = headers();
    headersList.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!BLOCKED_HEADERS.has(lowerKey) && !REQUIRED_HEADERS.hasOwnProperty(key)) {
        // Generate x-request-id if not present
        if (lowerKey === 'x-request-id' || key.startsWith('x-') || key === 'user-agent') {
          forwardHeaders[key] = value;
        }
      }
    });

    // Ensure x-request-id exists
    if (!forwardHeaders['x-request-id']) {
      forwardHeaders['x-request-id'] = crypto.randomUUID();
    }

    // Make backend request
    const backendResponse = await fetch(url, {
      method,
      headers: forwardHeaders,
      body,
      // Timeout for backend requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    // Get response body
    const responseText = await backendResponse.text();
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { data: responseText };
    }

    // Forward response headers (safe ones only)
    const responseHeaders = new Headers();
    const safeResponseHeaders = [
      'content-type',
      'x-request-id',
      'traceparent',
      'x-idempotent-replay',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
    ];

    safeResponseHeaders.forEach(headerName => {
      const value = backendResponse.headers.get(headerName);
      if (value) {
        responseHeaders.set(headerName, value);
      }
    });

    // Add cache control for PII protection
    responseHeaders.set('cache-control', 'no-store, no-cache, must-revalidate');
    responseHeaders.set('pragma', 'no-cache');

    return new NextResponse(JSON.stringify(responseData), {
      status: backendResponse.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('BFF Proxy Error:', error);
    
    // Return structured error response
    const errorResponse = {
      type: 'https://econeura.dev/errors/bff_proxy_error',
      title: 'BFF Proxy Error',
      status: 503,
      detail: error instanceof Error ? error.message : 'Backend service unavailable',
      instance: `bff:${crypto.randomUUID()}`,
    };

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        'content-type': 'application/problem+json',
        'cache-control': 'no-store',
      },
    });
  }
}

// HTTP method handlers
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  return proxyRequest(request, path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  return proxyRequest(request, path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  return proxyRequest(request, path, 'PUT');
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  return proxyRequest(request, path, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  return proxyRequest(request, path, 'DELETE');
}