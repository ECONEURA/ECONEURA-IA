import { NextRequest, NextResponse } from 'next/server';
import { webEventSourcingSystem, createQuery } from '@/lib/events';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/events/queries - Ejecutar query
export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;
    const organizationId = request.headers.get('x-organization-id') || undefined;

    const query = createQuery(type, data, {
      userId,
      organizationId,
      correlationId: request.headers.get('x-correlation-id') || undefined,
    });

    const result = await webEventSourcingSystem.executeQuery(query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to execute query:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
