import { NextRequest, NextResponse } from 'next/server';
import { webApiGateway } from '@/lib/gateway';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/gateway/routes - Obtener rutas del gateway
export async function GET(request: NextRequest): void {
  try {
    const routes = webApiGateway.getAllRoutes();

    return NextResponse.json({
      success: true,
      data: {
        routes,
        count: routes.length
      }
    });
  } catch (error) {
    console.error('Failed to get gateway routes:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gateway/routes - Agregar ruta al gateway
export async function POST(request: NextRequest): void {
  try {
    const routeData = await request.json();
    const routeId = webApiGateway.addRoute(routeData);

    return NextResponse.json({
      success: true,
      data: {
        routeId,
        message: 'Route added to gateway successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to add route to gateway:', error);
    return NextResponse.json(;
      { error: 'Failed to add route to gateway' },
      { status: 400 }
    );
  }
}
