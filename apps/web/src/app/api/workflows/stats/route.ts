import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addFinOpsHeaders(response: NextResponse, startTime: number): NextResponse {
  const endTime = Date.now();
  const latency = endTime - startTime;

  response.headers.set('X-Request-Id', generateRequestId());
  response.headers.set('X-Latency-ms', latency.toString());
  response.headers.set('X-Workflow-Engine', 'web-bff');

  return response;
}

// ============================================================================
// ENDPOINT DE ESTADÍSTICAS
// ============================================================================

// GET /api/workflows/stats - Obtener estadísticas de workflows
export async function GET(request: NextRequest): void {
  const startTime = Date.now();

  try {
    // Llamar a la API para obtener estadísticas
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/workflows/stats`;

    const response = await fetch(apiUrl, {
      headers: {
        'X-Request-Id': generateRequestId(),
        'X-Org-Id': request.headers.get('X-Org-Id') || 'demo',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const stats = await response.json();

    const nextResponse = NextResponse.json({
      ok: true,
      data: stats,
      message: 'Workflow statistics retrieved successfully',
    });

    return addFinOpsHeaders(nextResponse, startTime);

  } catch (error) {
    console.error('Error fetching workflow stats:', error);

    const errorResponse = NextResponse.json({
      ok: false,
      error: 'Failed to fetch workflow statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });

    return addFinOpsHeaders(errorResponse, startTime);
  }
}
