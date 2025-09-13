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

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

  // attach typed user payload to the request in a safe manner
  (req as Request & { user?: TokenPayload }).user = decoded;
    next();
  } catch (error) {
    const errName = (error && typeof error === 'object' && 'name' in error && typeof (error as Record<string, unknown>)['name'] === 'string')
      ? String((error as Record<string, unknown>)['name'])
      : undefined;
    if (errName === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const withTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: TokenPayload }).user;
    const orgId = user?.orgId;

    if (!orgId) {
      return res.status(400).json({ message: 'Missing orgId in token' });
    }

    // Verificar que la organizaci3n existe
    const org = await prisma.organization?.findUnique({ where: { id: orgId } });

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
