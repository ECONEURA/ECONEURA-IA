import { Router } from 'express';
import { validateRequest } from '../middleware/validation.middleware.js';
import { z } from 'zod';
export const createUserRoutes = (userController) => {
    const router = Router();
    router.post('/', validateRequest({
        body: z.object({
            email: z.string().email(),
            password: z.string().min(8),
            firstName: z.string().min(2),
            lastName: z.string().min(2),
            role: z.enum(['admin', 'manager', 'editor', 'viewer']),
            organizationId: z.string().uuid()
        })
    }), userController.createUser.bind(userController));
    router.put('/:userId', validateRequest({
        params: z.object({
            userId: z.string().uuid()
        }),
        body: z.object({
            firstName: z.string().min(2).optional(),
            lastName: z.string().min(2).optional(),
            role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
            status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional()
        })
    }), userController.updateUser.bind(userController));
    router.delete('/:userId', validateRequest({
        params: z.object({
            userId: z.string().uuid()
        })
    }), userController.deleteUser.bind(userController));
    router.get('/:userId', validateRequest({
        params: z.object({
            userId: z.string().uuid()
        })
    }), userController.getUserById.bind(userController));
    router.get('/email/:email', validateRequest({
        params: z.object({
            email: z.string().email()
        })
    }), userController.getUserByEmail.bind(userController));
    router.get('/organization/:organizationId', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), userController.getUsersByOrganization.bind(userController));
    router.get('/organization/:organizationId/search', validateRequest({
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
    }), userController.searchUsers.bind(userController));
    router.get('/organization/:organizationId/stats', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), userController.getUserStats.bind(userController));
    router.put('/bulk/update', validateRequest({
        body: z.object({
            userIds: z.array(z.string().uuid()).min(1).max(100),
            updates: z.object({
                firstName: z.string().min(2).optional(),
                lastName: z.string().min(2).optional(),
                role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
                status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional()
            })
        })
    }), userController.bulkUpdateUsers.bind(userController));
    router.delete('/bulk/delete', validateRequest({
        body: z.object({
            userIds: z.array(z.string().uuid()).min(1).max(100)
        })
    }), userController.bulkDeleteUsers.bind(userController));
    router.get('/organization/:organizationId/count', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), userController.getOrganizationUserCount.bind(userController));
    router.get('/organization/:organizationId/limit', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), userController.getOrganizationUserLimit.bind(userController));
    router.get('/organization/:organizationId/can-add', validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), userController.canOrganizationAddUser.bind(userController));
    router.post('/:userId/login', validateRequest({
        params: z.object({
            userId: z.string().uuid()
        })
    }), userController.recordUserLogin.bind(userController));
    router.put('/:userId/activity', validateRequest({
        params: z.object({
            userId: z.string().uuid()
        })
    }), userController.updateUserLastActivity.bind(userController));
    return router;
};
//# sourceMappingURL=user.routes.js.map