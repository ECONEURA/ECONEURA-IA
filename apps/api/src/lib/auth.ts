import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  orgId: string;
  roles: string[];
}

class AuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
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
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          error: 'No token provided',
          code: 'AUTH_NO_TOKEN'
        });
      }

      const payload = await authService.validateToken(token);
      
      // Enriquecer request con información de usuario
      req.user = payload;
      
      // Establecer contexto de tenant
      await authService.setTenantContext(payload.orgId);
      
      // Limpiar contexto al finalizar
      res.on('finish', async () => {
        await authService.clearTenantContext();
      });

      next();
    } catch (error) {
      return res.status(401).json({
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
      const { userId } = req.user as TokenPayload;
      
      const hasPermission = await prismaAuth.validatePermissions(
        userId,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
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

// Instancia del servicio de autenticación
const prisma = new PrismaClient();
export const prismaAuth = new AuthService(prisma);
