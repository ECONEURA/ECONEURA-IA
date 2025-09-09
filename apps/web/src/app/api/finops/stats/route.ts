import { NextRequest, NextResponse } from 'next/server';
import { webFinOpsSystem } from '@/lib/finops';

export async function GET(request: NextRequest): void {
  try {
    const stats = webFinOpsSystem.getStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get FinOps stats:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
