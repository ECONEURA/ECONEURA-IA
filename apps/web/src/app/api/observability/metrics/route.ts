export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { observability } from '@/lib/observability';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const metrics = observability.getMetrics(name || undefined, limit);
    const summary = observability.getMetricsSummary();
    
    return Response.json({
      success: true,
      message: 'Metrics retrieved successfully',
      data: {
        metrics,
        summary,
        stats: observability.getStats().metrics
      }
    });
  } catch (error: any) {
    observability.error('Failed to retrieve metrics', { error: error.message });
    
    return Response.json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    }, { status: 500 });
  }
}
