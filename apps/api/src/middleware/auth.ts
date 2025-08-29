import { Request, Response, NextFunction } from 'express'
import { setOrg } from '@econeura/db'
import { Problems } from './problem-json.js'

// Extend Request interface to include user and orgId
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        role: string
        orgId: string
      }
      orgId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error(Problems.unauthorized('Bearer token required'))
  }

  const token = authHeader.substring(7)
  
  try {
    // TODO: Implement JWT verification
    // For now, use a simple mock authentication
    const mockUser = {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
      role: 'user',
      orgId: req.headers['x-org-id'] as string || 'default-org'
    }
    
    req.user = mockUser
    req.orgId = mockUser.orgId
    
    next()
  } catch (error) {
    throw new Error(Problems.unauthorized('Invalid token'))
  }
}

export function requireOrg(req: Request, res: Response, next: NextFunction) {
  const orgId = req.headers['x-org-id'] as string || req.user?.orgId
  
  if (!orgId) {
    throw new Error(Problems.badRequest('Organization ID required'))
  }
  
  req.orgId = orgId
  next()
}

export async function setOrgContext(req: Request, res: Response, next: NextFunction) {
  if (req.orgId) {
    try {
      await setOrg(req.orgId)
      next()
    } catch (error) {
      throw new Error(Problems.internalError('Failed to set organization context'))
    }
  } else {
    next()
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new Error(Problems.unauthorized())
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      throw new Error(Problems.forbidden(`Role '${role}' required`))
    }
    
    next()
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // TODO: Implement JWT verification
      const mockUser = {
        id: 'mock-user-id',
        email: 'user@example.com',
        name: 'Mock User',
        role: 'user',
        orgId: req.headers['x-org-id'] as string || 'default-org'
      }
      
      req.user = mockUser
      req.orgId = mockUser.orgId
    } catch (error) {
      // Ignore auth errors for optional auth
    }
  }
  
  next()
}



