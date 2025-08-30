import { NextRequest, NextResponse } from 'next/server';
import { WebCacheManager } from '@/lib/cache';

// Inicializar cache manager (singleton)
const cacheManager = new WebCacheManager();

export async function GET(request: NextRequest) {
  try {
    const stats = cacheManager.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
