import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);

    const response = await fetch(`${process.env.API_BASE_URL}/v1/security/auth/login`, {
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
        { error: 'Invalid login credentials', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Authentication failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}



