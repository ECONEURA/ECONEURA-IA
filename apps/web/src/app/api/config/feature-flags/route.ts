import { NextRequest, NextResponse } from 'next/server';
import { webConfigurationSystem } from '@/lib/configuration';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/config/feature-flags - Obtener feature flags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');
    
    let flags = webConfigurationSystem.getAllFeatureFlags();
    if (environment) {
      flags = flags.filter(flag => flag.environment === environment);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        flags,
        count: flags.length
      }
    });
  } catch (error) {
    console.error('Failed to get feature flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/config/feature-flags - Crear feature flag
export async function POST(request: NextRequest) {
  try {
    const flagData = await request.json();
    const flagId = webConfigurationSystem.createFeatureFlag(flagData);
    
    return NextResponse.json({
      success: true,
      data: {
        flagId,
        message: 'Feature flag created successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create feature flag:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
