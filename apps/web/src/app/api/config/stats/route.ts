import { NextRequest, NextResponse } from 'next/server';
import { webConfigurationSystem } from '@/lib/configuration';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/config/stats - Obtener estadísticas de configuración
export async function GET(request: NextRequest) {
  try {
    const stats = webConfigurationSystem.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get config stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
