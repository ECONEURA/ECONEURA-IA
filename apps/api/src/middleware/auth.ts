import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@econeura/db';

interface TokenPayload {
  userId: string;
  orgId: string;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const withTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgId } = req.user as TokenPayload;

    // Verificar que la organización existe
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Establecer el tenant ID para RLS
    await prisma.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;

    next();
  } catch (error) {
    console.error('Error in tenant middleware:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
