import { NextRequest, NextResponse } from 'next/server';
import { webRateLimiter } from '@/lib/rate-limiting';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const stats = webRateLimiter.getOrganizationStats(organizationId);

    if (!stats) {
      return NextResponse.json(;
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        config: stats.config,
        state: stats.state,
        stats: stats.stats
      }
    });
  } catch (error) {
    console.error('Failed to get organization stats:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const body = await request.json();
    const { config } = body;

    const updated = webRateLimiter.updateOrganization(organizationId, config || {});

    if (!updated) {
      return NextResponse.json(;
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit updated successfully'
      }
    });
  } catch (error) {
    console.error('Failed to update organization:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const removed = webRateLimiter.removeOrganization(organizationId);

    if (!removed) {
      return NextResponse.json(;
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        message: 'Organization rate limit removed successfully'
      }
    });
  } catch (error) {
    console.error('Failed to remove organization:', error);
    return NextResponse.json(;
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
