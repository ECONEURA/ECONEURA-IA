import type { PrismaClient as PrismaClientType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@econeura/db';

interface TokenPayload {
  userId: string;
  orgId: string;
  roles: string[];
}

class AuthService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(
        token, 
        process.env.JWT_SECRET as string
      ) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async validatePermissions(userId: string, resource: string, action: string): Promise<boolean> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId }
    });

    return userPermissions.some(
      perm => perm.resource === resource && perm.action === action
    );
  }

  async setTenantContext(orgId: string) {
    await this.prisma.$executeRaw`
      BEGIN;
      SELECT set_config('app.current_tenant', ${orgId}, true);
      SELECT set_config('app.timestamp', NOW()::text, true);
    `;
  }

  async clearTenantContext() {
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_tenant', '', true);
      SELECT set_config('app.timestamp', '', true);
      COMMIT;
    `;
  }
}

// Middleware de autenticación mejorado
export const authenticate = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
  const token = (req as any).headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return (res as any).status(401).json({ 
          error: 'No token provided',
          code: 'AUTH_NO_TOKEN'
        });
      }

      const payload = await authService.validateToken(token);
      
      // Enriquecer request con información de usuario
  (req as any).user = payload;
      
      // Establecer contexto de tenant
  await authService.setTenantContext(payload.orgId);
      
      // Limpiar contexto al finalizar
      (res as any).on?.('finish', async () => {
        await authService.clearTenantContext();
      });

      next();
    } catch (error) {
      return (res as any).status(401).json({
        error: 'Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }
  };
};

// Middleware de autorización basado en roles/permisos
export const authorize = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
  const { userId } = (req as any).user as TokenPayload;
      
      const hasPermission = await prismaAuth.validatePermissions(
        userId,
        resource,
        action
      );

      if (!hasPermission) {
        return (res as any).status(403).json({
          error: 'Insufficient permissions',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Instancia del servicio de autenticación usando prisma exportado desde packages/db
export const prismaAuth = new AuthService(prisma as any);
