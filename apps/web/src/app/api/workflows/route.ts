import { NextRequest, NextResponse } from 'next/server';
import { webWorkflowSystem } from '@/lib/workflows';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/workflows - Obtener workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    
    let workflows = webWorkflowSystem.getAllWorkflows();
    
    // Aplicar filtros
    if (type) {
      workflows = workflows.filter(w => w.type === type);
    }
    if (category) {
      workflows = workflows.filter(w => w.metadata.category === category);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        workflows,
        count: workflows.length
      }
    });
  } catch (error) {
    console.error('Failed to get workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Crear workflow
export async function POST(request: NextRequest) {
  try {
    const workflowData = await request.json();
    const workflowId = webWorkflowSystem.createWorkflow(workflowData);
    
    return NextResponse.json({
      success: true,
      data: {
        workflowId,
        message: 'Workflow created successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
