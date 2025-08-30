import { NextRequest, NextResponse } from 'next/server';
import { webRateLimiter } from '@/lib/rate-limiting';

export async function GET(request: NextRequest) {
  try {
    const organizations = webRateLimiter.getAllOrganizations();
    
    return NextResponse.json({
      success: true,
      data: {
        organizations: organizations.map(org => ({
          organizationId: org.organizationId,
          config: org.config,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Failed to get organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, config } = body;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    webRateLimiter.addOrganization(organizationId, config || {});
    
    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit added successfully'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to add organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
