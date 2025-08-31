import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/notifications/[id]/read - Marcar notificación como leída
// ============================================================================

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/${id}/read`, {
      method: 'POST',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (apiResponse.status === 404) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to mark notification as read' },
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
    response.headers.set('X-AI-Model', 'notification-read');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in mark as read endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

