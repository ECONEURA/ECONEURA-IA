import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const UpdateDashboardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  widgets: z.array(z.any()).optional()
});

// ============================================================================
// GET /api/analytics/dashboards/[id] - Obtener dashboard específico
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/analytics/dashboards/${id}`, {
      method: 'GET',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (apiResponse.status === 404) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get dashboard' },
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
    response.headers.set('X-AI-Model', 'dashboard-get');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in dashboard get endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/analytics/dashboards/[id] - Actualizar dashboard
// ============================================================================

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Validar body
    const body = await request.json();
    const validatedUpdates = UpdateDashboardSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/analytics/dashboards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedUpdates),
    });

    if (apiResponse.status === 404) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to update dashboard' },
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
    response.headers.set('X-AI-Model', 'dashboard-update');
    response.headers.set('X-Est-Cost-EUR', '0.0002');

    return response;
  } catch (error) {
    console.error('Error in dashboard update endpoint:', error);
    
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
// DELETE /api/analytics/dashboards/[id] - Eliminar dashboard
// ============================================================================

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/analytics/dashboards/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (apiResponse.status === 404) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to delete dashboard' },
        { status: apiResponse.status }
      );
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Headers FinOps
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Org-Id', orgId);
    response.headers.set('X-Latency-ms', latency.toString());
    response.headers.set('X-AI-Provider', 'analytics');
    response.headers.set('X-AI-Model', 'dashboard-delete');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in dashboard delete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
