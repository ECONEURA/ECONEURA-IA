import { NextRequest, NextResponse } from 'next/server';
import { WebCacheManager } from '@/lib/cache';

// Inicializar cache manager (singleton)
const cacheManager = new WebCacheManager();

export async function POST(request: NextRequest): void {
  try {
    const body = await request.json();
    const { intervalMinutes = 60 } = body;

    cacheManager.startPeriodicWarmup(intervalMinutes);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Periodic cache warmup started',
        intervalMinutes
      }
    });
  } catch (error) {
    console.error('Failed to start periodic cache warmup:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
