import { Request, Response } from 'express';
import { db } from '../lib/db';
import { interactions } from '@econeura/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { CreateInteractionSchema, UpdateInteractionSchema } from '@econeura/shared/schemas/crm';
import { createProblem } from '../lib/problem';
import { logger } from '../lib/logger';
import { aiService } from '../services/ai.service';
import { notificationService } from '../services/notification.service';
import { workflowService } from '../services/workflow.service';

export class InteractionsController {
  // Get all interactions with filters
  async getInteractions(req: Request, res: Response) {
    try {
      const { 
        company_id, 
        contact_id, 
        deal_id, 
        type, 
        status, 
        assigned_to,
        limit = 50,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      // Build where conditions
      const whereConditions = [eq(interactions.org_id, orgId)];
      
      if (company_id) whereConditions.push(eq(interactions.company_id, company_id as string));
      if (contact_id) whereConditions.push(eq(interactions.contact_id, contact_id as string));
      if (deal_id) whereConditions.push(eq(interactions.deal_id, deal_id as string));
      if (type) whereConditions.push(eq(interactions.type, type as string));
      if (status) whereConditions.push(eq(interactions.status, status as string));
      if (assigned_to) whereConditions.push(eq(interactions.assigned_to, assigned_to as string));

      // Build order by
      const orderBy = sort_order === 'asc' 
        ? asc(interactions[sort_by as keyof typeof interactions])
        : desc(interactions[sort_by as keyof typeof interactions]);

      const results = await db
        .select()
        .from(interactions)
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(Number(limit))
        .offset(Number(offset));

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(interactions)
        .where(and(...whereConditions));

      res.json({
        data: results,
        pagination: {
          total: total[0].count,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total[0].count
        }
      });
    } catch (error) {
      logger.error('Error fetching interactions:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch interactions',
        status: 500
      }));
    }
  }

  // Get single interaction
  async getInteraction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const result = await db
        .select()
        .from(interactions)
        .where(and(
          eq(interactions.id, id),
          eq(interactions.org_id, orgId)
        ))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Interaction Not Found',
          detail: 'The requested interaction was not found',
          status: 404
        }));
      }

      res.json({ data: result[0] });
    } catch (error) {
      logger.error('Error fetching interaction:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to fetch interaction',
        status: 500
      }));
    }
  }

  // Create new interaction
  async createInteraction(req: Request, res: Response) {
    try {
      const orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!orgId || !userId) {
        return res.status(400).json(createProblem({
          title: 'Missing Required Headers',
          detail: 'Organization ID and User ID are required in headers',
          status: 400
        }));
      }

      const validation = CreateInteractionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(createProblem({
          title: 'Validation Error',
          detail: 'Invalid interaction data',
          status: 400,
          errors: validation.error.errors
        }));
      }

      const interactionData = {
        ...validation.data,
        org_id: orgId,
        created_by: userId
      };

      const result = await db
        .insert(interactions)
        .values(interactionData)
        .returning();

      logger.info('Interaction created:', { id: result[0].id, orgId, userId });
      res.status(201).json({ data: result[0] });
    } catch (error) {
      logger.error('Error creating interaction:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to create interaction',
        status: 500
      }));
    }
  }

  // Update interaction
  async updateInteraction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const validation = UpdateInteractionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(createProblem({
          title: 'Validation Error',
          detail: 'Invalid interaction data',
          status: 400,
          errors: validation.error.errors
        }));
      }

      const result = await db
        .update(interactions)
        .set({
          ...validation.data,
          updated_at: new Date()
        })
        .where(and(
          eq(interactions.id, id),
          eq(interactions.org_id, orgId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Interaction Not Found',
          detail: 'The requested interaction was not found',
          status: 404
        }));
      }

      logger.info('Interaction updated:', { id, orgId });
      res.json({ data: result[0] });
    } catch (error) {
      logger.error('Error updating interaction:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to update interaction',
        status: 500
      }));
    }
  }

  // Delete interaction
  async deleteInteraction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      const result = await db
        .delete(interactions)
        .where(and(
          eq(interactions.id, id),
          eq(interactions.org_id, orgId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json(createProblem({
          title: 'Interaction Not Found',
          detail: 'The requested interaction was not found',
          status: 404
        }));
      }

      logger.info('Interaction deleted:', { id, orgId });
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting interaction:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to delete interaction',
        status: 500
      }));
    }
  }

  // Get AI summary of interactions
  async getInteractionSummary(req: Request, res: Response) {
    try {
      const { company_id, contact_id, deal_id, days = 30 } = req.query;
      const orgId = req.headers['x-org-id'] as string;

      if (!orgId) {
        return res.status(400).json(createProblem({
          title: 'Missing Organization ID',
          detail: 'Organization ID is required in headers',
          status: 400
        }));
      }

      // Build where conditions
      const whereConditions = [eq(interactions.org_id, orgId)];
      
      if (company_id) whereConditions.push(eq(interactions.company_id, company_id as string));
      if (contact_id) whereConditions.push(eq(interactions.contact_id, contact_id as string));
      if (deal_id) whereConditions.push(eq(interactions.deal_id, deal_id as string));

      // Get interactions from last N days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));
      whereConditions.push(sql`${interactions.created_at} >= ${daysAgo}`);

      const results = await db
        .select()
        .from(interactions)
        .where(and(...whereConditions))
        .orderBy(desc(interactions.created_at));

      if (results.length === 0) {
        return res.json({
          data: {
            summary: 'No interactions found for the specified period.',
            insights: [],
            recommendations: []
          }
        });
      }

      // Prepare data for AI analysis
      const interactionsText = results.map(interaction => 
        `${interaction.type.toUpperCase()}: ${interaction.subject || 'No subject'} - ${interaction.content || 'No content'} (${interaction.status})`
      ).join('\n');

      const prompt = `
        Analyze the following CRM interactions and provide:
        1. A concise summary of the key activities
        2. 3-5 insights about patterns or trends
        3. 3-5 actionable recommendations for follow-up

        Interactions:
        ${interactionsText}

        Please format the response as JSON with keys: summary, insights, recommendations
      `;

      const aiResponse = await aiService.generateText(prompt, {
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.3
      });

      let summary;
      try {
        summary = JSON.parse(aiResponse);
      } catch {
        // Fallback if AI response is not valid JSON
        summary = {
          summary: aiResponse,
          insights: ['AI analysis completed but response format was unexpected'],
          recommendations: ['Review interactions manually for detailed insights']
        };
      }

      res.json({ data: summary });
    } catch (error) {
      logger.error('Error generating interaction summary:', error);
      res.status(500).json(createProblem({
        title: 'Internal Server Error',
        detail: 'Failed to generate interaction summary',
        status: 500
      }));
    }
  }
}
