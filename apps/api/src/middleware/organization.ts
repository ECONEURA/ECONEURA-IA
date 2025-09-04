import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const requireOrganization = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const organizationId = req.headers['x-organization-id'] as string;

  if (!organizationId) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.organizationId !== organizationId) {
    res.status(403).json({ error: 'Access denied to organization' });
    return;
  }

  next();
};

export const validateOrganizationAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const organizationId = req.params.organizationId || req.body.organizationId;

  if (!organizationId) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Admin users can access any organization
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Regular users can only access their own organization
  if (req.user.organizationId !== organizationId) {
    res.status(403).json({ error: 'Access denied to organization' });
    return;
  }

  next();
};
