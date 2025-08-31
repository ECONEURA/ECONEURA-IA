import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const UpdateNotificationSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app', 'webhook'])).optional(),
  data: z.record(z.any()).optional()
});

// ============================================================================
// GET /api/notifications/[id] - Obtener notificación específica
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/${id}`, {
      method: 'GET',
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
        { error: errorData.error || 'Failed to get notification' },
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
    response.headers.set('X-AI-Model', 'notification-get');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in notification get endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/notifications/[id] - Actualizar notificación
// ============================================================================

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Validar body
    const body = await request.json();
    const validatedUpdates = UpdateNotificationSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/${id}`, {
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
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to update notification' },
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
    response.headers.set('X-AI-Model', 'notification-update');
    response.headers.set('X-Est-Cost-EUR', '0.0002');

    return response;
  } catch (error) {
    console.error('Error in notification update endpoint:', error);
    
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
// DELETE /api/notifications/[id] - Eliminar notificación
// ============================================================================

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';
    const { id } = params;

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/${id}`, {
      method: 'DELETE',
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
        { error: errorData.error || 'Failed to delete notification' },
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
    response.headers.set('X-AI-Provider', 'notifications');
    response.headers.set('X-AI-Model', 'notification-delete');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in notification delete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

