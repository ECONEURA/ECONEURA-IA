import { NextRequest, NextResponse } from 'next/server';

import { webRateLimiter } from '@/lib/rate-limiting';

export async function GET(request: NextRequest) {
  try {
    const stats = webRateLimiter.getGlobalStats();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
