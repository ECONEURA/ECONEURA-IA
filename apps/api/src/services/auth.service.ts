// import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { ApiError } from '../mw/problemJson.js';

const prisma = new PrismaClient();

interface TokenPayload {
  userId: string;
  orgId: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

interface LoginData {
  email: string;
  password: string;
  organizationSlug?: string;
  deviceId?: string;
  deviceName?: string;
  rememberMe?: boolean;
}

interface RefreshData {
  refreshToken: string;
  deviceId?: string;
}

export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  private readonly accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  private readonly refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  /**
   * Hash a token for storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: Omit<TokenPayload, 'type'>) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.accessSecret,
      { expiresIn: this.accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.refreshSecret,
      { expiresIn: this.refreshExpiresIn }
    );

    const accessDecoded = jwt.decode(accessToken) as any;
    const refreshDecoded = jwt.decode(refreshToken) as any;

    return {
      accessToken,
      refreshToken,
      accessExpiresAt: new Date(accessDecoded.exp * 1000),
      refreshExpiresAt: new Date(refreshDecoded.exp * 1000),
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData, ipAddress: string, userAgent?: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        userOrganizations: {
          where: {
            status: 'ACTIVE',
            organization: {
              status: 'ACTIVE',
            },
          },
          include: {
            organization: true,
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'invalid_credentials', 'Invalid credentials', 'Email or password is incorrect');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          orgId: user.userOrganizations[0]?.organizationId || '',
          userId: user.id,
          userEmail: user.email,
          action: 'user.login.failed',
          resource: 'auth',
          result: 'FAILURE',
          errorMessage: 'Invalid password',
          metadata: {
            ipAddress,
            userAgent,
          },
        },
      }).catch(() => {}); // Don't fail login if audit fails

      throw new ApiError(401, 'invalid_credentials', 'Invalid credentials', 'Email or password is incorrect');
    }

    // Check if user has organizations
    if (!user.userOrganizations.length) {
      throw new ApiError(403, 'no_organization', 'No organization', 'User is not assigned to any organization');
    }

    // Select organization (use provided slug or primary)
    let userOrg = data.organizationSlug
      ? user.userOrganizations.find(uo => uo.organization.slug === data.organizationSlug)
      : user.userOrganizations.find(uo => uo.isPrimary) || user.userOrganizations[0];

    if (!userOrg) {
      throw new ApiError(404, 'organization_not_found', 'Organization not found', 'User is not a member of this organization');
    }

    // Check organization plan expiry
    if (userOrg.organization.planExpiresAt && userOrg.organization.planExpiresAt < new Date()) {
      throw new ApiError(403, 'plan_expired', 'Plan expired', 'Organization plan has expired');
    }

    // Generate device ID if not provided
    const deviceId = data.deviceId || randomBytes(16).toString('hex');

    // Create session
    const tokens = this.generateTokens({
      userId: user.id,
      orgId: userOrg.organizationId,
      sessionId: '', // Will be filled after creating session
    });

    const session = await prisma.deviceSession.create({
      data: {
        userId: user.id,
        organizationId: userOrg.organizationId,
        deviceId,
        deviceName: data.deviceName || 'Web Browser',
        deviceType: 'WEB',
        userAgent: userAgent?.substring(0, 1000),
        ipAddress,
        accessTokenHash: this.hashToken(tokens.accessToken),
        accessTokenExpiresAt: tokens.accessExpiresAt,
        refreshTokenHash: this.hashToken(tokens.refreshToken),
        refreshTokenExpiresAt: data.rememberMe 
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days if remember me
          : tokens.refreshExpiresAt,
      },
    });

    // Update tokens with session ID
    const finalTokens = this.generateTokens({
      userId: user.id,
      orgId: userOrg.organizationId,
      sessionId: session.id,
    });

    // Update session with new token hashes
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: {
        accessTokenHash: this.hashToken(finalTokens.accessToken),
        refreshTokenHash: this.hashToken(finalTokens.refreshToken),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        orgId: userOrg.organizationId,
        userId: user.id,
        userEmail: user.email,
        action: 'user.login.success',
        resource: 'auth',
        resourceId: session.id,
        result: 'SUCCESS',
        metadata: {
          ipAddress,
          userAgent,
          deviceId,
          sessionId: session.id,
        },
      },
    }).catch(() => {}); // Don't fail login if audit fails

    // Get permissions
    const permissions = userOrg.role.rolePermissions.map(rp => rp.permission.slug);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
      organization: {
        id: userOrg.organization.id,
        slug: userOrg.organization.slug,
        name: userOrg.organization.name,
        logoUrl: userOrg.organization.logoUrl,
        plan: userOrg.organization.plan,
        timezone: userOrg.organization.timezone,
        locale: userOrg.organization.locale,
        currency: userOrg.organization.currency,
      },
      role: {
        id: userOrg.role.id,
        name: userOrg.role.name,
        slug: userOrg.role.slug,
      },
      permissions,
      tokens: {
        accessToken: finalTokens.accessToken,
        refreshToken: finalTokens.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
        tokenType: 'Bearer' as const,
      },
      session: {
        id: session.id,
        deviceId: session.deviceId,
        createdAt: session.createdAt.toISOString(),
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(data: RefreshData) {
    // Verify refresh token
    let payload: TokenPayload;
    try {
      payload = jwt.verify(data.refreshToken, this.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new ApiError(401, 'invalid_refresh_token', 'Invalid refresh token', 'Refresh token is invalid or expired');
    }

    if (payload.type !== 'refresh') {
      throw new ApiError(401, 'invalid_token_type', 'Invalid token type', 'Token is not a refresh token');
    }

    // Find session
    const refreshTokenHash = this.hashToken(data.refreshToken);
    const session = await prisma.deviceSession.findFirst({
      where: {
        id: payload.sessionId,
        refreshTokenHash,
        refreshTokenExpiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });

    if (!session) {
      // Possible token reuse attack - revoke all sessions for this user
      if (payload.userId) {
        await prisma.deviceSession.updateMany({
          where: {
            userId: payload.userId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: 'Possible token reuse detected',
          },
        });
      }
      throw new ApiError(401, 'session_not_found', 'Session not found', 'Session has been revoked or expired');
    }

    // Check if device ID matches (if provided)
    if (data.deviceId && session.deviceId !== data.deviceId) {
      throw new ApiError(401, 'device_mismatch', 'Device mismatch', 'Token was issued for a different device');
    }

    // Generate new tokens
    const tokens = this.generateTokens({
      userId: session.userId,
      orgId: session.organizationId,
      sessionId: session.id,
    });

    // Update session with new tokens and increment version
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: {
        accessTokenHash: this.hashToken(tokens.accessToken),
        accessTokenExpiresAt: tokens.accessExpiresAt,
        refreshTokenHash: this.hashToken(tokens.refreshToken),
        refreshTokenExpiresAt: tokens.refreshExpiresAt,
        refreshTokenVersion: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    return {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
        tokenType: 'Bearer' as const,
      },
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId?: string, refreshToken?: string, allDevices = false) {
    if (allDevices) {
      // Revoke all sessions
      await prisma.deviceSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'User logged out from all devices',
        },
      });
    } else if (sessionId) {
      // Revoke specific session
      await prisma.deviceSession.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: 'User logged out',
        },
      });
    } else if (refreshToken) {
      // Revoke session by refresh token
      const refreshTokenHash = this.hashToken(refreshToken);
      await prisma.deviceSession.updateMany({
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'User logged out',
        },
      });
    }

    // Log logout
    await prisma.auditLog.create({
      data: {
        orgId: '', // Will be filled from session
        userId,
        userEmail: '', // Will be filled from user
        action: allDevices ? 'user.logout.all' : 'user.logout',
        resource: 'auth',
        resourceId: sessionId,
        result: 'SUCCESS',
      },
    }).catch(() => {}); // Don't fail logout if audit fails
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string, orgId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userOrganizations: {
          where: {
            organizationId: orgId,
            status: 'ACTIVE',
          },
          include: {
            organization: true,
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found', 'User does not exist');
    }

    const userOrg = user.userOrganizations[0];
    if (!userOrg) {
      throw new ApiError(403, 'no_organization_access', 'No organization access', 'User does not have access to this organization');
    }

    // Get user's sessions
    const sessions = await prisma.deviceSession.findMany({
      where: {
        userId,
        organizationId: orgId,
        revokedAt: null,
        refreshTokenExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        lastActivityAt: true,
        createdAt: true,
        ipAddress: true,
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    const permissions = userOrg.role.rolePermissions.map(rp => rp.permission.slug);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
      organization: {
        id: userOrg.organization.id,
        slug: userOrg.organization.slug,
        name: userOrg.organization.name,
        logoUrl: userOrg.organization.logoUrl,
        plan: userOrg.organization.plan,
        timezone: userOrg.organization.timezone,
        locale: userOrg.organization.locale,
        currency: userOrg.organization.currency,
      },
      role: {
        id: userOrg.role.id,
        name: userOrg.role.name,
        slug: userOrg.role.slug,
        description: userOrg.role.description,
      },
      permissions,
      sessions: sessions.map(s => ({
        id: s.id,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        lastActivityAt: s.lastActivityAt.toISOString(),
        isCurrent: false, // Will be set by the endpoint
      })),
    };
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string, orgId: string, currentSessionId?: string) {
    const sessions = await prisma.deviceSession.findMany({
      where: {
        userId,
        organizationId: orgId,
        revokedAt: null,
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        deviceId: s.deviceId,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        location: s.location as any,
        lastActivityAt: s.lastActivityAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        isCurrent: s.id === currentSessionId,
        isExpired: s.refreshTokenExpiresAt < new Date(),
      })),
      total: sessions.length,
    };
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string, revokedBy: string) {
    const session = await prisma.deviceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ApiError(404, 'session_not_found', 'Session not found', 'Session does not exist');
    }

    if (session.revokedAt) {
      throw new ApiError(400, 'session_already_revoked', 'Session already revoked', 'Session has already been revoked');
    }

    await prisma.deviceSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedReason: `Revoked by user ${revokedBy}`,
      },
    });

    // Log session revocation
    await prisma.auditLog.create({
      data: {
        orgId: session.organizationId,
        userId: revokedBy,
        userEmail: '', // Will be filled from context
        action: 'session.revoke',
        resource: 'auth',
        resourceId: sessionId,
        result: 'SUCCESS',
        metadata: {
          targetUserId: session.userId,
          deviceId: session.deviceId,
        },
      },
    }).catch(() => {});
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string) {
    try {
      const payload = jwt.verify(token, this.accessSecret) as TokenPayload;
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if session is still valid
      const session = await prisma.deviceSession.findFirst({
        where: {
          id: payload.sessionId,
          accessTokenHash: this.hashToken(token),
          revokedAt: null,
          accessTokenExpiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Update last activity
      await prisma.deviceSession.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() },
      }).catch(() => {}); // Don't fail request if update fails

      return {
        userId: payload.userId,
        orgId: payload.orgId,
        sessionId: payload.sessionId,
      };
    } catch (error) {
      throw new ApiError(401, 'invalid_access_token', 'Invalid access token', 'Access token is invalid or expired');
    }
  }

  /**
   * Check user permission
   */
  async checkPermission(userId: string, orgId: string, permission: string, scope: 'organization' | 'own' = 'organization') {
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: orgId,
        status: 'ACTIVE',
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!userOrg) {
      return false;
    }

    // Check for wildcard permission (admin)
    const hasWildcard = userOrg.role.rolePermissions.some(rp => 
      rp.permission.slug === '*' || 
      rp.permission.slug === '*:*' || 
      rp.permission.slug === '*:*:*'
    );

    if (hasWildcard) {
      return true;
    }

    // Check exact permission
    const hasPermission = userOrg.role.rolePermissions.some(rp => {
      const perm = rp.permission.slug;
      
      // Exact match
      if (perm === permission) {
        return rp.scope === 'ORGANIZATION' || scope === 'own';
      }
      
      // Wildcard match (e.g., crm:contacts:* matches crm:contacts:view)
      if (perm.endsWith(':*')) {
        const permBase = perm.slice(0, -2);
        return permission.startsWith(permBase + ':') && 
               (rp.scope === 'ORGANIZATION' || scope === 'own');
      }
      
      return false;
    });

    return hasPermission;
  }
}

export const authService = new AuthService();