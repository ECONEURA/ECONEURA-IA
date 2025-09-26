import { Router } from 'express';
import { z } from 'zod';

import { UserController } from '../controllers/user.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';

// ============================================================================
// USER ROUTES
// ============================================================================

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  // ========================================================================
  // USER MANAGEMENT ROUTES
  // ========================================================================

  // POST /users - Create user
  router.post('/',
    validateRequest({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        role: z.enum(['admin', 'manager', 'editor', 'viewer']),
        organizationId: z.string().uuid()
      })
    }),
    userController.createUser.bind(userController)
  );

  // PUT /users/:userId - Update user
  router.put('/:userId',
    validateRequest({
      params: z.object({
        userId: z.string().uuid()
      }),
      body: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
        status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional()
      })
    }),
    userController.updateUser.bind(userController)
  );

  // DELETE /users/:userId - Delete user
  router.delete('/:userId',
    validateRequest({
      params: z.object({
        userId: z.string().uuid()
      })
    }),
    userController.deleteUser.bind(userController)
  );

  // ========================================================================
  // USER QUERY ROUTES
  // ========================================================================

  // GET /users/:userId - Get user by ID
  router.get('/:userId',
    validateRequest({
      params: z.object({
        userId: z.string().uuid()
      })
    }),
    userController.getUserById.bind(userController)
  );

  // GET /users/email/:email - Get user by email
  router.get('/email/:email',
    validateRequest({
      params: z.object({
        email: z.string().email()
      })
    }),
    userController.getUserByEmail.bind(userController)
  );

  // GET /users/organization/:organizationId - Get users by organization
  router.get('/organization/:organizationId',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    userController.getUsersByOrganization.bind(userController)
  );

  // GET /users/organization/:organizationId/search - Search users
  router.get('/organization/:organizationId/search',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      }),
      query: z.object({
        query: z.string().optional(),
        role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
        status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    userController.searchUsers.bind(userController)
  );

  // ========================================================================
  // USER STATISTICS ROUTES
  // ========================================================================

  // GET /users/organization/:organizationId/stats - Get user statistics
  router.get('/organization/:organizationId/stats',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    userController.getUserStats.bind(userController)
  );

  // ========================================================================
  // BULK OPERATION ROUTES
  // ========================================================================

  // PUT /users/bulk/update - Bulk update users
  router.put('/bulk/update',
    validateRequest({
      body: z.object({
        userIds: z.array(z.string().uuid()).min(1).max(100),
        updates: z.object({
          firstName: z.string().min(2).optional(),
          lastName: z.string().min(2).optional(),
          role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
          status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional()
        })
      })
    }),
    userController.bulkUpdateUsers.bind(userController)
  );

  // DELETE /users/bulk/delete - Bulk delete users
  router.delete('/bulk/delete',
    validateRequest({
      body: z.object({
        userIds: z.array(z.string().uuid()).min(1).max(100)
      })
    }),
    userController.bulkDeleteUsers.bind(userController)
  );

  // ========================================================================
  // ORGANIZATION LIMIT ROUTES
  // ========================================================================

  // GET /users/organization/:organizationId/count - Get user count
  router.get('/organization/:organizationId/count',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    userController.getOrganizationUserCount.bind(userController)
  );

  // GET /users/organization/:organizationId/limit - Get user limit
  router.get('/organization/:organizationId/limit',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    userController.getOrganizationUserLimit.bind(userController)
  );

  // GET /users/organization/:organizationId/can-add - Check if can add user
  router.get('/organization/:organizationId/can-add',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    userController.canOrganizationAddUser.bind(userController)
  );

  // ========================================================================
  // USER ACTIVITY ROUTES
  // ========================================================================

  // POST /users/:userId/login - Record user login
  router.post('/:userId/login',
    validateRequest({
      params: z.object({
        userId: z.string().uuid()
      })
    }),
    userController.recordUserLogin.bind(userController)
  );

  // PUT /users/:userId/activity - Update user activity
  router.put('/:userId/activity',
    validateRequest({
      params: z.object({
        userId: z.string().uuid()
      })
    }),
    userController.updateUserLastActivity.bind(userController)
  );

  return router;
};
