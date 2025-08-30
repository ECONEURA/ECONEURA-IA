import { NextRequest, NextResponse } from 'next/server';
import { webFinOpsSystem } from '@/lib/finops';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || undefined;
    
    const budgets = organizationId 
      ? webFinOpsSystem.getBudgetsByOrganization(organizationId)
      : Array.from(webFinOpsSystem['budgets'].values());
    
    return NextResponse.json({
      success: true,
      data: {
        budgets,
        count: budgets.length
      }
    });
  } catch (error) {
    console.error('Failed to get budgets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const budgetData = await request.json();
    const budgetId = webFinOpsSystem.createBudget(budgetData);
    
    return NextResponse.json({
      success: true,
      data: {
        budgetId,
        message: 'Budget created successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create budget:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
