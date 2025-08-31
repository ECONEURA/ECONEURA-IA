import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.API_BASE_URL}/v1/search/suggestions?query=${encodeURIComponent(query)}`, {
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
        { error: errorData.error || 'Failed to get suggestions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to get search suggestions' },
      { status: 500 }
    );
  }
}
