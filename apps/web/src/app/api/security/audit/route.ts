import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AuditLogsQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 100),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = AuditLogsQuerySchema.parse(Object.fromEntries(searchParams));

    const queryString = new URLSearchParams({
      limit: validatedParams.limit.toString(),
    }).toString();

    const response = await fetch(`${process.env.API_BASE_URL}/v1/security/audit?${queryString}`, {
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
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}



