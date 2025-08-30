import { NextRequest, NextResponse } from 'next/server';
import { webRlsSystem } from '@/lib/rls';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/rls/rules - Obtener reglas RLS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    const rules = organizationId 
      ? webRlsSystem.getRulesByOrganization(organizationId)
      : Array.from(webRlsSystem['rules'].values());
    
    return NextResponse.json({
      success: true,
      data: {
        rules,
        count: rules.length
      }
    });
  } catch (error) {
    console.error('Failed to get RLS rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rls/rules - Crear nueva regla RLS
export async function POST(request: NextRequest) {
  try {
    const ruleData = await request.json();
    const ruleId = webRlsSystem.createRule(ruleData);
    
    return NextResponse.json({
      success: true,
      data: {
        ruleId,
        message: 'RLS rule created successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create RLS rule:', error);
    return NextResponse.json(
      { error: 'Failed to create RLS rule' },
      { status: 400 }
    );
  }
}

