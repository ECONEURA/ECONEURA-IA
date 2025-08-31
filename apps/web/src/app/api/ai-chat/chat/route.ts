import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const ChatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  functions: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  userId: z.string().min(1),
  orgId: z.string().min(1),
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
// RUTAS DE CHAT
// ============================================================================

// POST /api/ai-chat/chat - Enviar mensaje
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = ChatRequestSchema.parse(body);

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/ai-chat/chat`;
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

    const chatResponse = await response.json();
    
    const nextResponse = NextResponse.json(chatResponse);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error processing chat message:', error);
    
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
