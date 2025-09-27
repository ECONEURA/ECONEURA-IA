export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { observability } from '@/lib/observability';

export async function GET() {
  try {
    const prometheusData = observability.exportPrometheus();
    
    return new Response(prometheusData, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    observability.error('Failed to export Prometheus metrics', { error: error.message });
    
    return new Response(`# Error exporting metrics: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}
