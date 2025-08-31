import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const PreferencesSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  in_app: z.boolean().optional(),
  webhook: z.boolean().optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    timezone: z.string()
  }).optional(),
  preferences: z.record(z.boolean()).optional()
});

// ============================================================================
// GET /api/notifications/preferences - Obtener preferencias
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
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/preferences?userId=${userId}&orgId=${orgIdParam}`, {
      method: 'GET',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get preferences' },
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
    response.headers.set('X-AI-Model', 'preferences-get');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in preferences get endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/notifications/preferences - Actualizar preferencias
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Validar body
    const body = await request.json();
    const validatedPreferences = PreferencesSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch('http://localhost:4000/v1/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedPreferences),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to update preferences' },
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
    response.headers.set('X-AI-Model', 'preferences-update');
    response.headers.set('X-Est-Cost-EUR', '0.0002');

    return response;
  } catch (error) {
    console.error('Error in preferences update endpoint:', error);
    
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

