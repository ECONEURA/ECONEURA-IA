import { NextRequest, NextResponse } from 'next/server';
import { webFinOpsSystem } from '@/lib/finops';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || undefined;
    const period = searchParams.get('period') || undefined;
    
    const metrics = webFinOpsSystem.getCostMetrics(organizationId || undefined, period || undefined);
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Failed to get cost metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
