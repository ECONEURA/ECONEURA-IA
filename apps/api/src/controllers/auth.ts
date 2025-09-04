import { Request, Response } from 'express';
import { JWTService } from '@econeura/shared/auth/jwt';
import { authRequestSchema } from '@econeura/shared/auth/types';
import { db } from '@econeura/db';
import { users } from '@econeura/db/schemas';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const authController = {
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = authRequestSchema.parse(req.body);

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        organizationId: 'org_1', // TODO: Get from user's organization
        role: 'user', // TODO: Get from user's role
        permissions: ['read', 'write'], // TODO: Get from user's permissions
      };

      const token = JWTService.generateToken(tokenPayload);
      const refreshToken = JWTService.generateRefreshToken(tokenPayload);

      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'user',
          organizationId: 'org_1',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      const payload = JWTService.verifyRefreshToken(refreshToken);
      const newToken = JWTService.generateToken({
        userId: payload.userId,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
        permissions: payload.permissions,
      });

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  },

  logout: (req: Request, res: Response): void => {
    // In a real app, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
  },

  getCurrentUser: (req: Request, res: Response): void => {
    // This would be called after authenticateToken middleware
    const user = (req as any).user;
    res.json({ user });
  },
};
