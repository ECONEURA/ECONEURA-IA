import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): void {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/v1/security/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-FinOps-Org': 'default',
        'X-FinOps-Project': 'security',
        'X-FinOps-Environment': process.env.NODE_ENV || 'development',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch security stats:', error);
    return NextResponse.json(;
      { error: 'Failed to fetch security stats' },
      { status: 500 }
    );
  }
}
