import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const NotificationSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app', 'webhook'])),
  templateId: z.string().optional()
});

const SendNotificationSchema = NotificationSchema;

const BulkNotificationsSchema = z.object({
  notifications: z.array(NotificationSchema)
});

const ScheduleNotificationSchema = z.object({
  notification: NotificationSchema,
  scheduledAt: z.string().datetime()
});

const MarkAllAsReadSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1)
});

// ============================================================================
// GET /api/notifications - Listar notificaciones
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Construir parámetros de filtro
    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    // Llamar al API
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications?userId=${userId}&orgId=${orgIdParam}`, {
      method: 'GET',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get notifications' },
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
    response.headers.set('X-AI-Model', 'notification-list');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in notifications list endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/notifications - Crear notificación
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Validar body
    const body = await request.json();
    const validatedNotification = NotificationSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch('http://localhost:4000/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedNotification),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to create notification' },
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
    response.headers.set('X-AI-Provider', 'notifications');
    response.headers.set('X-AI-Model', 'notification-create');
    response.headers.set('X-Est-Cost-EUR', '0.0002');

    return response;
  } catch (error) {
    console.error('Error in notification create endpoint:', error);
    
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

