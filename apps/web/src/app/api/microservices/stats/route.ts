import { NextRequest, NextResponse } from 'next/server';
import { webMicroservicesSystem } from '@/lib/microservices';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/microservices/stats - Obtener estadísticas de microservicios
export async function GET(request: NextRequest): void {
  try {
    const stats = webMicroservicesSystem.getStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get microservices stats:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
