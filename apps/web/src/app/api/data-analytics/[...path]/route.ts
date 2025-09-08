import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    const apiUrl = `${API_BASE_URL}/v1/data-analytics-dashboard/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': request.headers.get('x-org-id') || 'demo-org',
        'x-correlation-id': request.headers.get('x-correlation-id') || '',
        'Authorization': request.headers.get('authorization') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Data Analytics BFF Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data analytics information',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    const path = params.path.join('/');
    const body = await request.json();
    
    const apiUrl = `${API_BASE_URL}/v1/data-analytics-dashboard/${path}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': request.headers.get('x-org-id') || 'demo-org',
        'x-correlation-id': request.headers.get('x-correlation-id') || '',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Data Analytics BFF Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create data analytics resource',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    const path = params.path.join('/');
    const body = await request.json();
    
    const apiUrl = `${API_BASE_URL}/v1/data-analytics-dashboard/${path}`;
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': request.headers.get('x-org-id') || 'demo-org',
        'x-correlation-id': request.headers.get('x-correlation-id') || '',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Data Analytics BFF Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update data analytics resource',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    const path = params.path.join('/');
    
    const apiUrl = `${API_BASE_URL}/v1/data-analytics-dashboard/${path}`;
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': request.headers.get('x-org-id') || 'demo-org',
        'x-correlation-id': request.headers.get('x-correlation-id') || '',
        'Authorization': request.headers.get('authorization') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Data Analytics BFF Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete data analytics resource',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
