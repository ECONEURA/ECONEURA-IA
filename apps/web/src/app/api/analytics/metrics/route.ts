import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between']),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
});

const AnalyticsQuerySchema = z.object({
  metrics: z.array(z.string()),
  dimensions: z.array(z.string()).optional(),
  filters: z.array(FilterSchema).optional(),
  timeRange: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.array(z.string()).optional(),
  orderBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc'])
  })).optional(),
  limit: z.number().optional()
});

const RealTimeMetricsSchema = z.object({
  metrics: z.array(z.string())
});

// ============================================================================
// POST /api/analytics/metrics - Obtener métricas
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Validar body
    const body = await request.json();
    const validatedQuery = AnalyticsQuerySchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch('http://localhost:4000/v1/analytics/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedQuery),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get metrics' },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Headers FinOps
    const response = NextResponse.json(data);
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Org-Id', orgId);
    response.headers.set('X-Latency-ms', latency.toString());
    response.headers.set('X-AI-Provider', 'analytics');
    response.headers.set('X-AI-Model', 'data-analytics');
    response.headers.set('X-Est-Cost-EUR', '0.001');

    return response;
  } catch (error) {
    console.error('Error in analytics metrics endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/analytics/metrics/realtime - Obtener métricas en tiempo real
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Validar body
    const body = await request.json();
    const validatedRequest = RealTimeMetricsSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch('http://localhost:4000/v1/analytics/metrics/realtime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedRequest),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get real-time metrics' },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Headers FinOps
    const response = NextResponse.json(data);
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Org-Id', orgId);
    response.headers.set('X-Latency-ms', latency.toString());
    response.headers.set('X-AI-Provider', 'analytics');
    response.headers.set('X-AI-Model', 'realtime-analytics');
    response.headers.set('X-Est-Cost-EUR', '0.0005');

    return response;
  } catch (error) {
    console.error('Error in real-time metrics endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
