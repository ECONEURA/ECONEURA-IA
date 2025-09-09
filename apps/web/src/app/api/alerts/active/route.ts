export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { webAlertSystem } from '@/lib/alerts';
import { observability } from '@/lib/observability';

export async function GET(): void {
  try {
    const activeAlerts = webAlertSystem.getActiveAlerts();
    const stats = webAlertSystem.getAlertStats();

    observability.info('Active alerts retrieved', {
      alertCount: activeAlerts.length
    });

    return Response.json({
      success: true,
      message: 'Active Alerts retrieved successfully',
      data: {
        alerts: activeAlerts,
        stats: stats
      }
    });
  } catch (error: any) {
    observability.error('Failed to retrieve active alerts', { error: error.message });

    return Response.json({
      success: false,
      message: 'Failed to retrieve active alerts',
      error: error.message
    }, { status: 500 });
  }
}

