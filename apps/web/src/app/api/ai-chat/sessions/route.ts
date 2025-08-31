import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const CreateSessionSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  title: z.string().min(1),
  model: z.string().optional(),
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addFinOpsHeaders(response: NextResponse, startTime: number): NextResponse {
  const latency = Date.now() - startTime;
  
  response.headers.set('X-Request-Id', generateRequestId());
  response.headers.set('X-Org-Id', 'demo-org');
  response.headers.set('X-Latency-ms', latency.toString());
  response.headers.set('X-AI-Provider', 'openai');
  response.headers.set('X-AI-Model', 'gpt-4');
  response.headers.set('X-Est-Cost-EUR', '0.00');
  
  return response;
}

// ============================================================================
// RUTAS DE SESIONES
// ============================================================================

// GET /api/ai-chat/sessions - Listar sesiones
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');

    if (!userId || !orgId) {
      const errorResponse = NextResponse.json(
        { error: 'userId and orgId are required' },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }

    // Llamar al backend
    const apiUrl = new URL('/v1/ai-chat/sessions', process.env.API_BASE_URL || 'http://localhost:4000');
    apiUrl.searchParams.append('userId', userId);
    apiUrl.searchParams.append('orgId', orgId);

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const sessions = await response.json();
    
    const nextResponse = NextResponse.json(sessions);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// POST /api/ai-chat/sessions - Crear sesión
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = CreateSessionSchema.parse(body);

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/ai-chat/sessions`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.statusText}`);
    }

    const session = await response.json();
    
    const nextResponse = NextResponse.json(session, { status: 201 });
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error creating session:', error);
    
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
