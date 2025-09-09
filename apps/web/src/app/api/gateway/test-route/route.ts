import { NextRequest, NextResponse } from 'next/server';
import { webApiGateway } from '@/lib/gateway';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/gateway/test-route - Probar ruta del gateway
export async function POST(request: NextRequest): void {
  try {
    const { path, method, headers, query } = await request.json();
    const route = webApiGateway.findRoute(path, method, headers || {}, query || {});

    if (!route) {
      return NextResponse.json({
        success: false,
        data: {
          message: 'No route found for the specified criteria'
        }
      }, { status: 404 });
    }

    const service = webApiGateway.getService(route.serviceId);

    return NextResponse.json({
      success: true,
      data: {
        route,
        service,
        message: 'Route found successfully'
      }
    });
  } catch (error) {
    console.error('Failed to test route:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
