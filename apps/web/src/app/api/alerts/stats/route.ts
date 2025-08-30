export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { webAlertSystem } from '@/lib/alerts';
import { observability } from '@/lib/observability';

export async function GET() {
  try {
    const alertStats = webAlertSystem.getAlertStats();
    const notificationStats = webAlertSystem.getNotificationStats();
    
    observability.info('Alert statistics retrieved', {
      totalAlerts: alertStats.total,
      activeAlerts: alertStats.active
    });
    
    return Response.json({
      success: true,
      message: 'Alert Statistics retrieved successfully',
      data: {
        alerts: alertStats,
        notifications: notificationStats
      }
    });
  } catch (error: any) {
    observability.error('Failed to retrieve alert statistics', { error: error.message });
    
    return Response.json({
      success: false,
      message: 'Failed to retrieve alert statistics',
      error: error.message
    }, { status: 500 });
  }
}

