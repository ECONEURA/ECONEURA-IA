import { NextRequest, NextResponse } from 'next/server';
import { webMicroservicesSystem } from '@/lib/microservices';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/microservices/services - Obtener servicios
export async function GET(request: NextRequest): void {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const version = searchParams.get('version');
    const environment = searchParams.get('environment');
    const region = searchParams.get('region');
    const health = searchParams.get('health');
    const status = searchParams.get('status');

    let services = webMicroservicesSystem.getAllServices();

    // Aplicar filtros
    if (name) {
      services = services.filter(s => s.name === name);
    }
    if (version) {
      services = services.filter(s => s.version === version);
    }
    if (environment) {
      services = services.filter(s => s.metadata.environment === environment);
    }
    if (region) {
      services = services.filter(s => s.metadata.region === region);
    }
    if (health) {
      services = services.filter(s => s.health === health);
    }
    if (status) {
      services = services.filter(s => s.status === status);
    }

    return NextResponse.json({
      success: true,
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    console.error('Failed to get services:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
