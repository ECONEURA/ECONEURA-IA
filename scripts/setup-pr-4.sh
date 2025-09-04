#!/bin/bash
# PR-4: Authentication and Authorization Setup

set -e

echo "🔐 Setting up Authentication and Authorization (PR-4)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create auth types
print_status "Creating authentication types..."
mkdir -p packages/shared/src/auth

cat > packages/shared/src/auth/types.ts << 'EOF'
import { z } from 'zod';

// JWT Payload Schema
export const jwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().uuid(),
  role: z.enum(['admin', 'user', 'viewer']),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

// Auth Request Schema
export const authRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthRequest = z.infer<typeof authRequestSchema>;

// Auth Response Schema
export const authResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['admin', 'user', 'viewer']),
    organizationId: z.string().uuid(),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
EOF

# Create JWT service
cat > packages/shared/src/auth/jwt.ts << 'EOF'
import jwt from 'jsonwebtoken';
import { JWTPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class JWTService {
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}
EOF

# Create auth index
cat > packages/shared/src/auth/index.ts << 'EOF'
export * from './types';
export * from './jwt';
EOF

# Create API middleware
print_status "Creating API middleware..."
mkdir -p apps/api/src/middleware

cat > apps/api/src/middleware/auth.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { JWTService } from '@econeura/shared/auth/jwt';
import { jwtPayloadSchema } from '@econeura/shared/auth/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
    permissions: string[];
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = JWTService.verifyToken(token);
    const validatedPayload = jwtPayloadSchema.parse(payload);
    
    req.user = {
      userId: validatedPayload.userId,
      email: validatedPayload.email,
      organizationId: validatedPayload.organizationId,
      role: validatedPayload.role,
      permissions: validatedPayload.permissions,
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
EOF

# Create organization middleware
cat > apps/api/src/middleware/organization.ts << 'EOF'
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
EOF

# Create rate limiting middleware
cat > apps/api/src/middleware/rate-limit.ts << 'EOF'
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiting (stricter)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: {
    error: 'Too many API requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
EOF

# Create security middleware
cat > apps/api/src/middleware/security.ts << 'EOF'
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'https://www.econeura.com',
      'https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Organization-ID',
    'X-Organization-Tier',
  ],
};
EOF

# Install dependencies
print_status "Installing authentication dependencies..."
pnpm add -w jsonwebtoken @types/jsonwebtoken express-rate-limit helmet

print_success "✅ PR-4: Authentication and Authorization Complete!"
print_status "Next steps:"
echo "  1. Set JWT secrets in environment variables"
echo "  2. Configure CORS origins in Azure Portal"
echo "  3. Test authentication endpoints"
echo "  4. Continue with PR-5: API Core"

echo ""
print_status "🎯 PR-4 Implementation Summary:"
echo "  ✓ JWT authentication system created"
echo "  ✓ Authorization middleware implemented"
echo "  ✓ Organization-based access control"
echo "  ✓ Rate limiting configured"
echo "  ✓ Security headers configured"
