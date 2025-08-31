import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const WidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['chart', 'metric', 'table', 'heatmap', 'funnel']),
  title: z.string(),
  query: z.object({
    metrics: z.array(z.string()),
    dimensions: z.array(z.string()).optional(),
    filters: z.array(z.any()).optional(),
    timeRange: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    groupBy: z.array(z.string()).optional(),
    orderBy: z.array(z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc'])
    })).optional(),
    limit: z.number().optional()
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  config: z.record(z.any()).optional()
});

const CreateDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().min(1),
  orgId: z.string().min(1),
  widgets: z.array(WidgetSchema)
});

const UpdateDashboardSchema = CreateDashboardSchema.partial();

// ============================================================================
// GET /api/analytics/dashboards - Listar dashboards
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orgIdParam = searchParams.get('orgId') || orgId;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/analytics/dashboards?userId=${userId}&orgId=${orgIdParam}`, {
      method: 'GET',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get dashboards' },
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
    response.headers.set('X-AI-Model', 'dashboard-list');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in dashboards list endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/analytics/dashboards - Crear dashboard
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Validar body
    const body = await request.json();
    const validatedDashboard = CreateDashboardSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch('http://localhost:4000/v1/analytics/dashboards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedDashboard),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to create dashboard' },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Headers FinOps
    const response = NextResponse.json(data, { status: 201 });
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Org-Id', orgId);
    response.headers.set('X-Latency-ms', latency.toString());
    response.headers.set('X-AI-Provider', 'analytics');
    response.headers.set('X-AI-Model', 'dashboard-create');
    response.headers.set('X-Est-Cost-EUR', '0.0002');

    return response;
  } catch (error) {
    console.error('Error in dashboard create endpoint:', error);
    
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
