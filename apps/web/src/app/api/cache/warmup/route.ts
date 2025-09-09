import { NextRequest, NextResponse } from 'next/server';
import { WebCacheManager } from '@/lib/cache';

// Inicializar cache manager (singleton)
const cacheManager = new WebCacheManager();

export async function POST(request: NextRequest): void {
  try {
    await cacheManager.warmupAll();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cache warmup initiated successfully'
      }
    });
  } catch (error) {
    console.error('Failed to initiate cache warmup:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
