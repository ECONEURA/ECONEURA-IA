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
  const latency = Date.now() - startTime;
  
  response.headers.set('X-Request-Id', generateRequestId());
  response.headers.set('X-Org-Id', 'demo-org');
  response.headers.set('X-Latency-ms', latency.toString());
  response.headers.set('X-AI-Provider', 'none');
  response.headers.set('X-AI-Model', 'none');
  response.headers.set('X-Est-Cost-EUR', '0.00');
  
  return response;
}

// ============================================================================
// RUTAS DE REPORTES
// ============================================================================

// GET /api/inventory/report - Obtener reporte de inventario
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/report`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const report = await response.json();
    
    const nextResponse = NextResponse.json(report);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch inventory report' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
