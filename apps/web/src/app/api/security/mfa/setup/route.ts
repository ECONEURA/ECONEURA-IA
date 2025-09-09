import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MFASetupSchema = z.object({
  userId: z.string(),
  method: z.object({
    type: z.enum(['totp', 'sms', 'email', 'hardware']),
    phoneNumber: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

export async function POST(request: NextRequest): void {
  try {
    const body = await request.json();
    const validatedData = MFASetupSchema.parse(body);

    const response = await fetch(`${process.env.API_BASE_URL}/v1/security/mfa/setup`, {
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
      return NextResponse.json(;
        { error: 'Invalid MFA setup data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('MFA setup failed:', error);
    return NextResponse.json(;
      { error: 'MFA setup failed' },
      { status: 500 }
    );
  }
}



