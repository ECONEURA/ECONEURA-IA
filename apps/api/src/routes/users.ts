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
