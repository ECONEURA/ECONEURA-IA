import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// GET /api/notifications/stats - Obtener estadísticas
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId') || orgId;

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/stats?orgId=${orgIdParam}`, {
      method: 'GET',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get statistics' },
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
    response.headers.set('X-AI-Provider', 'notifications');
    response.headers.set('X-AI-Model', 'notification-stats');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in notification stats endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

