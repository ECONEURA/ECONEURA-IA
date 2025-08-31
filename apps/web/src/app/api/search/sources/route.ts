import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/v1/search/sources`, {
      method: 'GET',
      headers: {
        'X-Request-ID': request.headers.get('X-Request-ID') || '',
        'X-User-ID': request.headers.get('X-User-ID') || '',
        'X-Org-ID': request.headers.get('X-Org-ID') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get federated sources' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search sources API error:', error);
    return NextResponse.json(
      { error: 'Failed to get federated sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${process.env.API_BASE_URL}/v1/search/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': request.headers.get('X-Request-ID') || '',
        'X-User-ID': request.headers.get('X-User-ID') || '',
        'X-Org-ID': request.headers.get('X-Org-ID') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to add federated source' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Search sources API error:', error);
    return NextResponse.json(
      { error: 'Failed to add federated source' },
      { status: 500 }
    );
  }
}
