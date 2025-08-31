import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SearchRequestSchema = z.object({
  query: z.string().min(1),
  filters: z.record(z.any()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  searchType: z.enum(["semantic", "keyword", "fuzzy", "federated"]).default("keyword"),
  sources: z.array(z.string()).optional(),
  includeSuggestions: z.boolean().default(true),
  useCache: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SearchRequestSchema.parse(body);

    const response = await fetch(`${process.env.API_BASE_URL}/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': request.headers.get('X-Request-ID') || '',
        'X-User-ID': request.headers.get('X-User-ID') || '',
        'X-Org-ID': request.headers.get('X-Org-ID') || '',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Search request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Add FinOps headers to response
    const responseHeaders = new Headers();
    responseHeaders.set('X-Cost-Tracked', response.headers.get('X-Cost-Tracked') || 'false');
    responseHeaders.set('X-Search-Type', response.headers.get('X-Search-Type') || 'keyword');
    responseHeaders.set('X-Results-Count', response.headers.get('X-Results-Count') || '0');
    responseHeaders.set('X-Response-Time', response.headers.get('X-Response-Time') || '0');

    return NextResponse.json(data, { headers: responseHeaders });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Invalid search request' },
      { status: 400 }
    );
  }
}
