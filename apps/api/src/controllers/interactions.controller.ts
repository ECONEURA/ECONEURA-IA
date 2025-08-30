import { Request, Response } from "express";
import { db } from "../lib/db.js";
import { interactions } from "@econeura/db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { CreateInteractionSchema, UpdateInteractionSchema } from "@econeura/shared/schemas/crm.js";
import { logger } from "../lib/logger.js";

export const getInteractions = async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Missing Organization ID',
        message: 'Organization ID is required in headers'
      });
    }

    const result = await db
      .select()
      .from(interactions)
      .where(eq(interactions.orgId, orgId))
      .orderBy(desc(interactions.createdAt));

    logger.info('Interactions fetched successfully', {
      org: orgId,
      endpoint: req.path,
      method: req.method
    });

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    logger.error('Error fetching interactions', {
      org: req.headers['x-org-id'] as string,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch interactions'
    });
  }
};

export const getInteraction = async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Missing Organization ID',
        message: 'Organization ID is required in headers'
      });
    }

    const result = await db
      .select()
      .from(interactions)
      .where(and(eq(interactions.id, id), eq(interactions.orgId, orgId)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Interaction Not Found',
        message: 'The requested interaction was not found'
      });
    }

    logger.info('Interaction fetched successfully', {
      org: orgId,
      endpoint: req.path,
      method: req.method
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching interaction', {
      org: req.headers['x-org-id'] as string,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch interaction'
    });
  }
};

export const createInteraction = async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Missing Organization ID',
        message: 'Organization ID is required in headers'
      });
    }

    const validation = CreateInteractionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid interaction data',
        details: validation.error.errors
      });
    }

    const interactionData = {
      ...validation.data,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db
      .insert(interactions)
      .values(interactionData)
      .returning();

    logger.info('Interaction created successfully', {
      org: orgId,
      endpoint: req.path,
      method: req.method
    });

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error creating interaction', {
      org: req.headers['x-org-id'] as string,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create interaction'
    });
  }
};

export const updateInteraction = async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Missing Organization ID',
        message: 'Organization ID is required in headers'
      });
    }

    const validation = UpdateInteractionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid interaction data',
        details: validation.error.errors
      });
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date()
    };

    const result = await db
      .update(interactions)
      .set(updateData)
      .where(and(eq(interactions.id, id), eq(interactions.orgId, orgId)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Interaction Not Found',
        message: 'The requested interaction was not found'
      });
    }

    logger.info('Interaction updated successfully', {
      org: orgId,
      endpoint: req.path,
      method: req.method
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error updating interaction', {
      org: req.headers['x-org-id'] as string,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update interaction'
    });
  }
};

export const deleteInteraction = async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Missing Organization ID',
        message: 'Organization ID is required in headers'
      });
    }

    const result = await db
      .delete(interactions)
      .where(and(eq(interactions.id, id), eq(interactions.orgId, orgId)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Interaction Not Found',
        message: 'The requested interaction was not found'
      });
    }

    logger.info('Interaction deleted successfully', {
      org: orgId,
      endpoint: req.path,
      method: req.method
    });

    res.json({
      success: true,
      message: 'Interaction deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting interaction', {
      org: req.headers['x-org-id'] as string,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete interaction'
    });
  }
};

export const getInteractionSummary = async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Missing Organization ID',
        message: 'Organization ID is required in headers'
      });
    }

    // Obtener todas las interacciones de la organización
    const allInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.orgId, orgId))
      .orderBy(desc(interactions.createdAt));

    if (allInteractions.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: "No interactions found for this organization.",
          totalInteractions: 0,
          recentActivity: [],
          insights: []
        }
      });
    }

    // Generar resumen con IA (simulado por ahora)
    const summary = `Total interactions: ${allInteractions.length}. Recent activity shows ${allInteractions.slice(0, 5).length} interactions in the last period.`;

    // Actividad reciente
    const recentActivity = allInteractions.slice(0, 10).map(interaction => ({
      id: interaction.id,
      type: interaction.type,
      content: interaction.content?.substring(0, 100) + '...',
      createdAt: interaction.createdAt
    }));

    // Insights básicos
    const insights = [
      `Total interactions: ${allInteractions.length}`,
      `Most recent: ${allInteractions[0]?.createdAt.toLocaleDateString()}`,
      `Types: ${[...new Set(allInteractions.map(i => i.type))].join(', ')}`
    ];

    logger.info('Interaction summary generated successfully', {
      org: orgId,
      endpoint: req.path,
      method: req.method
    });

    res.json({
      success: true,
      data: {
        summary,
        totalInteractions: allInteractions.length,
        recentActivity,
        insights
      }
    });
  } catch (error) {
    logger.error('Error generating interaction summary', {
      org: req.headers['x-org-id'] as string,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate interaction summary'
    });
  }
};
