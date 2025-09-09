import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ThreatsQuerySchema = z.object({
  ip: z.string().optional(),
});

export async function GET(request: NextRequest): void {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = ThreatsQuerySchema.parse(Object.fromEntries(searchParams));

    const queryString = validatedParams.ip
      ? new URLSearchParams({ ip: validatedParams.ip }).toString()
      : '';

    const response = await fetch(`${process.env.API_BASE_URL}/v1/security/threats${queryString ? `?${queryString}` : ''}`, {
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(;
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to fetch threat intelligence:', error);
    return NextResponse.json(;
      { error: 'Failed to fetch threat intelligence' },
      { status: 500 }
    );
  }
}



