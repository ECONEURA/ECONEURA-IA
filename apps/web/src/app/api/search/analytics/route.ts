import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/v1/search/analytics`, {
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
        { error: errorData.error || 'Failed to get search analytics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to get search analytics' },
      { status: 500 }
    );
  }
}
