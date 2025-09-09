import { NextRequest, NextResponse } from 'next/server';
import { webEventSourcingSystem, createCommand } from '@/lib/events';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/events/commands - Ejecutar comando
export async function POST(request: NextRequest): void {
  try {
    const { type, aggregateId, data } = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;
    const organizationId = request.headers.get('x-organization-id') || undefined;

    const command = createCommand(type, aggregateId, data, {
      userId,
      organizationId,
      correlationId: request.headers.get('x-correlation-id') || undefined,
      causationId: request.headers.get('x-causation-id') || undefined,
    });

    await webEventSourcingSystem.executeCommand(command);

    return NextResponse.json({
      success: true,
      data: {
        commandId: command.id,
        message: 'Command executed successfully'
      }
    });
  } catch (error) {
    console.error('Failed to execute command:', error);
    return NextResponse.json(;
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
