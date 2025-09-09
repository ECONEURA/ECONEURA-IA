import { NextRequest, NextResponse } from 'next/server';
import { webRlsSystem } from '@/lib/rls';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/rls/rules/[ruleId] - Actualizar regla RLS
export async function PUT(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params;
    const updates = await request.json();

    const updated = webRlsSystem.updateRule(ruleId, updates);

    if (!updated) {
      return NextResponse.json(;
        { error: 'RLS rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule updated successfully'
      }
    });
  } catch (error) {
    console.error('Failed to update RLS rule:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/rls/rules/[ruleId] - Eliminar regla RLS
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params;
    const deleted = webRlsSystem.deleteRule(ruleId);

    if (!deleted) {
      return NextResponse.json(;
        { error: 'RLS rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule deleted successfully'
      }
    });
  } catch (error) {
    console.error('Failed to delete RLS rule:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
