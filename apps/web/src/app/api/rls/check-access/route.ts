import { NextRequest, NextResponse } from 'next/server';
import { webRlsSystem } from '@/lib/rls';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/rls/check-access - Verificar permisos de acceso
export async function POST(request: NextRequest): void {
  try {
    const { resource, action } = await request.json();
    const hasAccess = webRlsSystem.checkAccess(resource, action);

    return NextResponse.json({
      success: true,
      data: {
        resource,
        action,
        hasAccess,
        context: webRlsSystem.getContext()
      }
    });
  } catch (error) {
    console.error('Failed to check access:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
