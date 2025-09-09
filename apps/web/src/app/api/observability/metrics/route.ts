export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { observability } from '@/lib/observability';
import { webAlertSystem } from '@/lib/alerts';

export async function GET(request: Request): void {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const metrics = observability.getMetrics(name || undefined, limit);
    const summary = observability.getMetricsSummary();

    // Evaluar alertas basadas en las métricas
    const newAlerts = webAlertSystem.evaluateMetricsRealtime(summary);

    if (newAlerts.length > 0) {
      observability.info('New alerts generated from metrics', {
        alertCount: newAlerts.length,
        alerts: newAlerts.map(a => ({ id: a.id, name: a.name, severity: a.severity }))
      });
    }

    return Response.json({
      success: true,
      message: 'Metrics retrieved successfully',
      data: {
        metrics,
        summary,
        stats: observability.getStats().metrics,
        newAlerts: newAlerts.length
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
