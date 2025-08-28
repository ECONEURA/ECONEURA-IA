import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth.utils';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Auth schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  organizationName: z.string().min(1).max(200).optional(),
  organizationSlug: z.string().min(1).max(50).optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

/**
 * Register new user and organization
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, organizationName, organizationSlug } = RegisterSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ApiError('User already exists', 409, 'USER_EXISTS');
  }

  // Generate organization slug if not provided
  const orgSlug = organizationSlug || `org-${Date.now()}`;

  // Check if organization slug is taken
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: orgSlug }
  });

  if (existingOrg) {
    throw new ApiError('Organization slug already taken', 409, 'ORG_SLUG_EXISTS');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create organization and user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: organizationName || `${firstName}'s Organization`,
        slug: orgSlug,
      }
    });

    // Create user as admin
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        isActive: true,
        organizationId: organization.id
      }
    });

    return { user, organization };
  });

  // Generate tokens
  const tokenPayload = {
    userId: result.user.id,
    email: result.user.email,
    organizationId: result.organization.id,
    role: result.user.role
  };

  const accessToken = generateToken(tokenPayload, '15m');
  const refreshToken = generateRefreshToken({ userId: result.user.id });

  res.status(201).json({
    message: 'User registered successfully',
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m'
      }
    }
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = LoginSchema.parse(req.body);

  // Find user with organization
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!user || !user.isActive) {
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role
  };

  const accessToken = generateToken(tokenPayload, '15m');
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  res.json({
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      },
      organization: user.organization,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m'
      }
    }
  });
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = RefreshTokenSchema.parse(req.body);

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new ApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role
    };

    const newAccessToken = generateToken(tokenPayload, '15m');
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    res.json({
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: '15m'
        }
      }
    });

  } catch (error) {
    throw new ApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('User not authenticated', 401, 'NOT_AUTHENTICATED');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      organization: user.organization
    }
  });
});

/**
 * Logout user (invalidate tokens - would require token blacklisting in production)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a production app, you would add the token to a blacklist
  // For now, we just return success and let the client remove the token
  
  res.json({
    message: 'Logged out successfully'
  });
});