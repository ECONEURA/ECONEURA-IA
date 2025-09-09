import { NextRequest, NextResponse } from 'next/server';
import { WebCacheManager } from '@/lib/cache';

// Inicializar cache manager (singleton)
const cacheManager = new WebCacheManager();

export async function DELETE(request: NextRequest): void {
  try {
    await cacheManager.getSearchCache().clear();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Search cache cleared successfully'
      }
    });
  } catch (error) {
    console.error('Failed to clear search cache:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
