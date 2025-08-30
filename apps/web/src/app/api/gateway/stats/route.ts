import { NextRequest, NextResponse } from 'next/server';
import { webApiGateway } from '@/lib/gateway';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/gateway/stats - Obtener estadísticas del gateway
export async function GET(request: NextRequest) {
  try {
    const stats = webApiGateway.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get gateway stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
