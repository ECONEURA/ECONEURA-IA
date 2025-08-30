import { NextRequest, NextResponse } from 'next/server';
import { webMicroservicesSystem } from '@/lib/microservices';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/microservices/register - Registrar servicio
export async function POST(request: NextRequest) {
  try {
    const serviceData = await request.json();
    const serviceId = webMicroservicesSystem.register(serviceData);
    
    return NextResponse.json({
      success: true,
      data: {
        serviceId,
        message: 'Service registered successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to register service:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
