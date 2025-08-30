import { NextRequest, NextResponse } from 'next/server';
import { webEventSourcingSystem } from '@/lib/events';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/events/stats - Obtener estadísticas del sistema de eventos
export async function GET(request: NextRequest) {
  try {
    const stats = webEventSourcingSystem.getStatistics();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get event sourcing stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
