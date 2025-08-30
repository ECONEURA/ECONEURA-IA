import { NextRequest, NextResponse } from 'next/server';
import { webFinOpsSystem } from '@/lib/finops';

export async function PUT(
  request: NextRequest,
  { params }: { params: { budgetId: string } }
) {
  try {
    const { budgetId } = params;
    const updates = await request.json();
    
    const updated = webFinOpsSystem.updateBudget(budgetId, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        budgetId,
        message: 'Budget updated successfully'
      }
    });
  } catch (error) {
    console.error('Failed to update budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { budgetId: string } }
) {
  try {
    const { budgetId } = params;
    const deleted = webFinOpsSystem.deleteBudget(budgetId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        budgetId,
        message: 'Budget deleted successfully'
      }
    });
  } catch (error) {
    console.error('Failed to delete budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
