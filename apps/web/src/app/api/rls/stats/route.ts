import { NextRequest, NextResponse } from 'next/server';

import { webRlsSystem } from '@/lib/rls';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/rls/stats - Obtener estadísticas del sistema RLS
export async function GET(request: NextRequest) {
  try {
    const stats = webRlsSystem.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get RLS stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
