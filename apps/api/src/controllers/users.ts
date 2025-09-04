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
