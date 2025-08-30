import { NextRequest, NextResponse } from 'next/server';
import { webRlsSystem } from '@/lib/rls';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/rls/context - Obtener contexto RLS actual
export async function GET(request: NextRequest) {
  try {
    const context = webRlsSystem.getContext();
    
    return NextResponse.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Failed to get RLS context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rls/context - Establecer contexto RLS
export async function POST(request: NextRequest) {
  try {
    const contextData = await request.json();
    webRlsSystem.setContext(contextData);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'RLS context set successfully',
        context: contextData
      }
    });
  } catch (error) {
    console.error('Failed to set RLS context:', error);
    return NextResponse.json(
      { error: 'Failed to set RLS context' },
      { status: 400 }
    );
  }
}
