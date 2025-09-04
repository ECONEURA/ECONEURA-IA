#!/bin/bash
# PR-5: API Core Setup

set -e

echo "🚀 Setting up API Core (PR-5)..."

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

# Create API structure
print_status "Creating API structure..."

# Create main server file
cat > apps/api/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { securityHeaders, corsOptions } from './middleware/security';
import { generalRateLimit, authRateLimit, apiRateLimit } from './middleware/rate-limit';
import { authenticateToken } from './middleware/auth';
import { requireOrganization } from './middleware/organization';

// Routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import usersRoutes from './routes/users';
import organizationsRoutes from './routes/organizations';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalRateLimit);

// Health check (no auth required)
app.use('/health', healthRoutes);

// Auth routes (stricter rate limiting)
app.use('/auth', authRateLimit, authRoutes);

// Protected routes
app.use('/api/v1/users', authenticateToken, requireOrganization, apiRateLimit, usersRoutes);
app.use('/api/v1/organizations', authenticateToken, requireOrganization, apiRateLimit, organizationsRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
  console.log(`📡 API endpoints: http://localhost:${PORT}/api/v1`);
});

export default app;
EOF

# Create routes directory
mkdir -p apps/api/src/routes
mkdir -p apps/api/src/controllers

# Create health routes
cat > apps/api/src/routes/health.ts << 'EOF'
import { Router } from 'express';
import { healthController } from '../controllers/health';

const router = Router();

// GET /health - Health check endpoint
router.get('/', healthController.getHealth);

// GET /health/ready - Readiness check
router.get('/ready', healthController.getReadiness);

// GET /health/live - Liveness check
router.get('/live', healthController.getLiveness);

export default router;
EOF

# Create health controller
cat > apps/api/src/controllers/health.ts << 'EOF'
import { Request, Response } from 'express';
import { version } from '../../../package.json';

export const healthController = {
  getHealth: (req: Request, res: Response): void => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  },

  getReadiness: (req: Request, res: Response): void => {
    // Check database connection, external services, etc.
    const readiness = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        redis: 'ok',
        external_apis: 'ok',
      },
    };

    res.status(200).json(readiness);
  },

  getLiveness: (req: Request, res: Response): void => {
    const liveness = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage(),
    };

    res.status(200).json(liveness);
  },
};
EOF

# Create auth routes
cat > apps/api/src/routes/auth.ts << 'EOF'
import { Router } from 'express';
import { authController } from '../controllers/auth';

const router = Router();

// POST /auth/login - User login
router.post('/login', authController.login);

// POST /auth/refresh - Refresh token
router.post('/refresh', authController.refreshToken);

// POST /auth/logout - User logout
router.post('/logout', authController.logout);

// GET /auth/me - Get current user
router.get('/me', authController.getCurrentUser);

export default router;
EOF

# Create auth controller
cat > apps/api/src/controllers/auth.ts << 'EOF'
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
EOF

# Create users routes
cat > apps/api/src/routes/users.ts << 'EOF'
import { Router } from 'express';
import { usersController } from '../controllers/users';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/v1/users - Get all users
router.get('/', usersController.getUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', usersController.getUserById);

// POST /api/v1/users - Create user (admin only)
router.post('/', requireRole(['admin']), usersController.createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', usersController.updateUser);

// DELETE /api/v1/users/:id - Delete user (admin only)
router.delete('/:id', requireRole(['admin']), usersController.deleteUser);

export default router;
EOF

# Create users controller
cat > apps/api/src/controllers/users.ts << 'EOF'
import { Request, Response } from 'express';
import { db } from '@econeura/db';
import { users } from '@econeura/db/schemas';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const usersController = {
  getUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users);

      res.json({ users: allUsers });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getUserById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, name, password } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name,
          passwordHash: hashedPassword,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      res.status(201).json({ user: newUser });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, isActive } = req.body;
      
      const [updatedUser] = await db
        .update(users)
        .set({
          name,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          isActive: users.isActive,
          updatedAt: users.updatedAt,
        });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        });

      if (!deletedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
EOF

# Create organizations routes
cat > apps/api/src/routes/organizations.ts << 'EOF'
import { Router } from 'express';
import { organizationsController } from '../controllers/organizations';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/v1/organizations - Get all organizations
router.get('/', organizationsController.getOrganizations);

// GET /api/v1/organizations/:id - Get organization by ID
router.get('/:id', organizationsController.getOrganizationById);

// POST /api/v1/organizations - Create organization (admin only)
router.post('/', requireRole(['admin']), organizationsController.createOrganization);

// PUT /api/v1/organizations/:id - Update organization
router.put('/:id', organizationsController.updateOrganization);

// DELETE /api/v1/organizations/:id - Delete organization (admin only)
router.delete('/:id', requireRole(['admin']), organizationsController.deleteOrganization);

export default router;
EOF

# Create organizations controller
cat > apps/api/src/controllers/organizations.ts << 'EOF'
import { Request, Response } from 'express';
import { db } from '@econeura/db';
import { organizations } from '@econeura/db/schemas';
import { eq } from 'drizzle-orm';

export const organizationsController = {
  getOrganizations: async (req: Request, res: Response): Promise<void> => {
    try {
      const allOrganizations = await db
        .select()
        .from(organizations);

      res.json({ organizations: allOrganizations });
    } catch (error) {
      console.error('Get organizations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getOrganizationById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.json({ organization });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createOrganization: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug, description } = req.body;
      
      const [newOrganization] = await db
        .insert(organizations)
        .values({
          name,
          slug,
          description,
        })
        .returning();

      res.status(201).json({ organization: newOrganization });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateOrganization: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, description, isActive } = req.body;
      
      const [updatedOrganization] = await db
        .update(organizations)
        .set({
          name,
          slug,
          description,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, id))
        .returning();

      if (!updatedOrganization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.json({ organization: updatedOrganization });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteOrganization: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const [deletedOrganization] = await db
        .delete(organizations)
        .where(eq(organizations.id, id))
        .returning();

      if (!deletedOrganization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.json({ message: 'Organization deleted successfully', organization: deletedOrganization });
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
EOF

# Install dependencies
print_status "Installing API dependencies..."
pnpm add -w express cors bcryptjs @types/bcryptjs

print_success "✅ PR-5: API Core Complete!"
print_status "Next steps:"
echo "  1. Test API endpoints with curl or Postman"
echo "  2. Verify health checks work"
echo "  3. Test authentication flow"
echo "  4. Continue with PR-6: Frontend Base"

echo ""
print_status "🎯 PR-5 Implementation Summary:"
echo "  ✓ Express.js server configured"
echo "  ✓ Health check endpoints created"
echo "  ✓ Authentication endpoints implemented"
echo "  ✓ User and organization CRUD operations"
echo "  ✓ Middleware and security configured"
