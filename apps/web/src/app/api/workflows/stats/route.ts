import { NextRequest, NextResponse } from 'next/server';
import { webWorkflowSystem } from '@/lib/workflows';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/workflows/stats - Obtener estadísticas de workflows
export async function GET(request: NextRequest) {
  try {
    const stats = webWorkflowSystem.getWorkflowStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get workflow stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
