import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MFAVerifySchema = z.object({
  userId: z.string(),
  code: z.string().min(1),
  methodType: z.enum(['totp', 'sms', 'email']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = MFAVerifySchema.parse(body);

    const response = await fetch(`${process.env.API_BASE_URL}/v1/security/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-FinOps-Org': 'default',
        'X-FinOps-Project': 'security',
        'X-FinOps-Environment': process.env.NODE_ENV || 'development',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid MFA verification data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('MFA verification failed:', error);
    return NextResponse.json(
      { error: 'MFA verification failed' },
      { status: 500 }
    );
  }
}



