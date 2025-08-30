import { NextRequest, NextResponse } from 'next/server';
import { webApiGateway } from '@/lib/gateway';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/gateway/services - Obtener servicios del gateway
export async function GET(request: NextRequest) {
  try {
    const services = webApiGateway.getAllServices();
    
    return NextResponse.json({
      success: true,
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    console.error('Failed to get gateway services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gateway/services - Agregar servicio al gateway
export async function POST(request: NextRequest) {
  try {
    const serviceData = await request.json();
    const serviceId = webApiGateway.addService(serviceData);
    
    return NextResponse.json({
      success: true,
      data: {
        serviceId,
        message: 'Service added to gateway successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to add service to gateway:', error);
    return NextResponse.json(
      { error: 'Failed to add service to gateway' },
      { status: 400 }
    );
  }
}
