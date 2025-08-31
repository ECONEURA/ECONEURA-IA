import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// SCHEMAS
// ============================================================================

const TemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'announcement']),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app', 'webhook'])),
  isActive: z.boolean().default(true)
});

const UpdateTemplateSchema = TemplateSchema.partial();

// ============================================================================
// GET /api/notifications/templates - Listar templates
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
    const apiResponse = await fetch(`http://localhost:4000/v1/notifications/templates?orgId=${orgIdParam}`, {
      method: 'GET',
      headers: {
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get templates' },
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
    response.headers.set('X-AI-Model', 'template-list');
    response.headers.set('X-Est-Cost-EUR', '0.0001');

    return response;
  } catch (error) {
    console.error('Error in templates list endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/notifications/templates - Crear template
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const orgId = request.headers.get('X-Org-Id') || 'demo-org';

    // Validar body
    const body = await request.json();
    const validatedTemplate = TemplateSchema.parse(body);

    // Llamar al API
    const apiResponse = await fetch('http://localhost:4000/v1/notifications/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': orgId,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(validatedTemplate),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to create template' },
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
    response.headers.set('X-AI-Model', 'template-create');
    response.headers.set('X-Est-Cost-EUR', '0.0002');

    return response;
  } catch (error) {
    console.error('Error in template create endpoint:', error);
    
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

