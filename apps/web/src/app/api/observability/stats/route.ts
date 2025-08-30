export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { observability } from '@/lib/observability';

export async function GET() {
  try {
    const stats = observability.getStats();
    
    return Response.json({
      success: true,
      message: 'Observability stats retrieved successfully',
      data: stats
    });
  } catch (error: any) {
    observability.error('Failed to retrieve observability stats', { error: error.message });
    
    return Response.json({
      success: false,
      message: 'Failed to retrieve observability stats',
      error: error.message
    }, { status: 500 });
  }
}
