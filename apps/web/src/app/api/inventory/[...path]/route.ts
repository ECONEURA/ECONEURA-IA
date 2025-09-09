import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// INVENTORY BFF ROUTES - PR-34
// ============================================================================
// Backend for Frontend proxy for inventory kardex API

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    const { searchParams } = new URL(request.url);

    // Build the API path
    const apiPath = `/v1/inventory-kardex/${path.join('/')}`;
    const queryString = searchParams.toString();
    const fullUrl = `${API_BASE_URL}${apiPath}${queryString ? `?${queryString}` : ''}`;

    // Add FinOps headers
    const headers: Record<string, string> = {
      'X-Request-Id': crypto.randomUUID(),
      'X-Org-Id': 'demo-org-1',
      'X-User-Id': 'web-user',
      'X-Source': 'web-bff',
      'Content-Type': 'application/json'
    };

    const startTime = Date.now();

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-Latency-ms': latency.toString(),
        'X-Request-Id': headers['X-Request-Id'],
        'X-Org-Id': headers['X-Org-Id']
      }
    });

  } catch (error) {
    console.error('Inventory BFF GET error:', error);
    return NextResponse.json(;
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    const body = await request.json();

    // Build the API path
    const apiPath = `/v1/inventory-kardex/${path.join('/')}`;
    const fullUrl = `${API_BASE_URL}${apiPath}`;

    // Add FinOps headers
    const headers: Record<string, string> = {
      'X-Request-Id': crypto.randomUUID(),
      'X-Org-Id': 'demo-org-1',
      'X-User-Id': 'web-user',
      'X-Source': 'web-bff',
      'Content-Type': 'application/json'
    };

    const startTime = Date.now();

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-Latency-ms': latency.toString(),
        'X-Request-Id': headers['X-Request-Id'],
        'X-Org-Id': headers['X-Org-Id']
      }
    });

  } catch (error) {
    console.error('Inventory BFF POST error:', error);
    return NextResponse.json(;
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    const body = await request.json();

    // Build the API path
    const apiPath = `/v1/inventory-kardex/${path.join('/')}`;
    const fullUrl = `${API_BASE_URL}${apiPath}`;

    // Add FinOps headers
    const headers: Record<string, string> = {
      'X-Request-Id': crypto.randomUUID(),
      'X-Org-Id': 'demo-org-1',
      'X-User-Id': 'web-user',
      'X-Source': 'web-bff',
      'Content-Type': 'application/json'
    };

    const startTime = Date.now();

    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-Latency-ms': latency.toString(),
        'X-Request-Id': headers['X-Request-Id'],
        'X-Org-Id': headers['X-Org-Id']
      }
    });

  } catch (error) {
    console.error('Inventory BFF PUT error:', error);
    return NextResponse.json(;
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;

    // Build the API path
    const apiPath = `/v1/inventory-kardex/${path.join('/')}`;
    const fullUrl = `${API_BASE_URL}${apiPath}`;

    // Add FinOps headers
    const headers: Record<string, string> = {
      'X-Request-Id': crypto.randomUUID(),
      'X-Org-Id': 'demo-org-1',
      'X-User-Id': 'web-user',
      'X-Source': 'web-bff',
      'Content-Type': 'application/json'
    };

    const startTime = Date.now();

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-Latency-ms': latency.toString(),
        'X-Request-Id': headers['X-Request-Id'],
        'X-Org-Id': headers['X-Org-Id']
      }
    });

  } catch (error) {
    console.error('Inventory BFF DELETE error:', error);
    return NextResponse.json(;
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
