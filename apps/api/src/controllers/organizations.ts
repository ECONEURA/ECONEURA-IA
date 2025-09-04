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
