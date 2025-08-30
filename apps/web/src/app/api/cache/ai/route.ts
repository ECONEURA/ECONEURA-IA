import { NextRequest, NextResponse } from 'next/server';
import { WebCacheManager } from '@/lib/cache';

// Inicializar cache manager (singleton)
const cacheManager = new WebCacheManager();

export async function DELETE(request: NextRequest) {
  try {
    await cacheManager.getAICache().clear();
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'AI cache cleared successfully'
      }
    });
  } catch (error) {
    console.error('Failed to clear AI cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
