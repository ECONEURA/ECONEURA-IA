import { NextRequest, NextResponse } from 'next/server';
import { webFinOpsSystem } from '@/lib/finops';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params;
    const { acknowledgedBy } = await request.json();

    const acknowledged = webFinOpsSystem.acknowledgeAlert(alertId, acknowledgedBy);

    if (!acknowledged) {
      return NextResponse.json(;
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        alertId,
        message: 'Alert acknowledged successfully'
      }
    });
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
